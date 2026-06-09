"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ANALYSIS_PERIOD_OPTIONS,
  type AnalysisPeriodDays,
} from "@/lib/utils/analysis-period";
import { cn } from "@/lib/utils";

interface AnalysisPeriodSelectorProps {
  value: AnalysisPeriodDays;
}

export function AnalysisPeriodSelector({ value }: AnalysisPeriodSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function setDays(days: AnalysisPeriodDays) {
    if (days === value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", String(days));
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
      <span className="flex items-center gap-1.5 text-xs font-medium text-[#6a7178]">
        {isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <CalendarDays className="size-3.5" />
        )}
        Período de análise
      </span>
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[#e9ecef] bg-white p-1">
        {ANALYSIS_PERIOD_OPTIONS.map((option) => (
          <Button
            key={option.days}
            type="button"
            variant={value === option.days ? "default" : "ghost"}
            size="sm"
            className={cn(
              "min-w-[4.5rem]",
              value === option.days && "shadow-sm"
            )}
            disabled={isPending}
            onClick={() => setDays(option.days)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
