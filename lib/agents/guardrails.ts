import type { AgentAction } from "@/types/agents";
import type {
  ActionPolicy,
  ActionType,
  AgentSettings,
} from "@/types/agent-settings";
import { DEFAULT_ACTION_POLICIES } from "@/types/agent-settings";

export type GuardrailDecision = "auto" | "ask" | "blocked";

export interface GuardrailContext {
  budgetAutoCommittedEur?: number;
}

export function getBudgetDelta(action: AgentAction): number {
  if (action.action_type !== "change_budget") return 0;
  const proposed = (action.proposed_value.amount_eur as number) ?? 0;
  const current = (action.current_value.amount_eur as number) ?? 0;
  return Math.abs(proposed - current);
}

export function getActionPolicy(
  actionType: string,
  settings: AgentSettings
): ActionPolicy {
  const key = actionType as ActionType;
  return (
    settings.action_policies[key] ??
    DEFAULT_ACTION_POLICIES[key] ??
    "ask"
  );
}

export function isPlatformAgentEnabled(
  platform: AgentAction["platform"],
  settings: AgentSettings
): boolean {
  if (platform === "google") return settings.google_agent_enabled;
  if (platform === "meta") return settings.meta_agent_enabled;
  return true;
}

function isBudgetWithinCaps(
  action: AgentAction,
  settings: AgentSettings,
  context?: GuardrailContext
): { ok: boolean; reason: string } {
  if (action.action_type !== "change_budget") {
    return { ok: true, reason: "" };
  }

  const delta = getBudgetDelta(action);
  if (delta > settings.max_budget_increase_per_action_eur) {
    return {
      ok: false,
      reason: `Aumento de €${delta.toFixed(2)} excede o teto por ação (€${settings.max_budget_increase_per_action_eur})`,
    };
  }

  const committed = context?.budgetAutoCommittedEur ?? 0;
  if (committed + delta > settings.max_daily_budget_increase_eur) {
    return {
      ok: false,
      reason: `Aumento agregado excede o teto diário (€${settings.max_daily_budget_increase_eur})`,
    };
  }

  return { ok: true, reason: "" };
}

export function evaluateAction(
  action: AgentAction,
  settings: AgentSettings,
  context?: GuardrailContext
): { decision: GuardrailDecision; reason: string } {
  if (!settings.agents_master_enabled) {
    return { decision: "blocked", reason: "Agentes pausados pelo utilizador" };
  }

  if (!isPlatformAgentEnabled(action.platform, settings)) {
    return {
      decision: "blocked",
      reason: `Agente ${action.platform} desligado`,
    };
  }

  const policy = getActionPolicy(action.action_type, settings);
  if (policy === "block") {
    return { decision: "blocked", reason: "Ação bloqueada nas definições" };
  }

  if (settings.mode === "plan") {
    return { decision: "ask", reason: "Modo de planeamento — requer aprovação" };
  }

  if (action.risk_level === "high") {
    return { decision: "ask", reason: "Risco elevado — requer aprovação" };
  }

  const budgetCheck = isBudgetWithinCaps(action, settings, context);
  if (!budgetCheck.ok) {
    return { decision: "ask", reason: budgetCheck.reason };
  }

  if (policy === "auto") {
    return { decision: "auto", reason: "Política automática" };
  }

  return { decision: "ask", reason: "Política requer aprovação" };
}

export function canExecuteAction(
  action: AgentAction,
  settings: AgentSettings,
  context?: GuardrailContext
): { allowed: boolean; reason: string } {
  if (!settings.agents_master_enabled) {
    return { allowed: false, reason: "Agentes pausados pelo utilizador" };
  }

  if (!isPlatformAgentEnabled(action.platform, settings)) {
    return {
      allowed: false,
      reason: `Agente ${action.platform} desligado`,
    };
  }

  const policy = getActionPolicy(action.action_type, settings);
  if (policy === "block") {
    return { allowed: false, reason: "Ação bloqueada nas definições" };
  }

  const budgetCheck = isBudgetWithinCaps(action, settings, context);
  if (!budgetCheck.ok) {
    return { allowed: false, reason: budgetCheck.reason };
  }

  return { allowed: true, reason: "" };
}

export function classifyActions(
  actions: AgentAction[],
  settings: AgentSettings
): {
  requiresApproval: AgentAction[];
  autoApproved: AgentAction[];
  blockedAlerts: string[];
} {
  const requiresApproval: AgentAction[] = [];
  const autoApproved: AgentAction[] = [];
  const blockedAlerts: string[] = [];
  let budgetAutoCommitted = 0;

  for (const action of actions) {
    const result = evaluateAction(action, settings, {
      budgetAutoCommittedEur: budgetAutoCommitted,
    });

    if (result.decision === "blocked") {
      blockedAlerts.push(
        `Bloqueado: ${action.action_type} em ${action.entity_name ?? action.entity_id} — ${result.reason}`
      );
    } else if (result.decision === "ask") {
      requiresApproval.push(action);
    } else {
      autoApproved.push(action);
      budgetAutoCommitted += getBudgetDelta(action);
    }
  }

  return { requiresApproval, autoApproved, blockedAlerts };
}
