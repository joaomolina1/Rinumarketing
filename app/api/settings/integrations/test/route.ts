import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GoogleAdsApi } from "google-ads-api";
import { createClient } from "@/lib/supabase/server";
import {
  getSettingsForUser,
  settingsToResolvedConfig,
  upsertSettingsForUser,
} from "@/lib/settings/integrations";
import type { IntegrationTestTarget } from "@/types/integrations";

const schema = z.object({
  target: z.enum(["google_ads", "meta", "ga4", "anthropic", "slack"]),
  values: z.record(z.string(), z.string()).optional(),
});

async function mergeTestConfig(
  userId: string,
  values?: Record<string, string>
) {
  const existing = await getSettingsForUser(userId);
  if (!values) {
    return settingsToResolvedConfig(existing);
  }

  const merged = await upsertSettingsForUser(userId, values, existing);
  return settingsToResolvedConfig(merged);
}

async function testGoogleAds(config: Awaited<ReturnType<typeof settingsToResolvedConfig>>) {
  if (!config.googleAds) {
    throw new Error("Preencha todos os campos do Google Ads");
  }

  const client = new GoogleAdsApi({
    client_id: config.googleAds.clientId,
    client_secret: config.googleAds.clientSecret,
    developer_token: config.googleAds.developerToken,
  });

  const customer = client.Customer({
    customer_id: config.googleAds.customerId,
    refresh_token: config.googleAds.refreshToken,
  });

  const rows = await customer.query(`
    SELECT campaign.id, campaign.name
    FROM campaign
    LIMIT 1
  `);

  return {
    ok: true,
    message: `Ligação OK — ${rows.length > 0 ? "campanhas encontradas" : "conta acessível"}`,
  };
}

async function testMeta(config: Awaited<ReturnType<typeof settingsToResolvedConfig>>) {
  if (!config.meta) {
    throw new Error("Preencha o Access Token e Ad Account ID da Meta");
  }

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${config.meta.adAccountId}?fields=name,account_status&access_token=${config.meta.accessToken}`
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Meta API error (${res.status}): ${body.slice(0, 180)}`);
  }

  const data = (await res.json()) as { name?: string; account_status?: number };
  return {
    ok: true,
    message: `Ligação OK — conta "${data.name ?? config.meta.adAccountId}"`,
  };
}

async function testGa4(config: Awaited<ReturnType<typeof settingsToResolvedConfig>>) {
  if (!config.ga4) {
    throw new Error("Preencha Property ID e credenciais GA4");
  }

  const credentials = JSON.parse(
    Buffer.from(config.ga4.credentialsJson, "base64").toString("utf-8")
  ) as { client_email: string; private_key: string };

  const { BetaAnalyticsDataClient } = await import("@google-analytics/data");
  const client = new BetaAnalyticsDataClient({ credentials });

  await client.runReport({
    property: `properties/${config.ga4.propertyId}`,
    dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
    metrics: [{ name: "sessions" }],
    limit: 1,
  });

  return { ok: true, message: "Ligação GA4 OK" };
}

async function testAnthropic(
  config: Awaited<ReturnType<typeof settingsToResolvedConfig>>
) {
  if (!config.anthropic) {
    throw new Error("Preencha a Anthropic API Key");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": config.anthropic.apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 16,
      messages: [{ role: "user", content: "ping" }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${body.slice(0, 180)}`);
  }

  return { ok: true, message: "Ligação Claude OK" };
}

async function testSlack(config: Awaited<ReturnType<typeof settingsToResolvedConfig>>) {
  if (!config.slack) {
    throw new Error("Preencha Bot Token e Channel ID do Slack");
  }

  const res = await fetch("https://slack.com/api/auth.test", {
    headers: { Authorization: `Bearer ${config.slack.botToken}` },
  });
  const data = (await res.json()) as { ok: boolean; team?: string; error?: string };

  if (!data.ok) {
    throw new Error(data.error ?? "Slack auth.test falhou");
  }

  return { ok: true, message: `Slack OK — workspace ${data.team ?? ""}`.trim() };
}

const testers: Record<
  IntegrationTestTarget,
  (config: Awaited<ReturnType<typeof settingsToResolvedConfig>>) => Promise<{
    ok: boolean;
    message: string;
  }>
> = {
  google_ads: testGoogleAds,
  meta: testMeta,
  ga4: testGa4,
  anthropic: testAnthropic,
  slack: testSlack,
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const config = await mergeTestConfig(user.id, parsed.data.values);
    const result = await testers[parsed.data.target](config);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        message: err instanceof Error ? err.message : "Teste falhou",
      },
      { status: 400 }
    );
  }
}
