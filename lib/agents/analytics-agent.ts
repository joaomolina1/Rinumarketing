import { createAnthropicClient } from "@/lib/anthropic/client";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { AgentAction, AgentResult } from "@/types/agents";
import type { RecentDecision } from "./memory";
import { getAttributionData } from "@/lib/integrations/ga4";
import { detectRoasAnomaly, detectSpendAnomaly } from "@/lib/utils/anomalies";

const ANALYTICS_AGENT_SYSTEM_PROMPT = `
És o agente de Analytics da RINU. Analisas dados cross-canal (Google, Meta, GA4) para identificar anomalias, atribuição e oportunidades.

CONTEXTO:
- ROAS blended alvo: > 4x
- CPA alvo: < €80
- Lisboa representa ~66% do volume

FORMATO: JSON { "analysis": string, "actions": Action[], "alerts": string[] }
`.trim();

interface RunAnalyticsAgentInput {
  days: number;
  recent_decisions: RecentDecision[];
  mode?: "full" | "anomaly_check";
}

interface AnalyticsAgentOutput {
  analysis: string;
  actions: AgentAction[];
  alerts: string[];
}

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function runAnalyticsAgent(
  input: RunAnalyticsAgentInput
): Promise<AgentResult> {
  const supabase = getSupabaseAdmin();

  const { data: runRecord } = await supabase
    .from("agent_runs")
    .insert({
      agent_name: "analytics",
      trigger_type: input.mode === "anomaly_check" ? "alert" : "orchestrator",
      status: "running",
      input: { days: input.days, mode: input.mode } as Json,
    })
    .select("id")
    .single();

  try {
    const { data: kpis } = await supabase
      .from("daily_kpis")
      .select("*")
      .order("date", { ascending: false })
      .limit(input.days);

    const attribution = await getAttributionData(input.days);

    const anomalies = [];
    if (kpis && kpis.length >= 2) {
      const latest = kpis[0];
      const avgGoogleSpend =
        kpis.reduce((s, k) => s + (k.google_spend ?? 0), 0) / kpis.length;
      const avgMetaSpend =
        kpis.reduce((s, k) => s + (k.meta_spend ?? 0), 0) / kpis.length;

      const googleAnomaly = detectSpendAnomaly(
        latest.google_spend ?? 0,
        avgGoogleSpend,
        "google"
      );
      const metaAnomaly = detectSpendAnomaly(
        latest.meta_spend ?? 0,
        avgMetaSpend,
        "meta"
      );
      const roasAnomaly = detectRoasAnomaly(
        latest.blended_roas ?? 0,
        4,
        "blended"
      );

      if (googleAnomaly) anomalies.push(googleAnomaly);
      if (metaAnomaly) anomalies.push(metaAnomaly);
      if (roasAnomaly) anomalies.push(roasAnomaly);
    }

    const client = await createAnthropicClient();
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: ANALYTICS_AGENT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Modo: ${input.mode ?? "full"}
KPIs diários: ${JSON.stringify(kpis?.slice(0, 7))}
Atribuição: ${JSON.stringify(attribution.slice(0, 10))}
Anomalias detectadas: ${JSON.stringify(anomalies)}

Responde APENAS com JSON.`,
        },
      ],
    });

    const rawText = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    let parsed: AnalyticsAgentOutput;
    try {
      parsed = JSON.parse(rawText) as AnalyticsAgentOutput;
    } catch {
      parsed = { analysis: rawText.slice(0, 500), actions: [], alerts: [] };
    }

    const anomalyAlerts = anomalies.map((a) => a.message);
    const allAlerts = [...(parsed.alerts ?? []), ...anomalyAlerts];

    const actions: AgentAction[] = (parsed.actions ?? []).map((a) => ({
      action_type: a.action_type ?? "unknown",
      platform: a.platform ?? "google",
      entity_type: a.entity_type ?? "campaign",
      entity_id: a.entity_id ?? "",
      entity_name: a.entity_name,
      current_value: a.current_value ?? {},
      proposed_value: a.proposed_value ?? {},
      reasoning: a.reasoning ?? "",
      expected_impact: a.expected_impact ?? "",
      risk_level: a.risk_level ?? "low",
    }));

    if (runRecord) {
      await supabase
        .from("agent_runs")
        .update({
          status: "completed",
          reasoning: parsed.analysis,
          output: { ...parsed, anomalies } as unknown as Json,
          completed_at: new Date().toISOString(),
        })
        .eq("id", runRecord.id);
    }

    return {
      agent_name: "analytics",
      analysis: parsed.analysis,
      actions,
      alerts: allAlerts,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    if (runRecord) {
      await supabase
        .from("agent_runs")
        .update({
          status: "failed",
          error: message,
          completed_at: new Date().toISOString(),
        })
        .eq("id", runRecord.id);
    }
    throw err;
  }
}
