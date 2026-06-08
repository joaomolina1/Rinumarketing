import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { CampaignTable } from "@/components/campaigns/CampaignTable";
import { calculateRoas } from "@/lib/utils/metrics";

export default async function MetaCampaignsPage() {
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("meta_campaigns")
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
    if (existing) {
      existing.spend += c.spend ?? 0;
      existing.impressions += c.impressions ?? 0;
      existing.clicks += c.clicks ?? 0;
      existing.conversions += c.conversions ?? 0;
      existing.revenue += Number(c.conversion_value ?? 0);
    } else {
      aggregated.set(c.campaign_id, {
        id: c.campaign_id,
        name: c.campaign_name,
        status: c.status ?? "UNKNOWN",
        spend: c.spend ?? 0,
        impressions: c.impressions ?? 0,
        clicks: c.clicks ?? 0,
        conversions: c.conversions ?? 0,
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
        title="Meta Ads"
        description="Campanhas Facebook e Instagram"
      />
      <CampaignTable campaigns={rows} platform="meta" />
    </div>
  );
}
