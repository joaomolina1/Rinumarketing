import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { AgentAction, AgentResult, ActionStatus } from "@/types/agents";
import { runGoogleAgent } from "./google-agent";
import { runMetaAgent } from "./meta-agent";
import { runAnalyticsAgent } from "./analytics-agent";
import { getRecentDecisions, saveDecision } from "./memory";
import { notifySlack } from "@/lib/notifications/slack";

export type TriggerType = "scheduled_daily" | "scheduled_weekly" | "manual" | "alert";

export interface OrchestratorInput {
  trigger: TriggerType;
  date_range_days?: number;
  focus_platform?: "google" | "meta";
  manual_instruction?: string;
}

export interface OrchestratorOutput {
  run_id: string;
  trigger: TriggerType;
  analysis_summary: string;
  actions_proposed: AgentAction[];
  actions_requiring_approval: AgentAction[];
  auto_approved_actions: AgentAction[];
  alerts: string[];
  agent_results: AgentResult[];
  total_budget_at_risk_eur: number;
  started_at: string;
  completed_at: string;
  duration_ms: number;
}

const AUTO_APPROVE_RULES: Record<string, boolean> = {
  adjust_bid_low: process.env.AUTO_APPROVE_ENABLED === "true",
  pause_zero_conversion_keyword: process.env.AUTO_APPROVE_ENABLED === "true",
};

const MAX_BUDGET_CHANGE_AUTO_EUR = 50;

