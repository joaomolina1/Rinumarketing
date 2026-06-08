import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { adjustBid, pauseEntity } from "@/lib/integrations/google-ads";
import { pauseAd, updateCampaignBudget } from "@/lib/integrations/meta-ads";

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
    return NextResponse.json({ error: "Acção não encontrada ou não aprovada" }, { status: 404 });
  }

  let result: { success: boolean; message?: string } = { success: false };

  try {
    if (action.platform === "google") {
      if (action.action_type === "adjust_bid") {
        result = await adjustBid(
          action.entity_type as "keyword" | "ad_group",
          action.entity_id,
          (action.proposed_value as { adjustment_percent?: number })?.adjustment_percent ?? 0
        );
      } else if (action.action_type.includes("pause")) {
        result = await pauseEntity(
          action.entity_type as "campaign" | "ad_group" | "keyword",
          action.entity_id
        );
      }
    } else if (action.platform === "meta") {
      if (action.action_type.includes("pause")) {
        result = await pauseAd(action.entity_id);
      } else if (action.action_type === "change_budget") {
        const amount = (action.proposed_value as { amount_eur?: number })?.amount_eur ?? 0;
        result = await updateCampaignBudget(action.entity_id, amount);
      }
    }

    await admin
      .from("agent_actions")
      .update({
        status: result.success ? "executed" : "failed",
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
