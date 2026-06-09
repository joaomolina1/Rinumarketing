import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { AgentRunPanel } from "@/components/agents/AgentRunPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOwnerAgentSettings } from "@/lib/settings/agent-settings";
import { ACTION_TYPE_CATALOG } from "@/types/agent-settings";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Bot,
  Search,
  Megaphone,
  BarChart3,
  CheckSquare,
  ShieldCheck,
  BookOpen,
  History,
  CircleCheck,
  CircleSlash,
} from "lucide-react";

export const dynamic = "force-dynamic";

const AGENT_META = [
  {
    key: "orchestrator",
    label: "Orquestrador",
    icon: Bot,
    color: "#E91E8C",
    what: "Junta os resultados dos 3 agentes, resolve conflitos de budget e prioriza as ações.",
    reads: "Resultados dos agentes + decisões recentes",
  },
  {
    key: "google",
    label: "Agente Google Ads",
    icon: Search,
    color: "#0070B0",
    what: "Analisa campanhas e keywords do Google Ads e propõe ajustes de bid e pausas.",
    reads: "Campanhas Google Ads (últimos dias)",
  },
  {
    key: "meta",
    label: "Agente Meta Ads",
    icon: Megaphone,
    color: "#E91E8C",
    what: "Deteta creative fatigue e ROAS baixo no Meta e propõe pausas, budgets e criativos.",
    reads: "Campanhas e criativos Meta",
  },
  {
    key: "analytics",
    label: "Agente Analytics",
    icon: BarChart3,
    color: "#9a70ff",
    what: "Cruza Google, Meta e GA4, deteta anomalias de spend/ROAS e oportunidades.",
    reads: "KPIs diários + atribuição GA4",
  },
] as const;

const agentEnabledKey: Record<string, keyof Awaited<ReturnType<typeof getOwnerAgentSettings>>> = {
  google: "google_agent_enabled",
  meta: "meta_agent_enabled",
  analytics: "analytics_agent_enabled",
};

const EXECUTION_STATUS: Record<string, { live: boolean; note: string }> = {
  adjust_bid: { live: false, note: "Google — simulado (token em modo teste)" },
  pause_zero_conversion_keyword: { live: false, note: "Google — simulado" },
  pause_entity: { live: false, note: "Google — simulado" },
  pause_ad: { live: true, note: "Meta — executa na API" },
  change_budget: { live: true, note: "Meta — executa na API" },
  refresh_creative: { live: false, note: "Meta — só sinaliza (sem execução automática)" },
};

