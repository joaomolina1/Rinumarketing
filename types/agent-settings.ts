export type AgentMode = "plan" | "auto";
export type ActionPolicy = "auto" | "ask" | "block";

export type ActionType =
  | "adjust_bid"
  | "pause_zero_conversion_keyword"
  | "pause_entity"
  | "pause_ad"
  | "change_budget"
  | "refresh_creative";

export interface AgentSettings {
  user_id: string;
  mode: AgentMode;
  agents_master_enabled: boolean;
  google_agent_enabled: boolean;
  meta_agent_enabled: boolean;
  analytics_agent_enabled: boolean;
  action_policies: Partial<Record<ActionType, ActionPolicy>>;
  max_budget_increase_per_action_eur: number;
  max_daily_budget_increase_eur: number;
  updated_at: string;
}

export type AgentSettingsInput = Partial<
  Omit<AgentSettings, "user_id" | "updated_at">
>;

export const DEFAULT_ACTION_POLICIES: Record<ActionType, ActionPolicy> = {
  adjust_bid: "auto",
  pause_zero_conversion_keyword: "auto",
  pause_entity: "auto",
  pause_ad: "auto",
  change_budget: "ask",
  refresh_creative: "ask",
};

export const DEFAULT_AGENT_SETTINGS: Omit<AgentSettings, "user_id" | "updated_at"> = {
  mode: "plan",
  agents_master_enabled: true,
  google_agent_enabled: true,
  meta_agent_enabled: true,
  analytics_agent_enabled: true,
  action_policies: { ...DEFAULT_ACTION_POLICIES },
  max_budget_increase_per_action_eur: 50,
  max_daily_budget_increase_eur: 200,
};

export const ACTION_TYPE_CATALOG: Array<{
  key: ActionType;
  label_pt: string;
  platform: "google" | "meta" | "both";
  risk_hint: string;
}> = [
  {
    key: "adjust_bid",
    label_pt: "Ajustar licitação",
    platform: "google",
    risk_hint: "Altera CPC; impacto moderado no spend.",
  },
  {
    key: "pause_zero_conversion_keyword",
    label_pt: "Pausar keyword sem conversões",
    platform: "google",
    risk_hint: "Reduz gastos; baixo risco.",
  },
  {
    key: "pause_entity",
    label_pt: "Pausar campanha/grupo/keyword",
    platform: "google",
    risk_hint: "Para gastos nessa entidade.",
  },
  {
    key: "pause_ad",
    label_pt: "Pausar anúncio",
    platform: "meta",
    risk_hint: "Para gastos nesse criativo.",
  },
  {
    key: "change_budget",
    label_pt: "Alterar budget diário",
    platform: "meta",
    risk_hint: "Pode aumentar gastos no cartão.",
  },
  {
    key: "refresh_creative",
    label_pt: "Renovar criativo",
    platform: "meta",
    risk_hint: "Pode afetar performance e spend.",
  },
];
