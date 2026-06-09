import type { Database } from "@/types/database";
import { calculateRoas } from "@/lib/utils/metrics";

type DailyKpi = Database["public"]["Tables"]["daily_kpis"]["Row"];

export function aggregateDailyKpis(kpis: DailyKpi[]) {
  const totals = kpis.reduce(
    (acc, kpi) => ({
      googleSpend: acc.googleSpend + (kpi.google_spend ?? 0),
      googleRevenue: acc.googleRevenue + (kpi.google_revenue ?? 0),
      googleConversions: acc.googleConversions + (kpi.google_conversions ?? 0),
      metaSpend: acc.metaSpend + (kpi.meta_spend ?? 0),
      metaRevenue: acc.metaRevenue + (kpi.meta_revenue ?? 0),
      metaConversions: acc.metaConversions + (kpi.meta_conversions ?? 0),
    }),
    {
      googleSpend: 0,
      googleRevenue: 0,
      googleConversions: 0,
      metaSpend: 0,
      metaRevenue: 0,
      metaConversions: 0,
    }
  );

  const totalSpend = totals.googleSpend + totals.metaSpend;
  const totalRevenue = totals.googleRevenue + totals.metaRevenue;
  const totalConversions = totals.googleConversions + totals.metaConversions;

  return {
    ...totals,
    totalSpend,
    totalRevenue,
    totalConversions,
    blendedRoas: calculateRoas(totalRevenue, totalSpend),
    googleRoas: calculateRoas(totals.googleRevenue, totals.googleSpend),
    metaRoas: calculateRoas(totals.metaRevenue, totals.metaSpend),
  };
}
