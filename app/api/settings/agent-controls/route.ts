import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  getAgentSettingsForUser,
  upsertAgentSettingsForUser,
} from "@/lib/settings/agent-settings";
import { ACTION_TYPE_CATALOG } from "@/types/agent-settings";

const actionPolicySchema = z.enum(["auto", "ask", "block"]);
const validActionTypes = ACTION_TYPE_CATALOG.map((item) => item.key);

const updateSchema = z.object({
  mode: z.enum(["plan", "auto"]).optional(),
  agents_master_enabled: z.boolean().optional(),
  google_agent_enabled: z.boolean().optional(),
  meta_agent_enabled: z.boolean().optional(),
  analytics_agent_enabled: z.boolean().optional(),
  action_policies: z
    .record(z.string(), actionPolicySchema)
    .optional()
    .refine(
      (policies) =>
        !policies ||
        Object.keys(policies).every((key) =>
          validActionTypes.includes(key as (typeof validActionTypes)[number])
        ),
      { message: "action_policies contém tipos inválidos" }
    ),
  max_budget_increase_per_action_eur: z.number().min(0).optional(),
  max_daily_budget_increase_eur: z.number().min(0).optional(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const settings = await getAgentSettingsForUser(user.id);
  return NextResponse.json({ settings, catalog: ACTION_TYPE_CATALOG });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const saved = await upsertAgentSettingsForUser(user.id, parsed.data);
    return NextResponse.json({ settings: saved, catalog: ACTION_TYPE_CATALOG });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao guardar" },
      { status: 500 }
    );
  }
}
