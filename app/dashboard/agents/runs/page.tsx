import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const agentLabels: Record<string, string> = {
  orchestrator: "Orquestrador",
  google: "Google Ads",
  meta: "Meta Ads",
  analytics: "Analytics",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  completed: "default",
  running: "secondary",
  failed: "destructive",
};

export default async function AgentRunsPage() {
  const supabase = await createClient();

  const { data: runs } = await supabase
    .from("agent_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <PageHeader
        title="Histórico de execuções"
        description="Cada corrida dos agentes — clica para ver a análise e as ações propostas"
      />
      <div className="space-y-3">
        {(runs ?? []).map((run) => {
          const output = run.output as Record<string, unknown> | null;
          const summary =
            (output?.analysis_summary as string) ??
            run.reasoning ??
            (run.status === "failed" ? run.error : null);
          const actionsCount = Array.isArray(output?.actions_proposed)
            ? output.actions_proposed.length
            : Array.isArray(output?.actions)
              ? (output.actions as unknown[]).length
              : 0;

          return (
            <Link key={run.id} href={`/dashboard/agents/runs/${run.id}`} className="block">
              <Card className="border-[#e9ecef] shadow-sm transition-colors hover:border-[#94cbec]">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#272b30]">
                        {agentLabels[run.agent_name] ?? run.agent_name}
                      </span>
                      <Badge variant={statusVariant[run.status] ?? "secondary"}>
                        {run.status}
                      </Badge>
                      {actionsCount > 0 && (
                        <span className="text-xs text-[#6a7178]">
                          {actionsCount} ação(ões)
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-[#9aa3ab]">
                      {run.started_at
                        ? format(new Date(run.started_at), "dd/MM/yyyy HH:mm", { locale: pt })
                        : "—"}
                      {run.duration_ms ? ` · ${(run.duration_ms / 1000).toFixed(1)}s` : ""}
                    </p>
                    {summary && (
                      <p className="mt-1 line-clamp-1 text-sm text-[#54606b]">{summary}</p>
                    )}
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-[#c2c8cd]" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {(!runs || runs.length === 0) && (
          <p className="rounded-lg border border-dashed border-[#dee2e6] p-12 text-center text-[#6a7178]">
            Sem execuções registadas. Corre os agentes no Centro de Agentes.
          </p>
        )}
      </div>
    </div>
  );
}
