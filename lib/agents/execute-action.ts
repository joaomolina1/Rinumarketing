import { adjustBid, pauseEntity } from "@/lib/integrations/google-ads";
import { pauseAd, updateCampaignBudget } from "@/lib/integrations/meta-ads";
import type { AgentAction } from "@/types/agents";
import type { AgentSettings } from "@/types/agent-settings";
import { canExecuteAction } from "@/lib/agents/guardrails";

export interface ExecutableAction {
  action_type: string;
  platform: string;
  entity_type: string;
  entity_id: string;
  proposed_value: Record<string, unknown>;
  current_value: Record<string, unknown>;
  risk_level?: string;
}

export function toAgentAction(row: ExecutableAction): AgentAction {
  return {
    action_type: row.action_type,
    platform: row.platform as AgentAction["platform"],
    entity_type: row.entity_type as AgentAction["entity_type"],
    entity_id: row.entity_id,
    current_value: row.current_value ?? {},
    proposed_value: row.proposed_value ?? {},
    reasoning: "",
    expected_impact: "",
    risk_level: (row.risk_level as AgentAction["risk_level"]) ?? "medium",
  };
}

export async function executeAction(
  action: ExecutableAction,
  settings: AgentSettings
): Promise<{ success: boolean; message?: string }> {
  const guard = canExecuteAction(toAgentAction(action), settings);
  if (!guard.allowed) {
    return { success: false, message: guard.reason };
  }

  if (action.platform === "google") {
    if (action.action_type === "adjust_bid") {
      return adjustBid(
        action.entity_type as "keyword" | "ad_group",
        action.entity_id,
        (action.proposed_value.adjustment_percent as number) ?? 0
      );
    }
    if (action.action_type.includes("pause")) {
      return pauseEntity(
        action.entity_type as "campaign" | "ad_group" | "keyword",
        action.entity_id
      );
    }
  }

  if (action.platform === "meta") {
    if (action.action_type.includes("pause")) {
      const result = await pauseAd(action.entity_id);
      return { success: result.success, message: result.success ? "Anúncio pausado" : "Falha ao pausar" };
    }
    if (action.action_type === "change_budget") {
      const amount = (action.proposed_value.amount_eur as number) ?? 0;
      const result = await updateCampaignBudget(action.entity_id, amount);
      return {
        success: result.success,
        message: result.success ? "Budget atualizado" : "Falha ao atualizar budget",
      };
    }
  }

  if (action.action_type === "refresh_creative") {
    return {
      success: false,
      message:
        "Renovar criativo não tem execução automática — trata manualmente no gestor de anúncios.",
    };
  }

  return { success: false, message: `Tipo de ação não suportado: ${action.action_type}` };
}
