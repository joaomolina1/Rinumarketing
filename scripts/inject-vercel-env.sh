#!/usr/bin/env bash
# Inject RINU Marketing AI env vars into Vercel
# Usage: VERCEL_TOKEN=xxx bash scripts/inject-vercel-env.sh
set -euo pipefail

cd "$(dirname "$0")/.."

TOKEN="${VERCEL_TOKEN:-}"
if [[ -z "$TOKEN" ]]; then
  echo "ERROR: Set VERCEL_TOKEN (from https://vercel.com/account/tokens)"
  exit 1
fi

ENV_FILE="${ENV_FILE:-rinu-marketing.env}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found"
  exit 1
fi

VERCEL_ARGS=(--token "$TOKEN")

if [[ ! -f .vercel/project.json ]]; then
  echo "Linking Vercel project..."
  npx vercel link --yes "${VERCEL_ARGS[@]}" 2>/dev/null || true
fi

add_env() {
  local name="$1"
  local value="$2"
  for env in production preview development; do
    echo "$value" | npx vercel env add "$name" "$env" "${VERCEL_ARGS[@]}" --force 2>/dev/null || \
    echo "$value" | npx vercel env add "$name" "$env" "${VERCEL_ARGS[@]}"
  done
  echo "  ✓ $name"
}

echo "Injecting environment variables from $ENV_FILE..."

while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" =~ ^# ]] && continue
  name="${line%%=*}"
  value="${line#*=}"
  add_env "$name" "$value"
done < "$ENV_FILE"

DEPLOY_URL="${NEXTAUTH_URL:-}"
if [[ -z "$DEPLOY_URL" ]]; then
  DEPLOY_URL=$(npx vercel ls "${VERCEL_ARGS[@]}" 2>/dev/null | grep -oE 'https://[a-zA-Z0-9.-]+\.vercel\.app' | head -1 || echo "https://rinumarketing.vercel.app")
fi
if ! grep -q "^NEXTAUTH_URL=" "$ENV_FILE"; then
  add_env "NEXTAUTH_URL" "$DEPLOY_URL"
fi

echo ""
echo "Redeploying production..."
npx vercel deploy --prod --yes "${VERCEL_ARGS[@]}"
echo "Done."
