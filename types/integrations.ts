export interface IntegrationSettings {
  user_id: string;
  google_ads_client_id: string | null;
  google_ads_client_secret: string | null;
  google_ads_refresh_token: string | null;
  google_ads_developer_token: string | null;
  google_ads_customer_id: string | null;
  ga4_property_id: string | null;
  google_application_credentials_json: string | null;
  meta_app_id: string | null;
  meta_app_secret: string | null;
  meta_access_token: string | null;
  meta_ad_account_id: string | null;
  anthropic_api_key: string | null;
  slack_bot_token: string | null;
  slack_channel_id: string | null;
  resend_api_key: string | null;
  report_recipient_email: string | null;
  n8n_webhook_url: string | null;
  n8n_api_key: string | null;
  onboarding_step: number;
  onboarding_completed_at: string | null;
  updated_at: string;
}

export type IntegrationSettingsInput = Partial<
  Omit<IntegrationSettings, "user_id" | "updated_at">
>;

export type IntegrationTestTarget =
  | "google_ads"
  | "meta"
  | "ga4"
  | "anthropic"
  | "slack";

export interface ResolvedIntegrationConfig {
  googleAds: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    developerToken: string;
    customerId: string;
  } | null;
  meta: {
    appId: string;
    appSecret: string;
    accessToken: string;
    adAccountId: string;
  } | null;
  ga4: {
    propertyId: string;
    credentialsJson: string;
  } | null;
  anthropic: { apiKey: string } | null;
  slack: { botToken: string; channelId: string } | null;
}
