import type {
  IntegrationSettings,
  IntegrationSettingsInput,
  ResolvedIntegrationConfig,
} from "@/types/integrations";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const SECRET_FIELDS: (keyof IntegrationSettings)[] = [
  "google_ads_client_secret",
  "google_ads_refresh_token",
  "google_ads_developer_token",
  "google_application_credentials_json",
  "meta_app_secret",
  "meta_access_token",
  "anthropic_api_key",
  "slack_bot_token",
  "resend_api_key",
  "n8n_api_key",
];

function pickString(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (value && value.trim()) return value.trim();
  }
  return null;
}

function hasGoogleAdsEnv() {
  return Boolean(
    process.env.GOOGLE_ADS_CLIENT_ID &&
      process.env.GOOGLE_ADS_CLIENT_SECRET &&
      process.env.GOOGLE_ADS_REFRESH_TOKEN &&
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
      process.env.GOOGLE_ADS_CUSTOMER_ID
  );
}

function hasMetaEnv() {
  return Boolean(process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID);
}

function hasGa4Env() {
  return Boolean(
    process.env.GA4_PROPERTY_ID && process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  );
}

function hasAnthropicEnv() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function hasSlackEnv() {
  return Boolean(process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID);
}

export function maskSecret(value: string | null | undefined) {
  if (!value) return null;
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export function sanitizeSettingsForClient(
  settings: IntegrationSettings | null
): IntegrationSettings | null {
  if (!settings) return null;

  const sanitized = { ...settings } as Record<string, unknown>;
  for (const field of SECRET_FIELDS) {
    if (sanitized[field]) {
      sanitized[field] = maskSecret(String(sanitized[field]));
    }
  }
  return sanitized as unknown as IntegrationSettings;
}

export function settingsToResolvedConfig(
  settings: IntegrationSettings | null
): ResolvedIntegrationConfig {
  const googleClientId = pickString(
    settings?.google_ads_client_id,
    process.env.GOOGLE_ADS_CLIENT_ID
  );
  const googleClientSecret = pickString(
    settings?.google_ads_client_secret,
    process.env.GOOGLE_ADS_CLIENT_SECRET
  );
  const googleRefreshToken = pickString(
    settings?.google_ads_refresh_token,
    process.env.GOOGLE_ADS_REFRESH_TOKEN
  );
  const googleDeveloperToken = pickString(
    settings?.google_ads_developer_token,
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  );
  const googleCustomerId = pickString(
    settings?.google_ads_customer_id,
    process.env.GOOGLE_ADS_CUSTOMER_ID
  );

  const googleAds =
    googleClientId &&
    googleClientSecret &&
    googleRefreshToken &&
    googleDeveloperToken &&
    googleCustomerId
      ? {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
          refreshToken: googleRefreshToken,
          developerToken: googleDeveloperToken,
          customerId: googleCustomerId.replace(/-/g, ""),
        }
      : null;

  const metaAccessToken = pickString(
    settings?.meta_access_token,
    process.env.META_ACCESS_TOKEN
  );
  const metaAdAccountId = pickString(
    settings?.meta_ad_account_id,
    process.env.META_AD_ACCOUNT_ID
  );

  const meta =
    metaAccessToken && metaAdAccountId
      ? {
          appId: pickString(settings?.meta_app_id, process.env.META_APP_ID) ?? "",
          appSecret:
            pickString(settings?.meta_app_secret, process.env.META_APP_SECRET) ?? "",
          accessToken: metaAccessToken,
          adAccountId: metaAdAccountId.startsWith("act_")
            ? metaAdAccountId
            : `act_${metaAdAccountId}`,
        }
      : null;

  const ga4PropertyId = pickString(settings?.ga4_property_id, process.env.GA4_PROPERTY_ID);
  const ga4Credentials = pickString(
    settings?.google_application_credentials_json,
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  );

  const ga4 =
    ga4PropertyId && ga4Credentials
      ? { propertyId: ga4PropertyId, credentialsJson: ga4Credentials }
      : null;

  const anthropicKey = pickString(settings?.anthropic_api_key, process.env.ANTHROPIC_API_KEY);
  const anthropic = anthropicKey ? { apiKey: anthropicKey } : null;

  const slackBotToken = pickString(settings?.slack_bot_token, process.env.SLACK_BOT_TOKEN);
  const slackChannelId = pickString(
    settings?.slack_channel_id,
    process.env.SLACK_CHANNEL_ID
  );
  const slack =
    slackBotToken && slackChannelId
      ? { botToken: slackBotToken, channelId: slackChannelId }
      : null;

  return { googleAds, meta, ga4, anthropic, slack };
}

export function getIntegrationStatus(config: ResolvedIntegrationConfig) {
  return {
    googleAds: Boolean(config.googleAds),
    meta: Boolean(config.meta),
    ga4: Boolean(config.ga4),
    anthropic: Boolean(config.anthropic),
    slack: Boolean(config.slack),
    fromEnv: {
      googleAds: hasGoogleAdsEnv(),
      meta: hasMetaEnv(),
      ga4: hasGa4Env(),
      anthropic: hasAnthropicEnv(),
      slack: hasSlackEnv(),
    },
  };
}

export async function getSettingsForUser(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("integration_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return data as IntegrationSettings | null;
}

export async function getActiveIntegrationConfig(userId?: string) {
  if (userId) {
    const settings = await getSettingsForUser(userId);
    return settingsToResolvedConfig(settings);
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("integration_settings")
    .select("*")
    .not("onboarding_completed_at", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return settingsToResolvedConfig(data as IntegrationSettings | null);
}

export async function upsertSettingsForUser(
  userId: string,
  input: IntegrationSettingsInput,
  _existing: IntegrationSettings | null
) {
  const payload: IntegrationSettingsInput & { user_id: string } = {
    user_id: userId,
    ...input,
  };

  for (const field of SECRET_FIELDS) {
    const value = input[field as keyof IntegrationSettingsInput];
    if (typeof value === "string" && value.includes("••••")) {
      delete payload[field as keyof IntegrationSettingsInput];
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integration_settings")
    .upsert({ ...payload, user_id: userId }, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) throw error;
  return data as IntegrationSettings;
}

export function isOnboardingComplete(settings: IntegrationSettings | null) {
  if (settings?.onboarding_completed_at) return true;

  const config = settingsToResolvedConfig(settings);
  return Boolean(config.googleAds && config.meta && config.anthropic);
}
