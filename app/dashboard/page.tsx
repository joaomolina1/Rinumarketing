import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { SpendChart } from "@/components/dashboard/SpendChart";
import { RoasChart } from "@/components/dashboard/RoasChart";
import { PlatformSummary } from "@/components/dashboard/PlatformSummary";
import { AnalysisPeriodSelector } from "@/components/dashboard/AnalysisPeriodSelector";
import { DashboardSyncButton } from "@/components/dashboard/DashboardSyncButton";
import { DataCoverageAlert } from "@/components/dashboard/DataCoverageAlert";
import { Ga4OverviewSection } from "@/components/dashboard/Ga4OverviewSection";
import { formatCurrency } from "@/lib/utils/formatters";
import {
  getAnalysisDateRange,
  getAnalysisPeriodLabel,
  parseAnalysisDays,
} from "@/lib/utils/analysis-period";
import { aggregateDailyKpis } from "@/lib/utils/kpi-aggregation";
import { getGa4Overview } from "@/lib/integrations/ga4";
import { resolveIntegrationConfig } from "@/lib/integrations/config";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams: Promise<{ days?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const days = parseAnalysisDays(params.days);
  const periodLabel = getAnalysisPeriodLabel(days);
  const { startDate, endDate } = getAnalysisDateRange(days);

  const supabase = await createClient();
  const integrationConfig = await resolveIntegrationConfig();
  const ga4Configured = Boolean(integrationConfig.ga4);

  let ga4Data = null;
  let ga4Error: string | null = null;

  if (ga4Configured) {
    try {
      ga4Data = await getGa4Overview(days);
    } catch (err) {
      ga4Error = err instanceof Error ? err.message : "Erro ao ler GA4";
    }
  }

  const { data: kpis } = await supabase
    .from("daily_kpis")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  const availableDays = kpis?.length ?? 0;
  const aggregated = aggregateDailyKpis(kpis ?? []);

  const chartData = (kpis ?? []).map((k) => ({
    date: format(new Date(k.date), "dd/MM", { locale: pt }),
    google: k.google_spend ?? 0,
    meta: k.meta_spend ?? 0,
  }));

  const roasData = [
    { channel: "Google", roas: aggregated.googleRoas },
    { channel: "Meta", roas: aggregated.metaRoas },
    { channel: "Blended", roas: aggregated.blendedRoas },
  ];

  const description =
    availableDays < days
      ? `${periodLabel} · ${availableDays} de ${days} dias com dados (${startDate} → ${endDate})`
      : `${periodLabel} · ${startDate} → ${endDate}`;

  return (
    <div>
      <PageHeader
        title="Overview"
        description={`KPIs Google Ads + Meta Ads + GA4 · ${description}`}
        actions={
          <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-start">
            <DashboardSyncButton />
            <Suspense fallback={null}>
              <AnalysisPeriodSelector value={days} />
            </Suspense>
          </div>
        }
      />

      <DataCoverageAlert selectedDays={days} availableDays={availableDays} />

      <KpiGrid
        items={[
          {
            title: "Spend Total",
            value: formatCurrency(aggregated.totalSpend),
            icon: "💰",
          },
          {
            title: "Revenue Ads",
            value: formatCurrency(aggregated.totalRevenue),
            icon: "📈",
          },
          {
            title: "ROAS Blended",
            value: `${aggregated.blendedRoas.toFixed(2)}x`,
            icon: "🎯",
          },
          {
            title: ga4Configured && ga4Data && !ga4Error ? "Sessões GA4" : "Conversões Ads",
            value:
              ga4Configured && ga4Data && !ga4Error
                ? String(ga4Data.totals.sessions)
                : String(Math.round(aggregated.totalConversions)),
            icon: ga4Configured ? "📊" : "✅",
          },
        ]}
      />

      <Ga4OverviewSection
        configured={ga4Configured}
        propertyId={integrationConfig.ga4?.propertyId}
        periodLabel={periodLabel}
        days={days}
        data={ga4Data}
        error={ga4Error}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <SpendChart data={chartData} periodLabel={periodLabel} />
        <RoasChart data={roasData} periodLabel={periodLabel} />
      </div>
      <div className="mt-8">
        <PlatformSummary
          google={{
            spend: aggregated.googleSpend,
            revenue: aggregated.googleRevenue,
            roas: aggregated.googleRoas,
          }}
          meta={{
            spend: aggregated.metaSpend,
            revenue: aggregated.metaRevenue,
            roas: aggregated.metaRoas,
          }}
        />
      </div>
    </div>
  );
}
