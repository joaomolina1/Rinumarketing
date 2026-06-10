import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  getGeninuSettingsForUser,
  upsertGeninuSettingsForUser,
} from "@/lib/geninu/settings";
import { isAllowedAnthropicModel, listAnthropicModels } from "@/lib/anthropic/models";

const updateSchema = z.object({
  mode: z.enum(["plan", "execute", "auto"]).optional(),
  model: z.string().min(1).max(120).optional(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [settings, models] = await Promise.all([
    getGeninuSettingsForUser(user.id),
    listAnthropicModels(),
  ]);

  return NextResponse.json({ settings, models });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.model && !(await isAllowedAnthropicModel(parsed.data.model))) {
    return NextResponse.json(
      { error: "Modelo não disponível para a tua chave Anthropic" },
      { status: 400 }
    );
  }

  const saved = await upsertGeninuSettingsForUser(user.id, parsed.data);
  const models = await listAnthropicModels();
  return NextResponse.json({ settings: saved, models });
}
