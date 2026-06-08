import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { CampaignTable } from "@/components/campaigns/CampaignTable";
import { microsToEur } from "@/lib/utils/formatters";
import { calculateRoas } from "@/lib/utils/metrics";

export default async function GoogleCampaignsPage() {
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("google_campaigns")
    .select("*")
    .order("date", { ascending: false })
    .limit(100);

  const aggregated = new Map<string, {
    id: string;
    name: string;
    status: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }>();

  for (const c of campaigns ?? []) {
    const existing = aggregated.get(c.campaign_id);
    const spend = microsToEur(c.cost_micros ?? 0);
    if (existing) {
      existing.spend += spend;
      existing.impressions += c.impressions ?? 0;
      existing.clicks += c.clicks ?? 0;
      existing.conversions += Number(c.conversions ?? 0);
      existing.revenue += Number(c.conversion_value ?? 0);
    } else {
      aggregated.set(c.campaign_id, {
        id: c.campaign_id,
        name: c.campaign_name,
        status: c.status ?? "UNKNOWN",
        spend,
        impressions: c.impressions ?? 0,
        clicks: c.clicks ?? 0,
        conversions: Number(c.conversions ?? 0),
        revenue: Number(c.conversion_value ?? 0),
      });
    }
  }

  const rows = Array.from(aggregated.values()).map((c) => ({
    ...c,
    roas: calculateRoas(c.revenue, c.spend),
  }));

  return (
    <div>
      <PageHeader
        title="Google Ads"
        description="Campanhas e métricas de desempenho"
      />
      <CampaignTable campaigns={rows} platform="google" />
    </div>
  );
}
