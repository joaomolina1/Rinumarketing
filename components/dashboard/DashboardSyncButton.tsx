"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_SYNC_DAYS } from "@/lib/utils/analysis-period";

export function DashboardSyncButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setMessage(null);

    const body = JSON.stringify({ days: DEFAULT_SYNC_DAYS });

    try {
      const [google, meta] = await Promise.allSettled([
        fetch("/api/data/google/sync", { method: "POST", body }),
        fetch("/api/data/meta/sync", { method: "POST", body }),
      ]);

      const parts: string[] = [];
      if (google.status === "fulfilled" && google.value.ok) {
        const data = await google.value.json();
        parts.push(`Google: ${data.synced ?? 0} linhas`);
      }
      if (meta.status === "fulfilled" && meta.value.ok) {
        const data = await meta.value.json();
        parts.push(`Meta: ${data.synced ?? 0} linhas`);
      }

      setMessage(
        parts.length > 0
          ? `Histórico sincronizado (${DEFAULT_SYNC_DAYS}d) — ${parts.join(" · ")}`
          : "Sync concluído"
      );
      router.refresh();
    } catch {
      setMessage("Falha ao sincronizar. Tenta novamente.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={syncing}
        onClick={handleSync}
      >
        {syncing ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            A sincronizar…
          </>
        ) : (
          <>
            <RefreshCw className="size-4" />
            Sincronizar {DEFAULT_SYNC_DAYS} dias
          </>
        )}
      </Button>
      {message && (
        <p className="max-w-xs text-right text-xs text-[#6a7178]">{message}</p>
      )}
    </div>
  );
}
