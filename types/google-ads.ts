export interface GoogleCampaignPerformance {
  campaign_id: string;
  campaign_name: string;
  status: string;
  budget_amount_micros: number;
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
  conversion_value: number;
  date: string;
}

export interface GoogleKeywordAnalysis {
  keyword_id: string;
  keyword_text: string;
  campaign_id: string;
  cpc: number;
  quality_score: number;
  ctr: number;
  impressions: number;
  conversions: number;
}
