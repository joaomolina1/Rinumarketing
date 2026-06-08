#!/usr/bin/env bash
# Full deployment script — requires env vars (see DEPLOY.md)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== RINU Marketing AI — Deploy ==="

# 1. Supabase migrations (remote)
if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]] && [[ -n "${SUPABASE_PROJECT_REF:-}" ]]; then
  echo "[1/3] Pushing Supabase migrations..."
  npx supabase link --project-ref "$SUPABASE_PROJECT_REF"
  npx supabase db push
else
  echo "[1/3] SKIP Supabase — set SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF"
  echo "      Or run supabase/combined_migration.sql manually in SQL Editor"
fi

# 2. Vercel deploy
if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  echo "[2/3] Deploying to Vercel..."
  npx vercel deploy --prod --yes --token "$VERCEL_TOKEN"
else
  echo "[2/3] SKIP Vercel — set VERCEL_TOKEN or connect GitHub repo in Vercel dashboard"
fi

# 3. Set Vercel env vars (if both tokens present)
if [[ -n "${VERCEL_TOKEN:-}" ]] && [[ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ]]; then
  echo "[3/3] Setting Vercel environment variables..."
  for var in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY ANTHROPIC_API_KEY N8N_API_KEY NEXTAUTH_URL NEXTAUTH_SECRET; do
    if [[ -n "${!var:-}" ]]; then
      npx vercel env add "$var" production --token "$VERCEL_TOKEN" <<< "${!var}" 2>/dev/null || true
    fi
  done
else
  echo "[3/3] SKIP env vars — configure in Vercel dashboard"
fi

echo "=== Done ==="
