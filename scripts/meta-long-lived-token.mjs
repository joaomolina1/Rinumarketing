/**
 * Meta Marketing API — troca token curto por longo e lista ad accounts.
 *
 * Pré-requisitos:
 * 1. App em https://developers.facebook.com/apps/
 * 2. Produto "Marketing API" adicionado à app
 * 3. Token curto do Graph API Explorer com permissões:
 *    ads_read, ads_management, business_management (mínimo ads_read para testar)
 *
 * Uso:
 *   node scripts/meta-long-lived-token.mjs <SHORT_LIVED_TOKEN>
 *
 * Ou define META_APP_ID, META_APP_SECRET e passa o token como argumento.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

function loadEnvLocal() {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const shortToken = process.argv[2];
const appId = process.env.META_APP_ID;
const appSecret = process.env.META_APP_SECRET;

if (!shortToken) {
  console.error("Uso: node scripts/meta-long-lived-token.mjs <SHORT_LIVED_TOKEN>");
  console.error("Define META_APP_ID e META_APP_SECRET em .env.local primeiro.");
  process.exit(1);
}

if (!appId || !appSecret) {
  console.error("Falta META_APP_ID ou META_APP_SECRET em .env.local");
  process.exit(1);
}

const exchangeUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
exchangeUrl.searchParams.set("grant_type", "fb_exchange_token");
exchangeUrl.searchParams.set("client_id", appId);
exchangeUrl.searchParams.set("client_secret", appSecret);
exchangeUrl.searchParams.set("fb_exchange_token", shortToken);

const exchangeRes = await fetch(exchangeUrl);
const exchangeData = await exchangeRes.json();

if (!exchangeRes.ok || !exchangeData.access_token) {
  console.error("Falha ao trocar token:", exchangeData);
  process.exit(1);
}

const longLived = exchangeData.access_token;
const expiresIn = exchangeData.expires_in
  ? `${Math.round(exchangeData.expires_in / 86400)} dias`
  : "sem expiração explícita";

console.log("\n✅ Long-lived access token:\n");
console.log(longLived);
console.log(`\nValidade aproximada: ${expiresIn}\n`);

const accountsRes = await fetch(
  `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name,account_id,account_status&access_token=${longLived}`
);
const accountsData = await accountsRes.json();

if (accountsRes.ok && accountsData.data?.length) {
  console.log("Ad accounts disponíveis:\n");
  for (const acc of accountsData.data) {
    const actId = acc.id?.startsWith("act_") ? acc.id : `act_${acc.account_id}`;
    console.log(`  ${actId}  —  ${acc.name}  (status ${acc.account_status})`);
  }
  console.log("\nUsa um destes IDs em META_AD_ACCOUNT_ID ou na app (Integrações).\n");
} else {
  console.log("Não foi possível listar ad accounts:", accountsData.error ?? accountsData);
  console.log("Confirma permissões ads_read e que a conta tem acesso ao Business Manager.\n");
}

function upsertEnv(key, value) {
  let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
  const re = new RegExp(`^${key}=.*`, "m");
  if (re.test(env)) {
    env = env.replace(re, `${key}=${value}`);
  } else {
    env += `\n${key}=${value}\n`;
  }
  fs.writeFileSync(envPath, env);
}

upsertEnv("META_ACCESS_TOKEN", longLived);
console.log("→ META_ACCESS_TOKEN gravado em .env.local\n");

if (accountsData.data?.[0]) {
  const first = accountsData.data[0];
  const actId = first.id?.startsWith("act_") ? first.id : `act_${first.account_id}`;
  upsertEnv("META_AD_ACCOUNT_ID", actId);
  console.log(`→ META_AD_ACCOUNT_ID=${actId} gravado em .env.local\n`);
}
