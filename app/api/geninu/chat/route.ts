import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { runGeninuChat } from "@/lib/geninu/chat";
import {
  appendGeninuMessage,
  getGeninuSettingsForUser,
  getRecentGeninuMessages,
} from "@/lib/geninu/settings";
import { listAnthropicModels } from "@/lib/anthropic/models";

const chatSchema = z.object({
  message: z.string().trim().min(1).max(8000),
});

export const maxDuration = 120;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [settings, messages, models] = await Promise.all([
    getGeninuSettingsForUser(user.id),
    getRecentGeninuMessages(user.id),
    listAnthropicModels(),
  ]);

  return NextResponse.json({ settings, messages, models });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Mensagem inválida" }, { status: 400 });
  }

  const settings = await getGeninuSettingsForUser(user.id);
  const history = await getRecentGeninuMessages(user.id, 20);

  const messages = [
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: parsed.data.message },
  ];

  try {
    const reply = await runGeninuChat({
      messages,
      mode: settings.mode,
      model: settings.model,
      userId: user.id,
    });

    await appendGeninuMessage(user.id, "user", parsed.data.message);
    await appendGeninuMessage(user.id, "assistant", reply);

    return NextResponse.json({ reply, settings });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao processar mensagem" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await supabase.from("geninu_messages").delete().eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
