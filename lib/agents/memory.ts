/**
 * RINU Marketing AI — Memória do sistema de agentes
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export interface RecentDecision {
  run_id: string;
  date: string;
  summary: string;
  actions_count: number;
  alerts_count: number;
}

export interface SaveDecisionInput {
  run_id: string;
  summary: string;
  actions_count: number;
  alerts_count: number;
}

export async function getRecentDecisions({
  days = 14,
  limit = 20,
}: {
  days?: number;
  limit?: number;
}): Promise<RecentDecision[]> {
  const supabase = getSupabaseAdmin();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("agent_runs")
    .select("id, started_at, reasoning, output")
    .eq("agent_name", "orchestrator")
    .eq("status", "completed")
    .gte("started_at", since.toISOString())
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => {
    const output = row.output as Record<string, unknown> | null;
    return {
      run_id: row.id,
      date: row.started_at ?? "",
      summary: row.reasoning ?? "",
      actions_count: Array.isArray(output?.actions_proposed)
        ? output.actions_proposed.length
        : 0,
      alerts_count: Array.isArray(output?.alerts) ? output.alerts.length : 0,
    };
  });
}

export async function getActionsForEntity({
  entity_id,
  days = 7,
}: {
  entity_id: string;
  days?: number;
}): Promise<Array<{ action_type: string; executed_at: string | null; status: string | null }>> {
  const supabase = getSupabaseAdmin();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("agent_actions")
    .select("action_type, executed_at, status")
    .eq("entity_id", entity_id)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

export async function saveDecision(_input: SaveDecisionInput): Promise<void> {
  // Extension point — decisions are persisted in agent_runs
}
