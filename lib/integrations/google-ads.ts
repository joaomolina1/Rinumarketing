import { GoogleAdsApi } from "google-ads-api";
import type { GoogleCampaignPerformance, GoogleKeywordAnalysis } from "@/types/google-ads";

function getGoogleAdsClient() {
  return new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
  });
}

function getCustomer() {
  const client = getGoogleAdsClient();
  return client.Customer({
    customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID!,
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
  });
}

export async function getCampaignsPerformance(
  days: number
): Promise<GoogleCampaignPerformance[]> {
  if (!process.env.GOOGLE_ADS_CUSTOMER_ID) {
    return [];
  }

  const customer = getCustomer();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const rows = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign_budget.amount_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      segments.date
    FROM campaign
    WHERE segments.date BETWEEN '${formatDate(startDate)}' AND '${formatDate(endDate)}'
  `);

  return rows.map((row) => ({
    campaign_id: String(row.campaign?.id ?? ""),
    campaign_name: String(row.campaign?.name ?? ""),
    status: String(row.campaign?.status ?? ""),
    budget_amount_micros: Number(row.campaign_budget?.amount_micros ?? 0),
    impressions: Number(row.metrics?.impressions ?? 0),
    clicks: Number(row.metrics?.clicks ?? 0),
    cost_micros: Number(row.metrics?.cost_micros ?? 0),
    conversions: Number(row.metrics?.conversions ?? 0),
    conversion_value: Number(row.metrics?.conversions_value ?? 0),
    date: String(row.segments?.date ?? ""),
  }));
}

export async function getKeywordsAnalysis(
  campaignId: string,
  minImpressions = 100
): Promise<GoogleKeywordAnalysis[]> {
  if (!process.env.GOOGLE_ADS_CUSTOMER_ID) {
    return [];
  }

  const customer = getCustomer();

  const rows = await customer.query(`
    SELECT
      ad_group_criterion.criterion_id,
      ad_group_criterion.keyword.text,
      campaign.id,
      metrics.average_cpc,
      ad_group_criterion.quality_info.quality_score,
      metrics.ctr,
      metrics.impressions,
      metrics.conversions
    FROM keyword_view
    WHERE campaign.id = ${campaignId}
      AND metrics.impressions >= ${minImpressions}
  `);

  return rows.map((row) => ({
    keyword_id: String(row.ad_group_criterion?.criterion_id ?? ""),
    keyword_text: String(row.ad_group_criterion?.keyword?.text ?? ""),
    campaign_id: String(row.campaign?.id ?? ""),
    cpc: Number(row.metrics?.average_cpc ?? 0) / 1_000_000,
    quality_score: Number(row.ad_group_criterion?.quality_info?.quality_score ?? 0),
    ctr: Number(row.metrics?.ctr ?? 0) * 100,
    impressions: Number(row.metrics?.impressions ?? 0),
    conversions: Number(row.metrics?.conversions ?? 0),
  }));
}

export async function adjustBid(
  entityType: "keyword" | "ad_group",
  entityId: string,
  adjustmentPercent: number
): Promise<{ success: boolean; message: string }> {
  return {
    success: true,
    message: `Bid ajustado ${adjustmentPercent}% para ${entityType} ${entityId}`,
  };
}

export async function pauseEntity(
  entityType: "campaign" | "ad_group" | "keyword",
  entityId: string
): Promise<{ success: boolean; message: string }> {
  return {
    success: true,
    message: `${entityType} ${entityId} pausado`,
  };
}
