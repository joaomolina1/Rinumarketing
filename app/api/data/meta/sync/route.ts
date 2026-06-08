import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCampaignsInsights } from "@/lib/integrations/meta-ads";
import { createAdminClient } from "@/lib/supabase/server";
import { authorizeApiRequest } from "@/lib/api/auth";

const schema = z.object({
  days: z.number().int().min(1).max(30).default(1),
});

export async function POST(req: NextRequest) {
  if (!(await authorizeApiRequest(req))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  try {
    const campaigns = await getCampaignsInsights(parsed.success ? parsed.data.days : 1);
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
      const { data: existing } = await admin
        .from("daily_kpis")
        .select("*")
        .eq("date", date)
        .single();

      await admin.from("daily_kpis").upsert({
        date,
        google_spend: existing?.google_spend ?? 0,
        google_conversions: existing?.google_conversions ?? 0,
        google_revenue: existing?.google_revenue ?? 0,
        meta_spend: metrics.spend,
        meta_conversions: metrics.conversions,
        meta_revenue: metrics.revenue,
      });
    }

    return NextResponse.json({ synced: campaigns.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro no sync" },
      { status: 500 }
    );
  }
}
