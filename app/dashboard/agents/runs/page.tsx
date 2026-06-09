import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default async function AgentRunsPage() {
  const supabase = await createClient();

  const { data: runs } = await supabase
    .from("agent_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <PageHeader title="Histórico de Execuções" description="Runs dos agentes de IA" />
      <div className="space-y-3">
        {(runs ?? []).map((run) => (
          <div
            key={run.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="min-w-0 flex-1 pr-4">
              <p className="font-medium capitalize">{run.agent_name}</p>
              <p className="text-xs text-gray-500">
                {run.started_at
                  ? format(new Date(run.started_at), "dd/MM/yyyy HH:mm", { locale: pt })
                  : "—"}
              </p>
              {run.status === "failed" && run.error && (
                <p className="mt-1 text-xs text-red-600">{run.error}</p>
              )}
            </div>
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
          </div>
        ))}
        {(!runs || runs.length === 0) && (
          <p className="text-center text-gray-500">Sem execuções registadas.</p>
        )}
      </div>
    </div>
  );
}
