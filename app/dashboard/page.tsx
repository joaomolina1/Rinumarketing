import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { SpendChart } from "@/components/dashboard/SpendChart";
import { RoasChart } from "@/components/dashboard/RoasChart";
import { PlatformSummary } from "@/components/dashboard/PlatformSummary";
import { AnalysisPeriodSelector } from "@/components/dashboard/AnalysisPeriodSelector";
import { formatCurrency } from "@/lib/utils/formatters";
import {
  getAnalysisPeriodLabel,
  parseAnalysisDays,
} from "@/lib/utils/analysis-period";
import { aggregateDailyKpis } from "@/lib/utils/kpi-aggregation";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface DashboardPageProps {
  searchParams: Promise<{ days?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const days = parseAnalysisDays(params.days);
  const periodLabel = getAnalysisPeriodLabel(days);

  const supabase = await createClient();

  const { data: kpis } = await supabase
    .from("daily_kpis")
    .select("*")
    .order("date", { ascending: false })
    .limit(days);

  const aggregated = aggregateDailyKpis(kpis ?? []);

  const chartData = (kpis ?? [])
    .slice()
    .reverse()
    .map((k) => ({
      date: format(new Date(k.date), "dd/MM", { locale: pt }),
      google: k.google_spend ?? 0,
      meta: k.meta_spend ?? 0,
    }));

  const roasData = [
    { channel: "Google", roas: aggregated.googleRoas },
    { channel: "Meta", roas: aggregated.metaRoas },
    { channel: "Blended", roas: aggregated.blendedRoas },
  ];

  return (
    <div>
      <PageHeader
        title="Overview"
        description={`KPIs consolidados Google Ads + Meta Ads · ${periodLabel}`}
        actions={
          <Suspense fallback={null}>
            <AnalysisPeriodSelector value={days} />
          </Suspense>
        }
      />
      <KpiGrid
        items={[
          {
            title: "Spend Total",
            value: formatCurrency(aggregated.totalSpend),
            icon: "💰",
          },
          {
            title: "Revenue",
            value: formatCurrency(aggregated.totalRevenue),
            icon: "📈",
          },
          {
            title: "ROAS Blended",
            value: `${aggregated.blendedRoas.toFixed(2)}x`,
            icon: "🎯",
          },
          {
            title: "Conversões",
            value: String(Math.round(aggregated.totalConversions)),
            icon: "✅",
          },
        ]}
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
