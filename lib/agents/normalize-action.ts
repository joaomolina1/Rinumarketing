import type { AgentAction, Platform, RiskLevel } from "@/types/agents";

const EXECUTABLE_ACTION_TYPES = new Set([
  "adjust_bid",
  "pause_zero_conversion_keyword",
  "pause_entity",
  "pause_ad",
  "change_budget",
  "refresh_creative",
]);

function mapActionType(raw: string): string {
  const key = raw.toLowerCase().replace(/\s+/g, "_");

  if (key.includes("pause") && (key.includes("ad") || key.includes("creative"))) {
    return "pause_ad";
  }
  if (key.includes("pause") || key.includes("pause_campaign")) {
    return "pause_entity";
  }
  if (
    key.includes("budget") ||
    key.includes("reduce_budget") ||
    key.includes("increase_budget")
  ) {
    return "change_budget";
  }
  if (key.includes("bid") || key.includes("cpc")) {
    return "adjust_bid";
  }
  if (key.includes("creative") || key.includes("refresh")) {
    return "refresh_creative";
  }
  if (key.includes("keyword") && key.includes("pause")) {
    return "pause_zero_conversion_keyword";
  }

  if (EXECUTABLE_ACTION_TYPES.has(key)) return key;
  return "unknown";
}

function mapEntityType(raw: Record<string, unknown>, actionType: string): AgentAction["entity_type"] {
  const explicit = String(raw.entity_type ?? raw.entityType ?? "").toLowerCase();
  if (explicit === "ad" || explicit === "campaign" || explicit === "ad_group" || explicit === "keyword") {
    return explicit;
  }
  if (raw.ad_id) return "ad";
  if (raw.keyword_id) return "keyword";
  if (raw.ad_group_id) return "ad_group";
  if (actionType === "pause_ad") return "ad";
  return "campaign";
}

function mapRiskLevel(raw: Record<string, unknown>): RiskLevel {
  const p = String(raw.risk_level ?? raw.priority ?? raw.risk ?? "medium").toLowerCase();
  if (p.includes("critical") || p.includes("high") || p.includes("urgent")) return "high";
  if (p.includes("low")) return "low";
  return "medium";
}

function buildProposedValue(raw: Record<string, unknown>): Record<string, unknown> {
  if (raw.proposed_value && typeof raw.proposed_value === "object") {
    return raw.proposed_value as Record<string, unknown>;
  }

  const proposed: Record<string, unknown> = {};
  if (raw.reduction_percentage != null) {
    proposed.adjustment_percent = -Number(raw.reduction_percentage);
  }
  if (raw.adjustment_percent != null) {
    proposed.adjustment_percent = Number(raw.adjustment_percent);
  }
  if (raw.amount_eur != null) {
    proposed.amount_eur = Number(raw.amount_eur);
  }
  if (raw.new_budget_eur != null) {
    proposed.amount_eur = Number(raw.new_budget_eur);
  }
  return proposed;
}

/**
 * Converte acções do LLM (vários formatos) para o schema AgentAction executável.
 */
export function normalizeAgentAction(
  raw: unknown,
  defaultPlatform: Platform
): AgentAction | null {
  if (!raw || typeof raw !== "object") return null;

  const row = raw as Record<string, unknown>;
  const rawType = String(row.action_type ?? row.type ?? row.action ?? "");
  const action_type = mapActionType(rawType);

  if (action_type === "unknown") return null;

  const entity_id = String(
    row.entity_id ??
      row.campaign_id ??
      row.ad_id ??
      row.keyword_id ??
      row.ad_group_id ??
      ""
  ).trim();

  if (!entity_id || entity_id === "ALL_ACTIVE" || entity_id === "ALL") {
    return null;
  }

  const platformRaw = String(row.platform ?? defaultPlatform).toLowerCase();
  const platform: Platform =
    platformRaw === "google" || platformRaw === "meta" ? platformRaw : defaultPlatform;

  return {
    action_type,
    platform,
    entity_type: mapEntityType(row, action_type),
    entity_id,
    entity_name: String(row.entity_name ?? row.campaign_name ?? row.ad_name ?? "") || undefined,
    current_value: (row.current_value as Record<string, unknown>) ?? {},
    proposed_value: buildProposedValue(row),
    reasoning: String(row.reasoning ?? row.reason ?? row.description ?? ""),
    expected_impact: String(row.expected_impact ?? row.impact ?? ""),
    risk_level: mapRiskLevel(row),
  };
}

export function normalizeAgentActions(
  actions: unknown[],
  defaultPlatform: Platform
): AgentAction[] {
  return actions
    .map((a) => normalizeAgentAction(a, defaultPlatform))
    .filter((a): a is AgentAction => a !== null);
}
