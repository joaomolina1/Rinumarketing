import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { AgentStatusCard } from "@/components/agents/AgentStatusCard";
import { RunOrchestratorButton } from "@/components/agents/RunOrchestratorButton";

export default async function AgentsPage() {
  const supabase = await createClient();

  const agents = ["orchestrator", "google", "meta", "analytics"] as const;
  const agentStatuses = await Promise.all(
    agents.map(async (name) => {
      const { data } = await supabase
        .from("agent_runs")
        .select("status, started_at, output")
        .eq("agent_name", name)
        .order("started_at", { ascending: false })
        .limit(1)
        .single();

      const output = data?.output as Record<string, unknown> | null;
      return {
        name,
        status: data?.status ?? "idle",
        lastRun: data?.started_at,
        actionsCount: Array.isArray(output?.actions_proposed)
          ? output.actions_proposed.length
          : undefined,
      };
    })
  );

  return (
    <div>
      <PageHeader
        title="Centro de Agentes"
        description="Monitorização e execução dos agentes de IA"
        actions={<RunOrchestratorButton />}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {agentStatuses.map((agent) => (
          <AgentStatusCard
            key={agent.name}
            agentName={agent.name}
            status={agent.status}
            lastRun={agent.lastRun ?? undefined}
            actionsCount={agent.actionsCount}
          />
        ))}
      </div>
    </div>
  );
}
