import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActionsList } from "@/components/agents/ActionsList";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ActionsPage() {
  const supabase = await createClient();

  const { data: actions } = await supabase
    .from("agent_actions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const { data: lastOrchestrator } = await supabase
    .from("agent_runs")
    .select("id, started_at, output")
    .eq("agent_name", "orchestrator")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const output = lastOrchestrator?.output as Record<string, unknown> | null;
  const lastActionCount = Array.isArray(output?.actions_proposed)
    ? output.actions_proposed.length
    : 0;

  return (
    <div>
      <PageHeader
        title="Aprovações"
        description="Ações propostas pelos agentes que precisam do teu ok antes de executar"
      />

      {(!actions || actions.length === 0) && (
        <Card className="mb-6 border-[#e9ecef]">
          <CardContent className="space-y-2 p-5 text-sm text-[#54606b]">
            <p className="font-medium text-[#272b30]">Nenhuma ação pendente</p>
            <p>Isto é normal se:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Ainda não correste os agentes (Centro de Agentes → Correr agentes)</li>
              <li>A última corrida não encontrou problemas que justifiquem ações</li>
              <li>Estás em modo Automático e as ações foram executadas sem aprovação</li>
              <li>Todas as ações propostas foram bloqueadas nas políticas de Controlo</li>
            </ul>
            {lastOrchestrator && (
              <p className="pt-2">
                Última corrida:{" "}
                {lastActionCount === 0
                  ? "0 ações propostas"
                  : `${lastActionCount} proposta(s) — rever no histórico`}
                .{" "}
                <Link
                  href={`/dashboard/agents/runs/${lastOrchestrator.id}`}
                  className="font-medium text-[#5cb7f3] hover:underline"
                >
                  Ver detalhe
                </Link>
              </p>
            )}
            <Link
              href="/dashboard/agents"
              className="inline-block pt-1 font-medium text-[#5cb7f3] hover:underline"
            >
              Ir ao Centro de Agentes
            </Link>
          </CardContent>
        </Card>
      )}

      <ActionsList actions={actions ?? []} />
    </div>
  );
}
