import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { SpendChart } from "@/components/dashboard/SpendChart";
import { RoasChart } from "@/components/dashboard/RoasChart";
import { PlatformSummary } from "@/components/dashboard/PlatformSummary";
import { formatCurrency } from "@/lib/utils/formatters";
import { calculateRoas } from "@/lib/utils/metrics";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: kpis } = await supabase
    .from("daily_kpis")
    .select("*")
    .order("date", { ascending: false })
    .limit(30);

  const latest = kpis?.[0];
  const totalSpend = latest?.total_spend ?? 0;
  const totalRevenue = latest?.total_revenue ?? 0;
  const blendedRoas = latest?.blended_roas ?? 0;

  const googleSpend = kpis?.reduce((s, k) => s + (k.google_spend ?? 0), 0) ?? 0;
  const googleRevenue = kpis?.reduce((s, k) => s + (k.google_revenue ?? 0), 0) ?? 0;
  const metaSpend = kpis?.reduce((s, k) => s + (k.meta_spend ?? 0), 0) ?? 0;
  const metaRevenue = kpis?.reduce((s, k) => s + (k.meta_revenue ?? 0), 0) ?? 0;

  const chartData = (kpis ?? [])
    .slice()
    .reverse()
    .map((k) => ({
      date: format(new Date(k.date), "dd/MM", { locale: pt }),
      google: k.google_spend ?? 0,
      meta: k.meta_spend ?? 0,
    }));

  const roasData = [
    { channel: "Google", roas: calculateRoas(googleRevenue, googleSpend) },
    { channel: "Meta", roas: calculateRoas(metaRevenue, metaSpend) },
    { channel: "Blended", roas: blendedRoas },
  ];

  return (
    <div>
      <PageHeader
        title="Overview"
        description="KPIs consolidados Google Ads + Meta Ads"
      />
      <KpiGrid
        items={[
          { title: "Spend Total", value: formatCurrency(totalSpend), icon: "💰" },
          { title: "Revenue", value: formatCurrency(totalRevenue), icon: "📈" },
          { title: "ROAS Blended", value: `${blendedRoas.toFixed(2)}x`, icon: "🎯" },
          {
            title: "Conversões",
            value: String(
              (latest?.google_conversions ?? 0) + (latest?.meta_conversions ?? 0)
            ),
            icon: "✅",
          },
        ]}
      />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <SpendChart data={chartData} />
        <RoasChart data={roasData} />
      </div>
      <div className="mt-8">
        <PlatformSummary
          google={{
            spend: googleSpend,
            revenue: googleRevenue,
            roas: calculateRoas(googleRevenue, googleSpend),
          }}
          meta={{
            spend: metaSpend,
            revenue: metaRevenue,
            roas: calculateRoas(metaRevenue, metaSpend),
          }}
        />
      </div>
    </div>
  );
}
