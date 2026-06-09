import type { Anomaly } from "@/lib/utils/anomalies";

interface GA4ConversionData {
  date: string;
  sessions: number;
  conversions: number;
  revenue: number;
  source: string;
  medium: string;
}

import { resolveIntegrationConfig } from "@/lib/integrations/config";

export async function getConversions(days: number): Promise<GA4ConversionData[]> {
  const config = await resolveIntegrationConfig();
  if (!config.ga4) {
    return [];
  }

  const credentials = JSON.parse(
    Buffer.from(config.ga4.credentialsJson, "base64").toString("utf-8")
  ) as { client_email: string; private_key: string; project_id?: string };

  const { BetaAnalyticsDataClient } = await import("@google-analytics/data");
  const client = new BetaAnalyticsDataClient({
    projectId: credentials.project_id,
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
  });

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const [response] = await client.runReport({
    property: `properties/${config.ga4.propertyId}`,
    dateRanges: [{ startDate: formatDate(startDate), endDate: formatDate(endDate) }],
    dimensions: [{ name: "date" }, { name: "sessionSource" }, { name: "sessionMedium" }],
    metrics: [
      { name: "sessions" },
      { name: "conversions" },
      { name: "totalRevenue" },
    ],
  });

  return (response.rows ?? []).map((row) => ({
    date: row.dimensionValues?.[0]?.value ?? "",
    source: row.dimensionValues?.[1]?.value ?? "",
    medium: row.dimensionValues?.[2]?.value ?? "",
    sessions: Number(row.metricValues?.[0]?.value ?? 0),
    conversions: Number(row.metricValues?.[1]?.value ?? 0),
    revenue: Number(row.metricValues?.[2]?.value ?? 0),
  }));
}

export interface Ga4OverviewData {
  totals: { sessions: number; conversions: number; revenue: number };
  dailySessions: { date: string; sessions: number }[];
  topChannels: {
    source: string;
    sessions: number;
    conversions: number;
    conversion_rate: number;
  }[];
}

function formatGa4Date(value: string) {
  if (value.length !== 8) return value;
  return `${value.slice(6, 8)}/${value.slice(4, 6)}`;
}

export async function getGa4Overview(days: number): Promise<Ga4OverviewData | null> {
  const rows = await getConversions(days);
  if (rows.length === 0) {
    return {
      totals: { sessions: 0, conversions: 0, revenue: 0 },
      dailySessions: [],
      topChannels: [],
    };
  }

  const byDate: Record<string, number> = {};
  const totals = { sessions: 0, conversions: 0, revenue: 0 };

  for (const row of rows) {
    totals.sessions += row.sessions;
    totals.conversions += row.conversions;
    totals.revenue += row.revenue;
    byDate[row.date] = (byDate[row.date] ?? 0) + row.sessions;
  }

  const attribution = await getAttributionData(days);

  return {
    totals,
    dailySessions: Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, sessions]) => ({
        date: formatGa4Date(date),
        sessions,
      })),
    topChannels: attribution
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5)
      .map((row) => ({
        source: row.source,
        sessions: row.sessions,
        conversions: row.conversions,
        conversion_rate: row.conversion_rate,
      })),
  };
}

export async function getAttributionData(days: number) {
  const conversions = await getConversions(days);
  const bySource: Record<string, { sessions: number; conversions: number; revenue: number }> = {};

  for (const row of conversions) {
    const key = `${row.source}/${row.medium}`;
    if (!bySource[key]) {
      bySource[key] = { sessions: 0, conversions: 0, revenue: 0 };
    }
    bySource[key].sessions += row.sessions;
    bySource[key].conversions += row.conversions;
    bySource[key].revenue += row.revenue;
  }

  return Object.entries(bySource).map(([source, data]) => ({
    source,
    ...data,
    conversion_rate: data.sessions > 0 ? (data.conversions / data.sessions) * 100 : 0,
  }));
}

export async function checkAnomalies(): Promise<Anomaly[]> {
  return [];
}
