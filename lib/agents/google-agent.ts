import { createAnthropicClient } from "@/lib/anthropic/client";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { AgentAction, AgentResult } from "@/types/agents";
import type { RecentDecision } from "./memory";
import { getSkillsPromptBlock } from "./skills";
import {
  getCampaignsPerformance,
  getKeywordsAnalysis,
} from "@/lib/integrations/google-ads";
import { microsToEur } from "@/lib/utils/formatters";
import { calculateRoas, calculateCtr } from "@/lib/utils/metrics";

const GOOGLE_AGENT_SYSTEM_PROMPT = `
És o agente especialista em Google Ads da RINU, uma plataforma de aluguer de espaços para eventos em Portugal.

O teu objectivo é analisar o desempenho das campanhas Google Ads e propor acções concretas para melhorar o ROAS.

CONTEXTO DO NEGÓCIO:
- RINU opera em Portugal (Lisboa é o principal mercado)
- Produto: marketplace de espaços para eventos (casamentos, festas, corporativos)
- Ticket médio: €500–€5.000 por reserva
- KPIs alvo: ROAS > 4x, CPA < €80, CTR > 3%

REGRAS DE DECISÃO:
- Se ROAS < 2x há mais de 3 dias → propor redução de bid de 15–20%
- Se CTR < 1% com impressões > 1000 → propor pausa do ad group
- Se budget esgota antes das 18h → propor aumento de budget de 20%
- Nunca propor alterações > 30% de uma só vez

FORMATO DE OUTPUT:
Devolve sempre JSON com: { "analysis": string, "actions": Action[], "alerts": string[] }
`.trim();

interface RunGoogleAgentInput {
  days: number;
  recent_decisions: RecentDecision[];
}

interface GoogleAgentOutput {
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

export async function runGoogleAgent(input: RunGoogleAgentInput): Promise<AgentResult> {
  const supabase = getSupabaseAdmin();

  const { data: runRecord } = await supabase
    .from("agent_runs")
    .insert({
      agent_name: "google",
      trigger_type: "orchestrator",
      status: "running",
      input: { days: input.days } as Json,
    })
    .select("id")
    .single();

  try {
    const campaigns = await getCampaignsPerformance(input.days);

    const campaignSummary = campaigns.map((c) => {
      const spend = microsToEur(c.cost_micros);
      const roas = calculateRoas(c.conversion_value, spend);
      const ctr = calculateCtr(c.clicks, c.impressions);
      return {
        ...c,
        spend_eur: spend,
        roas,
        ctr,
      };
    });

    const skillsBlock = await getSkillsPromptBlock("google");
    const client = await createAnthropicClient();
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: `${GOOGLE_AGENT_SYSTEM_PROMPT}${skillsBlock ? `\n\n${skillsBlock}` : ""}`,
      messages: [
        {
          role: "user",
          content: `Analisa estas campanhas Google Ads dos últimos ${input.days} dias:
${JSON.stringify(campaignSummary, null, 2)}

Decisões recentes: ${JSON.stringify(input.recent_decisions.slice(0, 5))}

Responde APENAS com JSON: { "analysis": "...", "actions": [...], "alerts": [...] }`,
        },
      ],
    });

    const rawText = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    let parsed: GoogleAgentOutput;
    try {
      parsed = JSON.parse(rawText) as GoogleAgentOutput;
    } catch {
      parsed = {
        analysis: rawText.slice(0, 500),
        actions: [],
        alerts: [],
      };
    }

    const actions: AgentAction[] = (parsed.actions ?? []).map((a) => ({
      action_type: a.action_type ?? "unknown",
      platform: "google" as const,
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
      agent_name: "google",
      analysis: parsed.analysis,
      actions,
      alerts: parsed.alerts ?? [],
    };
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    const message = raw.includes("only approved for use with test accounts")
      ? "Google Ads: Developer Token só permite contas de teste. Pede Basic Access ou usa Customer ID de teste."
      : raw || "Erro desconhecido";
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

export { getKeywordsAnalysis };
