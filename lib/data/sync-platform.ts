import { getCampaignsInsights } from "@/lib/integrations/meta-ads";
import { getCampaignsPerformance } from "@/lib/integrations/google-ads";
import { createAdminClient } from "@/lib/supabase/server";
import { microsToEur } from "@/lib/utils/formatters";

export async function syncMetaCampaigns(days: number) {
  const campaigns = await getCampaignsInsights(days);
  const admin = createAdminClient();

  if (campaigns.length > 0) {
    await admin.from("meta_campaigns").insert(
      campaigns.map((c) => ({
        campaign_id: c.campaign_id,
        campaign_name: c.campaign_name,
        status: c.status,
        daily_budget: c.daily_budget,
        impressions: c.impressions,
        clicks: c.clicks,
        spend: c.spend,
        reach: c.reach,
        frequency: c.frequency,
        conversions: c.conversions,
        conversion_value: c.conversion_value,
        date: c.date,
      }))
    );
  }

  const byDate: Record<string, { spend: number; conversions: number; revenue: number }> = {};
  for (const c of campaigns) {
    if (!byDate[c.date]) byDate[c.date] = { spend: 0, conversions: 0, revenue: 0 };
    byDate[c.date].spend += c.spend;
    byDate[c.date].conversions += c.conversions;
    byDate[c.date].revenue += c.conversion_value;
  }

  for (const [date, metrics] of Object.entries(byDate)) {
    const { data: existing } = await admin.from("daily_kpis").select("*").eq("date", date).single();
    await admin.from("daily_kpis").upsert(
      {
        date,
        google_spend: existing?.google_spend ?? 0,
        google_conversions: existing?.google_conversions ?? 0,
        google_revenue: existing?.google_revenue ?? 0,
        meta_spend: metrics.spend,
        meta_conversions: metrics.conversions,
        meta_revenue: metrics.revenue,
      },
      { onConflict: "date" }
    );
  }

  return campaigns.length;
}

export async function syncGoogleCampaigns(days: number) {
  const campaigns = await getCampaignsPerformance(days);
  const admin = createAdminClient();

  if (campaigns.length > 0) {
    await admin.from("google_campaigns").insert(
      campaigns.map((c) => ({
        campaign_id: c.campaign_id,
        campaign_name: c.campaign_name,
        status: c.status,
        budget_amount_micros: c.budget_amount_micros,
        impressions: c.impressions,
        clicks: c.clicks,
        cost_micros: c.cost_micros,
        conversions: c.conversions,
        conversion_value: c.conversion_value,
        date: c.date,
      }))
    );
  }

  const byDate: Record<string, { spend: number; conversions: number; revenue: number }> = {};
  for (const c of campaigns) {
    if (!byDate[c.date]) byDate[c.date] = { spend: 0, conversions: 0, revenue: 0 };
    byDate[c.date].spend += microsToEur(c.cost_micros);
    byDate[c.date].conversions += c.conversions;
    byDate[c.date].revenue += c.conversion_value;
  }

  for (const [date, metrics] of Object.entries(byDate)) {
    const { data: existing } = await admin.from("daily_kpis").select("*").eq("date", date).single();
    await admin.from("daily_kpis").upsert(
      {
        date,
        google_spend: metrics.spend,
        google_conversions: metrics.conversions,
        google_revenue: metrics.revenue,
        meta_spend: existing?.meta_spend ?? 0,
        meta_conversions: existing?.meta_conversions ?? 0,
        meta_revenue: existing?.meta_revenue ?? 0,
      },
      { onConflict: "date" }
    );
  }

  return campaigns.length;
}
