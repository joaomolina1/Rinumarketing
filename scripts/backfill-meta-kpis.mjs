/**
 * Backfill daily_kpis meta metrics from Meta account insights.
 * Uso: node scripts/backfill-meta-kpis.mjs
 */

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

const days = Number(process.argv[2] ?? 30);
const token = env.META_ACCESS_TOKEN;
const act = env.META_AD_ACCOUNT_ID;

if (!token || !act) {
  console.error("META_ACCESS_TOKEN e META_AD_ACCOUNT_ID necessários em .env.local");
  process.exit(1);
}

const since = new Date();
since.setDate(since.getDate() - days);
const fmt = (d) => d.toISOString().split("T")[0];

const url =
  `https://graph.facebook.com/v21.0/${act}/insights?fields=spend,actions,action_values` +
  `&time_range=${encodeURIComponent(JSON.stringify({ since: fmt(since), until: fmt(new Date()) }))}` +
  `&time_increment=1&access_token=${token}`;

const data = await (await fetch(url)).json();
if (!data.data) {
  console.error("Meta API error:", data);
  process.exit(1);
}

const statements = [];
for (const row of data.data) {
  const date = row.date_start;
  const spend = Number(row.spend ?? 0);
  const conv = Number(
    row.actions?.find((a) => a.action_type === "purchase")?.value ?? 0
  );
  const rev = Number(
    row.action_values?.find((a) => a.action_type === "purchase")?.value ?? 0
  );

  statements.push(
    `INSERT INTO daily_kpis (date, meta_spend, meta_conversions, meta_revenue, google_spend, google_conversions, google_revenue) ` +
      `VALUES ('${date}', ${spend}, ${conv}, ${rev}, 0, 0, 0) ` +
      `ON CONFLICT (date) DO UPDATE SET meta_spend = EXCLUDED.meta_spend, meta_conversions = EXCLUDED.meta_conversions, meta_revenue = EXCLUDED.meta_revenue;`
  );
}

const out = path.join(__dirname, "..", ".backfill-meta.sql");
fs.writeFileSync(out, statements.join("\n"));
console.log(`Gerado ${statements.length} dias → ${out}`);
