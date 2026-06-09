/**
 * Concede acesso GA4 a uma service account via Analytics Admin API.
 *
 * Uso:
 *   npm run ga4:grant-access
 *   npm run ga4:grant-access:token -- <ACCESS_TOKEN_DO_PLAYGROUND>
 */

import http from "http";
import { URL } from "url";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { OAuth2Client } from "google-auth-library";

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

const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET;
const REDIRECT_URI = "http://127.0.0.1:8080";
const SCOPE = "https://www.googleapis.com/auth/analytics.manage.users";

const propertyId = process.env.GA4_PROPERTY_ID ?? "447428655";
const serviceAccountEmail =
  "rinu-ga4-reader@rinu-39803.iam.gserviceaccount.com";

const tokenArg = process.argv.find((a) => a.startsWith("ya29.")) ?? process.argv[2];

function buildAuthUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function openBrowser(url) {
  if (process.platform === "win32") {
    exec(`cmd /c start "" "${url}"`);
  } else if (process.platform === "darwin") {
    exec(`open "${url}"`);
  } else {
    exec(`xdg-open "${url}"`);
  }
}

async function grantWithAccessToken(accessToken) {
  const apiUrl = `https://analyticsadmin.googleapis.com/v1alpha/properties/${propertyId}/accessBindings`;
  const body = {
    user: serviceAccountEmail,
    roles: ["predefinedRoles/viewer"],
  };

  const apiRes = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const raw = await apiRes.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    console.error("\n❌ Resposta inesperada:", raw.slice(0, 300));
    process.exit(1);
  }

  if (!apiRes.ok) {
    console.error("\n❌ Falhou:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log("\n✅ Acesso concedido com sucesso!\n");
  console.log(JSON.stringify(data, null, 2));
  console.log("\nTesta com: npm run ga4:test\n");
}

if (tokenArg?.startsWith("ya29.")) {
  console.log("\n=== GA4 — Grant com access token ===\n");
  await grantWithAccessToken(tokenArg);
  process.exit(0);
}

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Define GOOGLE_ADS_CLIENT_ID e GOOGLE_ADS_CLIENT_SECRET em .env.local");
  process.exit(1);
}

const authUrl = buildAuthUrl();
const oauth2 = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authHtmlPath = path.join(__dirname, "ga4-oauth-open.html");
fs.writeFileSync(
  authHtmlPath,
  `<!DOCTYPE html><html><head><meta charset="utf-8"><title>GA4 OAuth</title></head><body style="font-family:sans-serif;padding:2rem"><h1>GA4 — Autorizar</h1><p>Clica no botão para abrir o Google OAuth com o URL completo.</p><p><a href="${authUrl}" style="display:inline-block;padding:12px 20px;background:#5cb7f3;color:#fff;text-decoration:none;border-radius:8px">Autorizar Google Analytics</a></p></body></html>`
);

console.log("\n=== GA4 — Dar acesso à Service Account ===\n");
console.log(`Property ID: ${propertyId}`);
console.log(`Service account: ${serviceAccountEmail}\n`);
console.log("Pré-requisitos:");
console.log("  • Analytics Admin API activa: https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com?project=rinu-39803");
console.log("  • Redirect URI no OAuth client: http://127.0.0.1:8080");
console.log("  • jmolina@rinu.pt em Test users (se app em Testing)\n");
console.log("A abrir o browser automaticamente…");
console.log(`Ficheiro backup: ${authHtmlPath}\n`);

openBrowser(authHtmlPath);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", REDIRECT_URI);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h1>Erro OAuth</h1><p>${error}</p>`);
      server.close();
      process.exit(1);
    }

    if (!code) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<p>Aguarda redirect do Google após autorizar…</p>");
      return;
    }

    const { tokens } = await oauth2.getToken(code);
    await grantWithAccessToken(tokens.access_token);

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      "<h1>GA4 OK</h1><p>Service account adicionada. Podes fechar esta janela.</p>"
    );
    server.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end("Erro interno");
    server.close();
    process.exit(1);
  }
});

server.listen(8080, "127.0.0.1", () => {
  console.log(`Servidor OAuth em ${REDIRECT_URI}\n`);
});
