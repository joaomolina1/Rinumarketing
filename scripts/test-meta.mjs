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

const token = process.env.META_ACCESS_TOKEN;
let adAccount = process.env.META_AD_ACCOUNT_ID ?? "";

if (!token || !adAccount) {
  console.error("Define META_ACCESS_TOKEN e META_AD_ACCOUNT_ID em .env.local");
  process.exit(1);
}

if (!adAccount.startsWith("act_")) {
  adAccount = `act_${adAccount}`;
}

const res = await fetch(
  `https://graph.facebook.com/v21.0/${adAccount}?fields=name,account_status,currency,timezone_name&access_token=${token}`
);
const data = await res.json();

if (!res.ok) {
  console.error("Meta API error:", data);
  process.exit(1);
}

console.log("Meta Ads OK:", {
  id: adAccount,
  name: data.name,
  status: data.account_status,
  currency: data.currency,
  timezone: data.timezone_name,
});