const ORCHESTRATOR_SYSTEM_PROMPT = `
És o orquestrador central do sistema de marketing digital da RINU.

Sintetiza resultados de 3 agentes (Google, Meta, Analytics), resolve conflitos de budget e prioriza acções.

ROAS alvo blended: > 4x. CPA alvo: < €80.

FORMATO JSON:
{
  "analysis_summary": "string",
  "cross_channel_insights": ["string"],
  "priority_actions": [{ "priority": "critical|high|medium|low", "action_index": 0, "override_reasoning": "string" }],
  "budget_conflicts_resolved": ["string"],
  "weekly_outlook": "string"
}
`.trim();

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function runOrchestrator(
  input: OrchestratorInput
): Promise<OrchestratorOutput> {
  const supabase = getSupabaseAdmin();
  const startedAt = new Date();
  const dateRangeDays = input.date_range_days ?? 7;

  const { data: runRecord, error: runCreateError } = await supabase
    .from("agent_runs")
    .insert({
      agent_name: "orchestrator",
      trigger_type: input.trigger,
      status: "running",
      input: input as unknown as Json,
    })
    .select("id")
    .single();

  if (runCreateError || !runRecord) {
    throw new Error(`Falha ao criar agent_run: ${runCreateError?.message}`);
  }

  const runId = runRecord.id;

  try {
    const recentDecisions = await getRecentDecisions({ days: 14, limit: 20 });

    const [googleResult, metaResult, analyticsResult] = await Promise.allSettled([
      input.focus_platform === "meta"
        ? Promise.resolve(null)
        : runGoogleAgent({ days: dateRangeDays, recent_decisions: recentDecisions }),
      input.focus_platform === "google"
        ? Promise.resolve(null)
        : runMetaAgent({ days: dateRangeDays, recent_decisions: recentDecisions }),
      runAnalyticsAgent({ days: dateRangeDays, recent_decisions: recentDecisions }),
    ]);

    const agentResults: AgentResult[] = [];
    const allActions: AgentAction[] = [];
    const allAlerts: string[] = [];

    for (const [name, result] of [
      ["google", googleResult],
      ["meta", metaResult],
      ["analytics", analyticsResult],
    ] as [string, PromiseSettledResult<AgentResult | null>][]) {
      if (result.status === "fulfilled" && result.value) {
        agentResults.push(result.value);
        allActions.push(...result.value.actions);
        allAlerts.push(...result.value.alerts);
      } else if (result.status === "rejected") {
        const errorMsg = `Agente ${name} falhou: ${result.reason instanceof Error ? result.reason.message : "erro desconhecido"}`;
        agentResults.push({
          agent_name: name,
          analysis: "",
          actions: [],
          alerts: [errorMsg],
          error: errorMsg,
        });
        allAlerts.push(errorMsg);
      }
    }

    const orchestratorAnalysis = await synthesizeWithLLM({
      agentResults,
      allActions,
      allAlerts,
      recentDecisions,
      manualInstruction: input.manual_instruction,
    });

    const prioritizedActions = applyPriorities(
      allActions,
      orchestratorAnalysis.priority_actions
    );
    const { requiresApproval, autoApproved } = separateByApproval(prioritizedActions);
    const totalBudgetAtRisk = calculateBudgetAtRisk(prioritizedActions);

    if (prioritizedActions.length > 0) {
      const actionsToInsert = prioritizedActions.map((action) => ({
        run_id: runId,
        agent_name: deriveAgentName(action.platform),
        action_type: action.action_type,
        platform: action.platform,
        entity_type: action.entity_type,
        entity_id: action.entity_id,
        entity_name: action.entity_name ?? null,
        current_value: action.current_value as unknown as Json,
        proposed_value: action.proposed_value as unknown as Json,
        reasoning: action.reasoning,
        expected_impact: action.expected_impact,
        risk_level: action.risk_level,
        status: "pending" as ActionStatus,
      }));

      await supabase.from("agent_actions").insert(actionsToInsert);
    }

    await saveDecision({
      run_id: runId,
      summary: orchestratorAnalysis.analysis_summary,
      actions_count: prioritizedActions.length,
      alerts_count: allAlerts.length,
    });

    const completedAt = new Date();
    const output: OrchestratorOutput = {
      run_id: runId,
      trigger: input.trigger,
      analysis_summary: orchestratorAnalysis.analysis_summary,
      actions_proposed: prioritizedActions,
      actions_requiring_approval: requiresApproval,
      auto_approved_actions: autoApproved,
      alerts: allAlerts,
      agent_results: agentResults,
      total_budget_at_risk_eur: totalBudgetAtRisk,
      started_at: startedAt.toISOString(),
      completed_at: completedAt.toISOString(),
      duration_ms: completedAt.getTime() - startedAt.getTime(),
    };

    await supabase
      .from("agent_runs")
      .update({
        status: "completed",
        reasoning: orchestratorAnalysis.analysis_summary,
        output: output as unknown as Json,
        completed_at: completedAt.toISOString(),
      })
      .eq("id", runId);

    await sendNotifications({ output, orchestratorAnalysis });

    return output;
  } catch (err) {
    await supabase
      .from("agent_runs")
      .update({
        status: "failed",
        error: err instanceof Error ? err.message : "Erro desconhecido",
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);

    throw err;
  }
}

interface LLMSynthesisInput {
  agentResults: AgentResult[];
  allActions: AgentAction[];
  allAlerts: string[];
  recentDecisions: unknown[];
  manualInstruction?: string;
}

interface LLMSynthesisOutput {
  analysis_summary: string;
  cross_channel_insights: string[];
  priority_actions: Array<{
    priority: "critical" | "high" | "medium" | "low";
    action_index: number;
    override_reasoning: string;
  }>;
  budget_conflicts_resolved: string[];
  weekly_outlook: string;
}

async function synthesizeWithLLM(input: LLMSynthesisInput): Promise<LLMSynthesisOutput> {
  const client = new Anthropic();

  const userMessage = `
# Resultados dos agentes
Google: ${input.agentResults.find((r) => r.agent_name === "google")?.analysis ?? "N/A"}
Meta: ${input.agentResults.find((r) => r.agent_name === "meta")?.analysis ?? "N/A"}
Analytics: ${input.agentResults.find((r) => r.agent_name === "analytics")?.analysis ?? "N/A"}

Acções (${input.allActions.length}): ${JSON.stringify(input.allActions, null, 2)}
Alertas: ${input.allAlerts.join("\n") || "Nenhum"}

Responde APENAS com JSON.
`.trim();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: ORCHESTRATOR_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const rawText = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  try {
    return JSON.parse(rawText) as LLMSynthesisOutput;
  } catch {
    return {
      analysis_summary: rawText.slice(0, 500),
      cross_channel_insights: [],
      priority_actions: input.allActions.map((_, i) => ({
        priority: "medium" as const,
        action_index: i,
        override_reasoning: "Prioridade padrão",
      })),
      budget_conflicts_resolved: [],
      weekly_outlook: "Análise indisponível.",
    };
  }
}

function applyPriorities(
  actions: AgentAction[],
  priorityMap: LLMSynthesisOutput["priority_actions"]
): AgentAction[] {
  const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

  return [...actions].sort((a, b) => {
    const indexA = actions.indexOf(a);
    const indexB = actions.indexOf(b);
    const pA =
      PRIORITY_ORDER[
        priorityMap.find((p) => p.action_index === indexA)?.priority ?? "medium"
      ];
    const pB =
      PRIORITY_ORDER[
        priorityMap.find((p) => p.action_index === indexB)?.priority ?? "medium"
      ];
    if (pA !== pB) return pA - pB;
    const riskOrder = { low: 0, medium: 1, high: 2 };
    return (riskOrder[a.risk_level] ?? 1) - (riskOrder[b.risk_level] ?? 1);
  });
}

function separateByApproval(actions: AgentAction[]) {
  const requiresApproval: AgentAction[] = [];
  const autoApproved: AgentAction[] = [];

  for (const action of actions) {
    if (shouldAutoApprove(action)) {
      autoApproved.push(action);
    } else {
      requiresApproval.push(action);
    }
  }

  return { requiresApproval, autoApproved };
}

function shouldAutoApprove(action: AgentAction): boolean {
  if (action.risk_level === "high") return false;

  if (action.action_type === "change_budget") {
    const proposed = (action.proposed_value.amount_eur as number) ?? 0;
    const current = (action.current_value.amount_eur as number) ?? 0;
    if (Math.abs(proposed - current) > MAX_BUDGET_CHANGE_AUTO_EUR) return false;
  }

  const ruleKey = `${action.action_type}_${action.risk_level}`;
  return AUTO_APPROVE_RULES[ruleKey] === true;
}

function calculateBudgetAtRisk(actions: AgentAction[]): number {
  return actions.reduce((total, action) => {
    if (action.action_type === "change_budget") {
      const proposed = (action.proposed_value.amount_eur as number) ?? 0;
      const current = (action.current_value.amount_eur as number) ?? 0;
      return total + Math.abs(proposed - current);
    }
    return total;
  }, 0);
}

function deriveAgentName(platform: AgentAction["platform"]): string {
  return platform === "google" ? "google" : "meta";
}

async function sendNotifications({
  output,
  orchestratorAnalysis,
}: {
  output: OrchestratorOutput;
  orchestratorAnalysis: LLMSynthesisOutput;
}) {
  const hasCriticalAlerts = output.alerts.some(
    (a) => a.toLowerCase().includes("crítico") || a.toLowerCase().includes("critical")
  );

  if (hasCriticalAlerts) {
    await notifySlack({
      level: "critical",
      title: "RINU Marketing AI — Alerta Crítico",
      summary: output.alerts.join("\n"),
      details: orchestratorAnalysis.analysis_summary,
      run_id: output.run_id,
    });
  }

  if (output.actions_requiring_approval.length > 0) {
    const actionsSummary = output.actions_requiring_approval
      .slice(0, 5)
      .map(
        (a, i) =>
          `${i + 1}. [${a.platform.toUpperCase()}] ${a.action_type} em ${a.entity_name ?? a.entity_id}`
      )
      .join("\n");

    await notifySlack({
      level: "info",
      title: `${output.actions_requiring_approval.length} acção(ões) aguardam aprovação`,
      summary: actionsSummary,
      details: `Budget em análise: €${output.total_budget_at_risk_eur.toFixed(2)}`,
      run_id: output.run_id,
      action_url: `${process.env.NEXTAUTH_URL}/dashboard/agents/actions`,
    });
  }
}
