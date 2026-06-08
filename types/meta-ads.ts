export interface MetaCampaignInsight {
  campaign_id: string;
  campaign_name: string;
  status: string;
  daily_budget: number;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  frequency: number;
  conversions: number;
  conversion_value: number;
  date: string;
}

export interface MetaCreativeInsight {
  ad_id: string;
  ad_name: string;
  campaign_id: string;
  impressions: number;
  frequency: number;
  ctr: number;
  spend: number;
}
