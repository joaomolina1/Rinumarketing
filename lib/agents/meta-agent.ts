import { createAnthropicClient } from "@/lib/anthropic/client";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { AgentAction, AgentResult } from "@/types/agents";
import type { RecentDecision } from "./memory";
import { getCampaignsInsights } from "@/lib/integrations/meta-ads";
import { calculateRoas, calculateCtr } from "@/lib/utils/metrics";

const META_AGENT_SYSTEM_PROMPT = `
És o agente especialista em Meta Ads da RINU, uma plataforma de aluguer de espaços para eventos em Portugal.

Analisa campanhas Meta (Facebook/Instagram) e propõe acções para melhorar ROAS e reduzir creative fatigue.

CONTEXTO:
- Mercado principal: Lisboa, Portugal
- ROAS alvo: > 4x, CPA alvo: < €80
- Frequência > 3.5 indica creative fatigue

REGRAS:
- Frequência > 4 → propor pausa de ad ou refresh de criativo
- ROAS < 2x há 3+ dias → reduzir budget 15-20%
- CTR < 0.8% com reach > 5000 → testar novo criativo

FORMATO: JSON { "analysis": string, "actions": Action[], "alerts": string[] }
`.trim();

interface RunMetaAgentInput {
  days: number;
  recent_decisions: RecentDecision[];
}

interface MetaAgentOutput {
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

export async function runMetaAgent(input: RunMetaAgentInput): Promise<AgentResult> {
  const supabase = getSupabaseAdmin();

  const { data: runRecord } = await supabase
    .from("agent_runs")
    .insert({
      agent_name: "meta",
      trigger_type: "orchestrator",
      status: "running",
      input: { days: input.days } as Json,
    })
    .select("id")
    .single();

  try {
    const campaigns = await getCampaignsInsights(input.days);

    const campaignSummary = campaigns.map((c) => ({
      ...c,
      roas: calculateRoas(c.conversion_value, c.spend),
      ctr: calculateCtr(c.clicks, c.impressions),
    }));

    const client = await createAnthropicClient();
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: META_AGENT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analisa estas campanhas Meta dos últimos ${input.days} dias:
${JSON.stringify(campaignSummary, null, 2)}

Decisões recentes: ${JSON.stringify(input.recent_decisions.slice(0, 5))}

Responde APENAS com JSON.`,
        },
      ],
    });

    const rawText = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    let parsed: MetaAgentOutput;
    try {
      parsed = JSON.parse(rawText) as MetaAgentOutput;
    } catch {
      parsed = { analysis: rawText.slice(0, 500), actions: [], alerts: [] };
    }

    const actions: AgentAction[] = (parsed.actions ?? []).map((a) => ({
      action_type: a.action_type ?? "unknown",
      platform: "meta" as const,
      entity_type: a.entity_type ?? "campaign",
      entity_id: a.entity_id ?? "",
      entity_name: a.entity_name,
      current_value: a.current_value ?? {},
      proposed_value: a.proposed_value ?? {},
      reasoning: a.reasoning ?? "",
      expected_impact: a.expected_impact ?? "",
      risk_level: a.risk_level ?? "medium",
    }));

    if (runRecord) {
      await supabase
        .from("agent_runs")
        .update({
          status: "completed",
          reasoning: parsed.analysis,
          output: parsed as unknown as Json,
          completed_at: new Date().toISOString(),
        })
        .eq("id", runRecord.id);
    }

    return {
      agent_name: "meta",
      analysis: parsed.analysis,
      actions,
      alerts: parsed.alerts ?? [],
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
