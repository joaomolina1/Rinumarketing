"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function RunOrchestratorButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRun() {
    setLoading(true);
    try {
      await fetch("/api/agents/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: "manual" }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleRun}
      disabled={loading}
      className="bg-[#E91E8C] hover:bg-[#E91E8C]/90"
    >
      {loading ? "A executar..." : "Executar Análise"}
    </Button>
  );
}