export default async function AgentsPage() {
  const supabase = await createClient();
  const settings = await getOwnerAgentSettings();

  const lastRuns = await Promise.all(
    AGENT_META.map(async (a) => {
      const { data } = await supabase
        .from("agent_runs")
        .select("id, status, started_at, output")
        .eq("agent_name", a.key)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return { key: a.key, run: data };
    })
  );
  const runByAgent = Object.fromEntries(lastRuns.map((r) => [r.key, r.run]));

  const { count: pendingCount } = await supabase
    .from("agent_actions")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: skillsCount } = await supabase
    .from("agent_skills")
    .select("id", { count: "exact", head: true })
    .eq("enabled", true);

  const masterOn = settings.agents_master_enabled;
  const modeLabel = settings.mode === "plan" ? "Planeamento" : "Automático";

  return (
    <div>
      <PageHeader
        title="Centro de Agentes"
        description="O que os agentes fazem, o que propõem e o que conseguem executar"
      />

      {/* Estado atual */}
      <Card className="mb-6 border-[#e9ecef] shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3 p-4">
          <div>
            <p className="text-xs text-[#6a7178]">Estado</p>
            <p className="font-medium text-[#272b30]">
              {masterOn ? "Agentes ativos" : "Agentes pausados (kill switch)"}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#6a7178]">Modo</p>
            <p className="font-medium text-[#272b30]">{modeLabel}</p>
          </div>
          <div>
            <p className="text-xs text-[#6a7178]">A aprovar</p>
            <p className="font-medium text-[#272b30]">{pendingCount ?? 0} ação(ões)</p>
          </div>
          <div>
            <p className="text-xs text-[#6a7178]">Skills ativas</p>
            <p className="font-medium text-[#272b30]">{skillsCount ?? 0}</p>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <Link
              href="/dashboard/agents/settings"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#dee2e6] px-3 py-1.5 text-sm font-medium text-[#54606b] hover:bg-[#f8f9fa]"
            >
              <ShieldCheck className="size-4" />
              Controlo
            </Link>
            <Link
              href="/dashboard/agents/skills"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#dee2e6] px-3 py-1.5 text-sm font-medium text-[#54606b] hover:bg-[#f8f9fa]"
            >
              <BookOpen className="size-4" />
              Skills
            </Link>
            <Link
              href="/dashboard/agents/runs"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#dee2e6] px-3 py-1.5 text-sm font-medium text-[#54606b] hover:bg-[#f8f9fa]"
            >
              <History className="size-4" />
              Histórico
            </Link>
          </div>
        </CardContent>
      </Card>

      {!masterOn && (
        <div className="mb-6 rounded-lg border border-[#cc071e]/30 bg-[#fffafa] px-4 py-3 text-sm text-[#cc071e]">
          Os agentes estão pausados pelo kill switch. Reativa em{" "}
          <Link href="/dashboard/agents/settings" className="underline">
            Controlo
          </Link>{" "}
          para poderem correr.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna principal: agentes + run */}
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {AGENT_META.map((agent) => {
              const Icon = agent.icon;
              const run = runByAgent[agent.key];
              const enabledKey = agentEnabledKey[agent.key];
              const enabled = enabledKey ? Boolean(settings[enabledKey]) : true;
              return (
                <Card key={agent.key} className="border-[#e9ecef] shadow-sm">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex size-8 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${agent.color}1a`, color: agent.color }}
                      >
                        <Icon className="size-4" />
                      </span>
                      <CardTitle className="text-sm font-semibold text-[#272b30]">
                        {agent.label}
                      </CardTitle>
                    </div>
                    {agent.key !== "orchestrator" && (
                      <Badge variant={enabled ? "default" : "secondary"}>
                        {enabled ? "Ligado" : "Desligado"}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-[#54606b]">{agent.what}</p>
                    <p className="text-xs text-[#9aa3ab]">Lê: {agent.reads}</p>
                    {run && (
                      <p className="text-xs text-[#6a7178]">
                        Última corrida:{" "}
                        {run.started_at
                          ? format(new Date(run.started_at), "dd/MM HH:mm", { locale: pt })
                          : "—"}{" "}
                        · {run.status}
                        {run.id && (
                          <>
                            {" "}
                            ·{" "}
                            <Link
                              href={`/dashboard/agents/runs/${run.id}`}
                              className="text-[#5cb7f3] hover:underline"
                            >
                              ver
                            </Link>
                          </>
                        )}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <AgentRunPanel />
        </div>

        {/* Coluna lateral: ações possíveis */}
        <div className="space-y-6">
          <Card className="border-[#e9ecef] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Ações possíveis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ACTION_TYPE_CATALOG.map((item) => {
                const exec = EXECUTION_STATUS[item.key];
                return (
                  <div key={item.key} className="flex items-start gap-2">
                    {exec?.live ? (
                      <CircleCheck className="mt-0.5 size-4 shrink-0 text-[#007d3e]" />
                    ) : (
                      <CircleSlash className="mt-0.5 size-4 shrink-0 text-[#9aa3ab]" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-[#272b30]">{item.label_pt}</p>
                      <p className="text-xs text-[#6a7178]">{exec?.note ?? item.risk_hint}</p>
                    </div>
                  </div>
                );
              })}
              <p className="border-t border-[#f0f0f0] pt-3 text-xs text-[#9aa3ab]">
                Ações &quot;simuladas&quot; são registadas e aprovadas, mas ainda não escrevem na
                plataforma (Google em modo de teste). Define o que executa em automático no{" "}
                <Link href="/dashboard/agents/settings" className="text-[#5cb7f3] hover:underline">
                  Controlo
                </Link>
                .
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#e9ecef] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Próximos passos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Link
                href="/dashboard/agents/actions"
                className="flex items-center gap-2 text-[#54606b] hover:text-[#272b30]"
              >
                <CheckSquare className="size-4 text-[#5cb7f3]" />
                Rever {pendingCount ?? 0} aprovação(ões)
              </Link>
              <Link
                href="/dashboard/agents/skills"
                className="flex items-center gap-2 text-[#54606b] hover:text-[#272b30]"
              >
                <BookOpen className="size-4 text-[#5cb7f3]" />
                Adicionar contexto/regras (skills)
              </Link>
              <Link
                href="/dashboard/agents/settings"
                className="flex items-center gap-2 text-[#54606b] hover:text-[#272b30]"
              >
                <ShieldCheck className="size-4 text-[#5cb7f3]" />
                Ajustar modo e limites
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
