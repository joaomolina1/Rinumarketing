import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const env = {};

for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
}

const userId = process.argv[2] ?? "fcf3d9d1-30f2-4894-b8a3-5b41fc9702a4";
const fields = {
  google_ads_client_id: env.GOOGLE_ADS_CLIENT_ID,
  google_ads_client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  google_ads_refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  google_ads_developer_token: env.GOOGLE_ADS_DEVELOPER_TOKEN,
  google_ads_customer_id: env.GOOGLE_ADS_CUSTOMER_ID,
  meta_app_id: env.META_APP_ID,
  meta_app_secret: env.META_APP_SECRET,
  meta_access_token: env.META_ACCESS_TOKEN,
  meta_ad_account_id: env.META_AD_ACCOUNT_ID,
  anthropic_api_key: env.ANTHROPIC_API_KEY,
  ga4_property_id: env.GA4_PROPERTY_ID,
  google_application_credentials_json: env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
};

function quote(value) {
  return `'${String(value ?? "").replace(/'/g, "''")}'`;
}

const cols = Object.keys(fields);
const insertCols = ["user_id", ...cols, "onboarding_step", "onboarding_completed_at"];
const insertVals = [quote(userId), ...cols.map((c) => quote(fields[c])), "5", "now()"];
const updates = [
  ...cols.map((c) => `${c} = EXCLUDED.${c}`),
  "onboarding_step = 5",
  "onboarding_completed_at = COALESCE(integration_settings.onboarding_completed_at, now())",
  "updated_at = now()",
];

const sql = `INSERT INTO integration_settings (${insertCols.join(", ")})
VALUES (${insertVals.join(", ")})
ON CONFLICT (user_id) DO UPDATE SET ${updates.join(", ")}
RETURNING user_id, ga4_property_id, meta_ad_account_id, onboarding_completed_at;`;

const outPath = path.join(__dirname, "..", ".seed-integration.sql");
fs.writeFileSync(outPath, sql);
console.log(outPath);
console.log("bytes", sql.length);
