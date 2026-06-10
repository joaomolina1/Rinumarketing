import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  getGeninuSettingsForUser,
  upsertGeninuSettingsForUser,
} from "@/lib/geninu/settings";
import { GENINU_MODELS } from "@/types/geninu";

const updateSchema = z.object({
  mode: z.enum(["plan", "execute", "auto"]).optional(),
  model: z.string().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const settings = await getGeninuSettingsForUser(user.id);
  return NextResponse.json({ settings, models: GENINU_MODELS });
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

  const validModel = GENINU_MODELS.some((m) => m.id === parsed.data.model);
  if (parsed.data.model && !validModel) {
    return NextResponse.json({ error: "Modelo inválido" }, { status: 400 });
  }

  const saved = await upsertGeninuSettingsForUser(user.id, parsed.data);
  return NextResponse.json({ settings: saved });
}
