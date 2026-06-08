import type { AgentSettings, AgentSettingsInput } from "@/types/agent-settings";
import { DEFAULT_AGENT_SETTINGS } from "@/types/agent-settings";
import { createAdminClient, createClient } from "@/lib/supabase/server";

let cachedSettings: AgentSettings | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30_000;

function mergeWithDefaults(
  row: Partial<AgentSettings> | null,
  userId?: string
): AgentSettings {
  const now = new Date().toISOString();
  return {
    user_id: row?.user_id ?? userId ?? "",
    mode: row?.mode ?? DEFAULT_AGENT_SETTINGS.mode,
    agents_master_enabled:
      row?.agents_master_enabled ?? DEFAULT_AGENT_SETTINGS.agents_master_enabled,
    google_agent_enabled:
      row?.google_agent_enabled ?? DEFAULT_AGENT_SETTINGS.google_agent_enabled,
    meta_agent_enabled:
      row?.meta_agent_enabled ?? DEFAULT_AGENT_SETTINGS.meta_agent_enabled,
    analytics_agent_enabled:
      row?.analytics_agent_enabled ??
      DEFAULT_AGENT_SETTINGS.analytics_agent_enabled,
    action_policies: {
      ...DEFAULT_AGENT_SETTINGS.action_policies,
      ...(row?.action_policies ?? {}),
    },
    max_budget_increase_per_action_eur:
      row?.max_budget_increase_per_action_eur ??
      DEFAULT_AGENT_SETTINGS.max_budget_increase_per_action_eur,
    max_daily_budget_increase_eur:
      row?.max_daily_budget_increase_eur ??
      DEFAULT_AGENT_SETTINGS.max_daily_budget_increase_eur,
    updated_at: row?.updated_at ?? now,
  };
}

export function clearAgentSettingsCache() {
  cachedSettings = null;
  cachedAt = 0;
}

export async function getAgentSettingsForUser(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("agent_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return mergeWithDefaults(data as Partial<AgentSettings> | null, userId);
}

/** Single-user app: lê a linha mais recente. Passar userId no OrchestratorInput se evoluir para multi-user. */
export async function getOwnerAgentSettings(): Promise<AgentSettings> {
  if (cachedSettings && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedSettings;
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("agent_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const settings = mergeWithDefaults(data as Partial<AgentSettings> | null);
  cachedSettings = settings;
  cachedAt = Date.now();
  return settings;
}

export async function upsertAgentSettingsForUser(
  userId: string,
  input: AgentSettingsInput
) {
  const payload = {
    user_id: userId,
    ...input,
  };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agent_settings")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) throw error;
  clearAgentSettingsCache();
  return mergeWithDefaults(data as Partial<AgentSettings>, userId);
}
