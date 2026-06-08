import type { MetaCampaignInsight, MetaCreativeInsight } from "@/types/meta-ads";

const META_API_BASE = "https://graph.facebook.com/v21.0";

function getMetaConfig() {
  return {
    accessToken: process.env.META_ACCESS_TOKEN!,
    adAccountId: process.env.META_AD_ACCOUNT_ID!,
  };
}

async function metaFetch<T>(endpoint: string): Promise<T> {
  const { accessToken } = getMetaConfig();
  const url = `${META_API_BASE}${endpoint}${endpoint.includes("?") ? "&" : "?"}access_token=${accessToken}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Meta API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getCampaignsInsights(days: number): Promise<MetaCampaignInsight[]> {
  if (!process.env.META_ACCESS_TOKEN || !process.env.META_AD_ACCOUNT_ID) {
    return [];
  }

  const { adAccountId } = getMetaConfig();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const until = new Date();

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  interface MetaInsightRow {
    campaign_id: string;
    campaign_name: string;
    impressions: string;
    clicks: string;
    spend: string;
    reach: string;
    frequency: string;
    actions?: Array<{ action_type: string; value: string }>;
    action_values?: Array<{ action_type: string; value: string }>;
    date_start: string;
  }

  const data = await metaFetch<{ data: MetaInsightRow[] }>(
    `/${adAccountId}/insights?level=campaign&fields=campaign_id,campaign_name,impressions,clicks,spend,reach,frequency,actions,action_values&time_range={"since":"${formatDate(since)}","until":"${formatDate(until)}"}&time_increment=1`
  );

  return (data.data ?? []).map((row) => {
    const conversions = row.actions?.find((a) => a.action_type === "purchase")?.value ?? "0";
    const conversionValue =
      row.action_values?.find((a) => a.action_type === "purchase")?.value ?? "0";

    return {
      campaign_id: row.campaign_id,
      campaign_name: row.campaign_name,
      status: "ACTIVE",
      daily_budget: 0,
      impressions: Number(row.impressions ?? 0),
      clicks: Number(row.clicks ?? 0),
      spend: Number(row.spend ?? 0),
      reach: Number(row.reach ?? 0),
      frequency: Number(row.frequency ?? 0),
      conversions: Number(conversions),
      conversion_value: Number(conversionValue),
      date: row.date_start,
    };
  });
}

export async function getCreativeInsights(
  campaignId: string
): Promise<MetaCreativeInsight[]> {
  if (!process.env.META_ACCESS_TOKEN) {
    return [];
  }

  interface MetaAdRow {
    ad_id: string;
    ad_name: string;
    impressions: string;
    frequency: string;
    ctr: string;
    spend: string;
  }

  const data = await metaFetch<{ data: MetaAdRow[] }>(
    `/${campaignId}/ads?fields=id,name,insights{impressions,frequency,ctr,spend}`
  );

  return (data.data ?? []).map((row) => ({
    ad_id: row.ad_id,
    ad_name: row.ad_name,
    campaign_id: campaignId,
    impressions: Number(row.impressions ?? 0),
    frequency: Number(row.frequency ?? 0),
    ctr: Number(row.ctr ?? 0),
    spend: Number(row.spend ?? 0),
  }));
}

export async function pauseAd(adId: string): Promise<{ success: boolean }> {
  const { accessToken } = getMetaConfig();
  const res = await fetch(`${META_API_BASE}/${adId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "PAUSED", access_token: accessToken }),
  });
  return { success: res.ok };
}

export async function updateCampaignBudget(
  campaignId: string,
  dailyBudgetEur: number
): Promise<{ success: boolean }> {
  const { accessToken } = getMetaConfig();
  const res = await fetch(`${META_API_BASE}/${campaignId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      daily_budget: Math.round(dailyBudgetEur * 100),
      access_token: accessToken,
    }),
  });
  return { success: res.ok };
}
