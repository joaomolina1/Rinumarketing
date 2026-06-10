import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { extractAnalysisText } from "@/lib/agents/parse-agent-json";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

const agentLabels: Record<string, string> = {
  orchestrator: "Orquestrador",
  google: "Google Ads",
  meta: "Meta Ads",
  analytics: "Analytics",
};

const riskColors: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

interface ActionShape {
  action_type?: string;
  platform?: string;
  entity_name?: string;
  entity_id?: string;
  reasoning?: string;
  expected_impact?: string;
  risk_level?: string;
}

interface AgentResultShape {
  agent_name?: string;
  analysis?: string;
  error?: string;
  actions?: ActionShape[];
  alerts?: string[];
}

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: run } = await supabase
    .from("agent_runs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!run) notFound();

  const output = (run.output as Record<string, unknown> | null) ?? {};
  const summaryRaw =
    (output.analysis_summary as string) ?? (output.analysis as string) ?? run.reasoning;
  const summary = summaryRaw ? extractAnalysisText(summaryRaw) : null;
  const insights = (output.cross_channel_insights as string[]) ?? [];
  const alerts = (output.alerts as string[]) ?? [];
  const actions =
    (output.actions_proposed as ActionShape[]) ?? (output.actions as ActionShape[]) ?? [];
  const agentResults = (output.agent_results as AgentResultShape[]) ?? [];
  const budgetAtRisk = output.total_budget_at_risk_eur as number | undefined;
  const outlook = output.weekly_outlook as string | undefined;

  return (
    <div>
      <Link
        href="/dashboard/agents/runs"
        className="mb-3 inline-flex items-center gap-1 text-sm text-[#5cb7f3] hover:underline"
      >
        <ArrowLeft className="size-4" />
        Voltar ao histórico
      </Link>

      <PageHeader
        title={`${agentLabels[run.agent_name] ?? run.agent_name}`}
        description={
          run.started_at
            ? format(new Date(run.started_at), "dd/MM/yyyy HH:mm", { locale: pt })
            : undefined
        }
        actions={
          <Badge
            variant={
              run.status === "completed"
                ? "default"
                : run.status === "running"
                  ? "secondary"
                  : "destructive"
            }
          >
            {run.status}
          </Badge>
        }
      />

      <div className="space-y-6">
        {run.status === "failed" && run.error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-start gap-2 p-4 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">A execução falhou</p>
                <p className="mt-1">{run.error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {summary && (
          <Card className="border-[#e9ecef] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Análise</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#54606b]">
                {summary}
              </p>
              {typeof budgetAtRisk === "number" && (
                <p className="mt-3 text-sm text-[#6a7178]">
                  Budget em análise: <strong>€{budgetAtRisk.toFixed(2)}</strong>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {insights.length > 0 && (
          <Card className="border-[#e9ecef] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Insights cross-canal</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-[#54606b]">
                {insights.map((i, idx) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {actions.length > 0 && (
          <Card className="border-[#e9ecef] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Ações propostas ({actions.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {actions.map((a, idx) => (
                <div key={idx} className="rounded-lg border border-[#e9ecef] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-[#272b30]">
                      {a.action_type} — {a.entity_name ?? a.entity_id}
                    </span>
                    {a.platform && (
                      <Badge variant="outline" className="text-xs">
                        {a.platform}
                      </Badge>
                    )}
                    {a.risk_level && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${riskColors[a.risk_level] ?? ""}`}
                      >
                        {a.risk_level}
                      </span>
                    )}
                  </div>
                  {a.reasoning && (
                    <p className="mt-1.5 text-sm text-[#54606b]">{a.reasoning}</p>
                  )}
                  {a.expected_impact && (
                    <p className="mt-1 text-xs text-[#6a7178]">Impacto: {a.expected_impact}</p>
                  )}
                </div>
              ))}
              <Link
                href="/dashboard/agents/actions"
                className="inline-block text-sm font-medium text-[#5cb7f3] hover:underline"
              >
                Ir para Aprovações
              </Link>
            </CardContent>
          </Card>
        )}

        {alerts.length > 0 && (
          <Card className="border-[#e9ecef] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Alertas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm text-[#54606b]">
                {alerts.map((a, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
                    {a}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {agentResults.length > 0 && (
          <Card className="border-[#e9ecef] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Resultados por agente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {agentResults.map((r, idx) => (
                <div key={idx} className="rounded-lg border border-[#e9ecef] p-3">
                  <p className="font-medium capitalize text-[#272b30]">
                    {agentLabels[r.agent_name ?? ""] ?? r.agent_name}
                  </p>
                  {r.error ? (
                    <p className="mt-1 text-sm text-red-600">{r.error}</p>
                  ) : (
                    <p className="mt-1 text-sm text-[#54606b]">
                      {r.analysis || "Sem análise."}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-[#9aa3ab]">
                    {(r.actions?.length ?? 0)} ação(ões) · {(r.alerts?.length ?? 0)} alerta(s)
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {outlook && (
          <Card className="border-[#e9ecef] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Perspetiva</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-[#54606b]">{outlook}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
