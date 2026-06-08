import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  getIntegrationStatus,
  getSettingsForUser,
  isOnboardingComplete,
  sanitizeSettingsForClient,
  settingsToResolvedConfig,
  upsertSettingsForUser,
} from "@/lib/settings/integrations";
import { clearIntegrationConfigCache } from "@/lib/integrations/config";

const updateSchema = z.object({
  google_ads_client_id: z.string().optional(),
  google_ads_client_secret: z.string().optional(),
  google_ads_refresh_token: z.string().optional(),
  google_ads_developer_token: z.string().optional(),
  google_ads_customer_id: z.string().optional(),
  ga4_property_id: z.string().optional(),
  google_application_credentials_json: z.string().optional(),
  meta_app_id: z.string().optional(),
  meta_app_secret: z.string().optional(),
  meta_access_token: z.string().optional(),
  meta_ad_account_id: z.string().optional(),
  anthropic_api_key: z.string().optional(),
  slack_bot_token: z.string().optional(),
  slack_channel_id: z.string().optional(),
  resend_api_key: z.string().optional(),
  report_recipient_email: z.string().optional(),
  n8n_webhook_url: z.string().optional(),
  n8n_api_key: z.string().optional(),
  onboarding_step: z.number().int().min(0).max(6).optional(),
  onboarding_completed_at: z.string().nullable().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const settings = await getSettingsForUser(user.id);
  const config = settingsToResolvedConfig(settings);

  return NextResponse.json({
    settings: sanitizeSettingsForClient(settings),
    status: getIntegrationStatus(config),
    onboardingComplete: isOnboardingComplete(settings),
  });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const existing = await getSettingsForUser(user.id);
    const saved = await upsertSettingsForUser(user.id, parsed.data, existing);
    clearIntegrationConfigCache();

    const config = settingsToResolvedConfig(saved);
    return NextResponse.json({
      settings: sanitizeSettingsForClient(saved),
      status: getIntegrationStatus(config),
      onboardingComplete: isOnboardingComplete(saved),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao guardar" },
      { status: 500 }
    );
  }
}
