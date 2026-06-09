"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
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

  function setDays(days: AnalysisPeriodDays) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", String(days));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
      <span className="flex items-center gap-1.5 text-xs font-medium text-[#6a7178]">
        <CalendarDays className="size-3.5" />
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
            onClick={() => setDays(option.days)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
