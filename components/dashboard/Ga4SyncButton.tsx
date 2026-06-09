"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Ga4SyncButtonProps {
  days?: number;
  compact?: boolean;
}

export function Ga4SyncButton({ days = 7, compact = false }: Ga4SyncButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    try {
      const res = await fetch("/api/data/ga4/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={loading}
        onClick={handleSync}
        title="Atualizar GA4"
        className="text-[#6a7178] hover:text-[#5cb7f3]"
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <RefreshCw className="size-3.5" />
        )}
      </Button>
    );
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={loading} onClick={handleSync}>
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          A carregar…
        </>
      ) : (
        <>
          <RefreshCw className="size-4" />
          Atualizar GA4
        </>
      )}
    </Button>
  );
}
