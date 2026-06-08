#!/usr/bin/env bash
set -euo pipefail

# Run Supabase migrations against a linked project.
# Requires: supabase CLI logged in (supabase login) and project linked (supabase link)

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Set SUPABASE_ACCESS_TOKEN or run: supabase login"
  exit 1
fi

echo "Pushing migrations..."
npx supabase db push

echo "Done. Regenerate types with:"
echo "  npx supabase gen types typescript --linked > types/database.ts"
