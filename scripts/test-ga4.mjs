import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  process.env[trimmed.slice(0, eq).trim()] ??= trimmed.slice(eq + 1).trim();
}

const propertyId = process.env.GA4_PROPERTY_ID;
const credentialsB64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

if (!propertyId || !credentialsB64) {
  console.error("Define GA4_PROPERTY_ID e GOOGLE_APPLICATION_CREDENTIALS_JSON em .env.local");
  process.exit(1);
}

const credentials = JSON.parse(
  Buffer.from(credentialsB64, "base64").toString("utf-8")
);

const { BetaAnalyticsDataClient } = await import("@google-analytics/data");
const client = new BetaAnalyticsDataClient({
  projectId: credentials.project_id,
  credentials: {
    client_email: credentials.client_email,
    private_key: credentials.private_key,
  },
});

try {
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
    metrics: [{ name: "sessions" }],
    limit: 1,
  });

  console.log("GA4 OK:", {
    propertyId,
    serviceAccount: credentials.client_email,
    rows: response.rows?.length ?? 0,
    sessions: response.rows?.[0]?.metricValues?.[0]?.value ?? "0",
  });
} catch (err) {
  console.error("GA4 FAIL:", err.message ?? err);
  process.exit(1);
}
