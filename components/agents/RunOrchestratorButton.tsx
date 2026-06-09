"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function RunOrchestratorButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const router = useRouter();

  async function handleRun() {
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const res = await fetch("/api/agents/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: "manual", date_range_days: 7 }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Falha ao executar agentes");
        return;
      }

      setSummary(data.analysis_summary ?? "Análise concluída.");
      router.refresh();
    } catch {
      setError("Erro de rede ao contactar o orquestrador");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        onClick={handleRun}
        disabled={loading}
        className="bg-[#E91E8C] hover:bg-[#E91E8C]/90"
      >
        {loading ? "A executar..." : "Executar Análise"}
      </Button>
      {error && (
        <Alert variant="destructive" className="max-w-md text-left">
          <AlertTitle>Agentes falharam</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {summary && !error && (
        <Alert className="max-w-md border-[#e6f2ec] bg-[#f6fffa] text-left">
          <AlertTitle className="text-[#007d3e]">Concluído</AlertTitle>
          <AlertDescription className="text-[#54606b]">{summary}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
