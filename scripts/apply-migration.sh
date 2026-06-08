#!/usr/bin/env bash
# Run database migration using your Supabase DATABASE PASSWORD (not the API secret key).
# Find it: Supabase Dashboard → Project Settings → Database → Database password
set -euo pipefail

PROJECT_REF="tegvtxpwwpbefaqqizyd"
DB_PASSWORD="${SUPABASE_DB_PASSWORD:?Set SUPABASE_DB_PASSWORD to your database password}"

cd "$(dirname "$0")/.."

echo "Linking project..."
npx supabase link --project-ref "$PROJECT_REF" -p "$DB_PASSWORD" --yes

echo "Pushing migrations..."
npx supabase db push

echo "Done! Tables created."
