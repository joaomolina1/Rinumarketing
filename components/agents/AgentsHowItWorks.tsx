import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Hand, Zap, CheckSquare, ArrowRight } from "lucide-react";

interface AgentsHowItWorksProps {
  mode: string;
  masterEnabled: boolean;
  lastRunAt?: string | null;
  lastRunActions?: number;
  lastRunPending?: number;
  pendingCount: number;
}

export function AgentsHowItWorks({
  mode,
  masterEnabled,
  lastRunAt,
  lastRunActions = 0,
  lastRunPending = 0,
  pendingCount,
}: AgentsHowItWorksProps) {
  const modeLabel = mode === "plan" ? "Planeamento" : "Automático";

  return (
    <Card className="mb-6 border-[#e5eff9] bg-[#f8fbff] shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-[#272b30]">Como funcionam os agentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-[#54606b]">
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <li className="flex gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e5eff9] text-xs font-semibold text-[#4080aa]">
              1
            </span>
            <span>
              <strong className="text-[#272b30]">Lêem dados</strong> — campanhas Meta/Google,
              KPIs e GA4 do período escolhido.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e5eff9] text-xs font-semibold text-[#4080aa]">
              2
            </span>
            <span>
              <strong className="text-[#272b30]">Propõem ações</strong> — pausar anúncio, mudar
              budget, etc., com justificação.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e5eff9] text-xs font-semibold text-[#4080aa]">
              3
            </span>
            <span>
              <strong className="text-[#272b30]">Tu aprovas</strong> (modo Planeamento) ou o
              sistema executa as permitidas (modo Automático).
            </span>
          </li>
          <li className="flex gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e5eff9] text-xs font-semibold text-[#4080aa]">
              4
            </span>
            <span>
              <strong className="text-[#272b30]">Executam</strong> só o que está na lista
              &quot;Ações possíveis&quot; com API real (Meta hoje; Google simulado).
            </span>
          </li>
        </ol>

        <div className="flex flex-wrap gap-4 border-t border-[#e5eff9] pt-4 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <Hand className="size-3.5 text-[#5cb7f3]" />
            <strong>Manual:</strong> botão &quot;Correr agentes&quot; abaixo
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5 text-[#5cb7f3]" />
            <strong>Automático:</strong> todos os dias ~08:00 (Lisboa), se{" "}
            <code className="rounded bg-white px-1">CRON_SECRET</code> estiver na Vercel
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="size-3.5 text-[#5cb7f3]" />
            Modo actual: <strong>{modeLabel}</strong>
            {!masterEnabled && " · agentes pausados"}
          </span>
        </div>

        {lastRunAt && (
          <p className="rounded-lg border border-[#e9ecef] bg-white px-3 py-2 text-xs">
            Última corrida do orquestrador:{" "}
            <strong>{lastRunActions} ação(ões) proposta(s)</strong>,{" "}
            <strong>{lastRunPending} a aguardar aprovação</strong>.{" "}
            {lastRunActions === 0 && (
              <>
                Se vês análise mas 0 ações, corre de novo após o último deploy — corrigimos a
                leitura do JSON do Claude.
              </>
            )}{" "}
            {pendingCount > 0 && (
              <Link
                href="/dashboard/agents/actions"
                className="inline-flex items-center gap-0.5 font-medium text-[#5cb7f3] hover:underline"
              >
                Ver {pendingCount} pendente(s)
                <ArrowRight className="size-3" />
              </Link>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
