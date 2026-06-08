export type RiskLevel = "low" | "medium" | "high";
export type ActionStatus = "pending" | "approved" | "rejected" | "executed" | "failed";
export type Platform = "google" | "meta";
export type EntityType = "campaign" | "ad_group" | "keyword" | "ad";
export type TriggerType = "scheduled_daily" | "scheduled_weekly" | "manual" | "alert";

export interface AgentAction {
  action_type: string;
  platform: Platform;
  entity_type: EntityType;
  entity_id: string;
  entity_name?: string;
  current_value: Record<string, unknown>;
  proposed_value: Record<string, unknown>;
  reasoning: string;
  expected_impact: string;
  risk_level: RiskLevel;
}

export interface AgentResult {
  agent_name: string;
  analysis: string;
  actions: AgentAction[];
  alerts: string[];
  error?: string;
}
