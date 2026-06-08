import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { executeAction } from "@/lib/agents/execute-action";
import { getOwnerAgentSettings } from "@/lib/settings/agent-settings";

const schema = z.object({
  action_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input inválido" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data: action, error: fetchError } = await admin
    .from("agent_actions")
    .select("*")
    .eq("id", parsed.data.action_id)
    .eq("status", "approved")
    .single();

  if (fetchError || !action) {
    return NextResponse.json(
      { error: "Acção não encontrada ou não aprovada" },
      { status: 404 }
    );
  }

  const settings = await getOwnerAgentSettings();

  try {
    const result = await executeAction(
      {
        action_type: action.action_type,
        platform: action.platform,
        entity_type: action.entity_type,
        entity_id: action.entity_id,
        proposed_value: (action.proposed_value as Record<string, unknown>) ?? {},
        current_value: (action.current_value as Record<string, unknown>) ?? {},
        risk_level: action.risk_level ?? undefined,
      },
      settings
    );

    if (!result.success) {
      await admin
        .from("agent_actions")
        .update({
          status: "failed",
          execution_result: { error: result.message ?? "Bloqueado pelos guardrails" },
        })
        .eq("id", action.id);

      return NextResponse.json(
        { error: result.message ?? "Execução bloqueada pelos guardrails" },
        { status: 403 }
      );
    }

    await admin
      .from("agent_actions")
      .update({
        status: "executed",
        executed_at: new Date().toISOString(),
        execution_result: result as unknown as import("@/types/database").Json,
      })
      .eq("id", action.id);

    return NextResponse.json({ action_id: action.id, result });
  } catch (err) {
    await admin
      .from("agent_actions")
      .update({
        status: "failed",
        execution_result: { error: err instanceof Error ? err.message : "Erro" },
      })
      .eq("id", action.id);

    return NextResponse.json({ error: "Falha na execução" }, { status: 500 });
  }
}
