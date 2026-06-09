/**
 * Gera refresh token Google Ads sem OAuth Playground.
 *
 * Pré-requisitos no Google Cloud Console (mesmo projecto do Client ID):
 * 1. APIs & Services → Library → activar "Google Ads API"
 * 2. Credentials → OAuth 2.0 Client (Web application)
 * 3. Authorized redirect URIs → adicionar EXACTAMENTE:
 *    http://127.0.0.1:8080
 *    (alternativa OAuth Playground: https://developers.google.com/oauthplayground — sem barra final)
 * 4. OAuth consent screen → se "Testing", adicionar o teu email como Test user
 *
 * Uso:
 *   node scripts/get-google-ads-refresh-token.mjs
 */

import http from "http";
import { URL } from "url";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { OAuth2Client } from "google-auth-library";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

function loadEnvLocal() {
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
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
const SCOPE = "https://www.googleapis.com/auth/adwords";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Define GOOGLE_ADS_CLIENT_ID e GOOGLE_ADS_CLIENT_SECRET em .env.local");
  process.exit(1);
}

const oauth2 = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: [SCOPE],
});

console.log("\n=== Google Ads — Refresh Token ===\n");
console.log("1. Confirma no Google Cloud que o redirect URI está definido:");
console.log(`   ${REDIRECT_URI}\n`);
console.log("2. Abre este URL no browser (conta com acesso à conta Ads 361-127-0397):\n");
console.log(authUrl);
console.log("\n3. Aguarda… o script vai capturar o código automaticamente.\n");

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", REDIRECT_URI);
    if (url.pathname !== "/" && url.pathname !== "/oauth2callback") {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        `<h1>Erro OAuth: ${error}</h1><p>${url.searchParams.get("error_description") ?? ""}</p>`
      );
      console.error("\nErro OAuth:", error, url.searchParams.get("error_description"));
      server.close();
      process.exit(1);
    }

    if (!code) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>Código em falta</h1>");
      return;
    }

    const { tokens } = await oauth2.getToken(code);

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      "<h1>OK — podes fechar esta janela</h1><p>Volta ao terminal para ver o refresh token.</p>"
    );

    console.log("\n✅ Tokens obtidos:\n");
    if (tokens.refresh_token) {
      console.log("REFRESH TOKEN (guarda isto em .env.local):\n");
      console.log(tokens.refresh_token);
      console.log("\nAdiciona a .env.local:");
      console.log(`GOOGLE_ADS_REFRESH_TOKEN=${tokens.refresh_token}\n`);

      let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
      if (/^GOOGLE_ADS_REFRESH_TOKEN=.*/m.test(env)) {
        env = env.replace(
          /^GOOGLE_ADS_REFRESH_TOKEN=.*/m,
          `GOOGLE_ADS_REFRESH_TOKEN=${tokens.refresh_token}`
        );
      } else {
        env += `\nGOOGLE_ADS_REFRESH_TOKEN=${tokens.refresh_token}\n`;
      }
      fs.writeFileSync(envPath, env);
      console.log("→ Gravado automaticamente em .env.local\n");
    } else {
      console.log("⚠️  Sem refresh_token na resposta.");
      console.log("   Revoga acesso em https://myaccount.google.com/permissions");
      console.log("   e corre o script outra vez (prompt=consent).\n");
      console.log("Access token (temporário):", tokens.access_token?.slice(0, 20) + "...");
    }

    server.close();
    process.exit(0);
  } catch (err) {
    console.error("\nFalha ao trocar código por tokens:", err);
    res.writeHead(500);
    res.end("Erro interno");
    server.close();
    process.exit(1);
  }
});

server.listen(8080, "127.0.0.1", () => {
  console.log("Servidor local em http://127.0.0.1:8080\n");
});

setTimeout(() => {
  console.error("\nTimeout (5 min). Tenta outra vez.");
  server.close();
  process.exit(1);
}, 5 * 60 * 1000);
