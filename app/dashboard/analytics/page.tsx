import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { formatCurrency } from "@/lib/utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const { data: kpis } = await supabase
    .from("daily_kpis")
    .select("*")
    .order("date", { ascending: false })
    .limit(7);

  const totals = (kpis ?? []).reduce(
    (acc, k) => ({
      spend: acc.spend + (k.total_spend ?? 0),
      revenue: acc.revenue + (k.total_revenue ?? 0),
      conversions:
        acc.conversions + (k.google_conversions ?? 0) + (k.meta_conversions ?? 0),
    }),
    { spend: 0, revenue: 0, conversions: 0 }
  );

  const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;
  const cpa = totals.conversions > 0 ? totals.spend / totals.conversions : 0;

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="ROAS, atribuição e funil de conversão"
      />
      <KpiGrid
        items={[
          { title: "Spend (7d)", value: formatCurrency(totals.spend) },
          { title: "Revenue (7d)", value: formatCurrency(totals.revenue) },
          { title: "ROAS", value: `${roas.toFixed(2)}x` },
          { title: "CPA", value: formatCurrency(cpa) },
        ]}
      />
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Atribuição Multi-canal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Configure as credenciais GA4 e execute o sync para ver dados de atribuição detalhados.
              Os dados de Google Ads e Meta são consolidados automaticamente nos KPIs diários.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
