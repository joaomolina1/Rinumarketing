import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/formatters";
import { subDays, startOfWeek, endOfWeek, format } from "date-fns";
import { pt } from "date-fns/locale";

export async function generateWeeklyReport(period: "last_week" | "custom" = "last_week") {
  const admin = createAdminClient();
  const now = new Date();
  const weekStart = startOfWeek(subDays(now, 7), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(subDays(now, 7), { weekStartsOn: 1 });

  const { data: kpis } = await admin
    .from("daily_kpis")
    .select("*")
    .gte("date", format(weekStart, "yyyy-MM-dd"))
    .lte("date", format(weekEnd, "yyyy-MM-dd"));

  const { data: actions } = await admin
    .from("agent_actions")
    .select("*")
    .eq("status", "executed")
    .gte("executed_at", weekStart.toISOString())
    .lte("executed_at", weekEnd.toISOString());

  const totals = (kpis ?? []).reduce(
    (acc, k) => ({
      spend: acc.spend + (k.total_spend ?? 0),
      revenue: acc.revenue + (k.total_revenue ?? 0),
      google_spend: acc.google_spend + (k.google_spend ?? 0),
      meta_spend: acc.meta_spend + (k.meta_spend ?? 0),
    }),
    { spend: 0, revenue: 0, google_spend: 0, meta_spend: 0 }
  );

  const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    system: "Geras relatórios semanais de marketing digital para a RINU em português de Portugal.",
    messages: [
      {
        role: "user",
        content: `Gera um relatório semanal com:
- Spend total: ${formatCurrency(totals.spend)}
- Revenue: ${formatCurrency(totals.revenue)}
- ROAS: ${roas.toFixed(2)}x
- Google spend: ${formatCurrency(totals.google_spend)}
- Meta spend: ${formatCurrency(totals.meta_spend)}
- Acções executadas: ${actions?.length ?? 0}

Devolve JSON: { "summary": "...", "insights": ["..."], "recommendations": ["..."], "html_content": "..." }`,
      },
    ],
  });

  const rawText = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  let parsed: {
    summary: string;
    insights: string[];
    recommendations: string[];
    html_content: string;
  };

  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = {
      summary: rawText.slice(0, 300),
      insights: [],
      recommendations: [],
      html_content: `<p>${rawText}</p>`,
    };
  }

  const title = `Relatório Semanal — ${format(weekStart, "dd/MM", { locale: pt })} a ${format(weekEnd, "dd/MM/yyyy", { locale: pt })}`;

  const { data: report, error } = await admin
    .from("reports")
    .insert({
      week_start: format(weekStart, "yyyy-MM-dd"),
      week_end: format(weekEnd, "yyyy-MM-dd"),
      title,
      summary: parsed.summary,
      html_content: parsed.html_content,
      metrics_snapshot: totals,
      actions_taken: actions ?? [],
      insights: parsed.insights,
      recommendations: parsed.recommendations,
      status: "draft",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return report;
}
