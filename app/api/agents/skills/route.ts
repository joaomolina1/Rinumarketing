import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { MAX_SKILL_CONTENT_LENGTH } from "@/types/agent-skills";

const scopeSchema = z.enum(["all", "google", "meta", "analytics", "orchestrator"]);

const createSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório").max(120),
  description: z.string().trim().max(280).optional().nullable(),
  content: z.string().max(MAX_SKILL_CONTENT_LENGTH).default(""),
  applies_to: z.array(scopeSchema).min(1).default(["all"]),
  enabled: z.boolean().default(true),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data, error } = await supabase
    .from("agent_skills")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ skills: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("agent_skills")
    .insert({ ...parsed.data, user_id: user.id })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ skill: data });
}
