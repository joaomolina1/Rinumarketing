import type { Anomaly } from "@/lib/utils/anomalies";

interface GA4ConversionData {
  date: string;
  sessions: number;
  conversions: number;
  revenue: number;
  source: string;
  medium: string;
}

export async function getConversions(days: number): Promise<GA4ConversionData[]> {
  if (!process.env.GA4_PROPERTY_ID || !process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    return [];
  }

  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON, "base64").toString("utf-8")
  ) as { client_email: string; private_key: string };

  const { BetaAnalyticsDataClient } = await import("@google-analytics/data");
  const client = new BetaAnalyticsDataClient({ credentials });

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const [response] = await client.runReport({
    property: `properties/${process.env.GA4_PROPERTY_ID}`,
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
