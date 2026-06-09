import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCampaignsPerformance } from "@/lib/integrations/google-ads";
import { createAdminClient } from "@/lib/supabase/server";
import { authorizeApiRequest } from "@/lib/api/auth";
import { microsToEur } from "@/lib/utils/formatters";

const schema = z.object({
  days: z.number().int().min(1).max(90).default(30),
});

export async function POST(req: NextRequest) {
  if (!(await authorizeApiRequest(req))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  try {
    const campaigns = await getCampaignsPerformance(parsed.success ? parsed.data.days : 30);
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
      const { data: existing } = await admin
        .from("daily_kpis")
        .select("*")
        .eq("date", date)
        .single();

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

    return NextResponse.json({ synced: campaigns.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro no sync" },
      { status: 500 }
    );
  }
}
