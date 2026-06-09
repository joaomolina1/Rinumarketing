"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Play, ArrowRight } from "lucide-react";

interface RunResult {
  run_id?: string;
  analysis_summary?: string;
  actions_proposed?: unknown[];
  actions_requiring_approval?: unknown[];
  auto_approved_actions?: unknown[];
  alerts?: unknown[];
}

const PERIODS = [7, 14, 30];

export function AgentRunPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(7);
  const [instruction, setInstruction] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/agents/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger: "manual",
          date_range_days: days,
          manual_instruction: instruction.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falha ao executar os agentes.");
        return;
      }
      setResult(data);
      router.refresh();
    } catch {
      setError("Erro de rede ao contactar o orquestrador.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-[#e9ecef] shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Executar análise</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-[#6a7178]">Período:</span>
          {PERIODS.map((p) => (
            <Button
              key={p}
              size="sm"
              variant={days === p ? "default" : "outline"}
              onClick={() => setDays(p)}
              disabled={loading}
            >
              {p} dias
            </Button>
          ))}
        </div>

        <Textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Instrução opcional para esta corrida (ex.: foca-te em reduzir CPA no Google)"
          className="min-h-[72px] text-sm"
          disabled={loading}
        />

        <Button
          onClick={run}
          disabled={loading}
          className="bg-[#E91E8C] hover:bg-[#E91E8C]/90"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              A analisar…
            </>
          ) : (
            <>
              <Play className="size-4" />
              Correr agentes
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Os agentes falharam</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && !error && (
          <div className="space-y-3 rounded-lg border border-[#e6f2ec] bg-[#f6fffa] p-4">
            <p className="text-sm font-medium text-[#007d3e]">Análise concluída</p>
            {result.analysis_summary && (
              <p className="text-sm text-[#54606b]">{result.analysis_summary}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-[#54606b]">
              <span>
                <strong>{result.actions_proposed?.length ?? 0}</strong> ações propostas
              </span>
              <span>
                <strong>{result.actions_requiring_approval?.length ?? 0}</strong> a aprovar
              </span>
              <span>
                <strong>{result.auto_approved_actions?.length ?? 0}</strong> automáticas
              </span>
              <span>
                <strong>{result.alerts?.length ?? 0}</strong> alertas
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {result.run_id && (
                <Link
                  href={`/dashboard/agents/runs/${result.run_id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#5cb7f3] hover:underline"
                >
                  Ver detalhe da corrida
                  <ArrowRight className="size-3.5" />
                </Link>
              )}
              {(result.actions_requiring_approval?.length ?? 0) > 0 && (
                <Link
                  href="/dashboard/agents/actions"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#5cb7f3] hover:underline"
                >
                  Rever aprovações
                  <ArrowRight className="size-3.5" />
                </Link>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
