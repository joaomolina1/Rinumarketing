"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Ga4SyncButtonProps {
  days?: number;
}

export function Ga4SyncButton({ days = 7 }: Ga4SyncButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/data/ga4/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error ?? "Falha no teste GA4");
        return;
      }

      setMessage(`GA4 OK — ${data.synced ?? 0} linhas (${days} dias)`);
      router.refresh();
    } catch {
      setMessage("Erro de rede ao testar GA4");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="outline" size="sm" disabled={loading} onClick={handleSync}>
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            A testar…
          </>
        ) : (
          <>
            <RefreshCw className="size-4" />
            Carregar GA4
          </>
        )}
      </Button>
      {message && (
        <p className="max-w-xs text-right text-xs text-[#6a7178]">{message}</p>
      )}
    </div>
  );
}
