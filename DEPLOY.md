# Deploy RINU Marketing AI

## Quick deploy (3 steps)

### 1. Supabase

**Project:** `tegvtxpwwpbefaqqizyd` → https://tegvtxpwwpbefaqqizyd.supabase.co

**Option A — SQL Editor (easiest, 2 minutes):**
1. Open [SQL Editor](https://supabase.com/dashboard/project/tegvtxpwwpbefaqqizyd/sql/new)
2. Paste and run `supabase/combined_migration.sql`
3. **Authentication → Providers → Email** → disable "Confirm email" (for dev)
4. Admin user already created: `admin@rinu.fun` / `RinuAdmin2026!`

**Option B — CLI (needs database password, NOT the API secret key):**
```bash
export SUPABASE_DB_PASSWORD=your_db_password
bash scripts/apply-migration.sh
```

**About MCP:** You do NOT need MCP. The hosted MCP (`mcp.supabase.com`) requires a browser OAuth login in Cursor that often fails in cloud agents. The secret API key (`sb_secret_...`) is enough for the app — it is NOT the database password.

**API keys** (Project Settings → API):
- `NEXT_PUBLIC_SUPABASE_URL` = `https://tegvtxpwwpbefaqqizyd.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = publishable key (`sb_publishable_...`)
- `SUPABASE_SERVICE_ROLE_KEY` = secret key (`sb_secret_...`) — **required for agents/API routes**

### 2. Vercel

1. Import repo at [vercel.com/new](https://vercel.com/new) → `joaomolina1/Rinumarketing`
2. Framework: **Next.js** (auto-detected)
3. Add environment variables (Settings → Environment Variables):

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes |
| `ANTHROPIC_API_KEY` | Yes (for agents) |
| `NEXTAUTH_URL` | Yes (your Vercel URL) |
| `NEXTAUTH_SECRET` | Yes (`openssl rand -base64 32`) |
| `N8N_API_KEY` | Yes (for API auth from n8n) |
| `GOOGLE_ADS_*` | For Google sync |
| `META_*` | For Meta sync |
| `GA4_PROPERTY_ID` | For analytics |
| `SLACK_BOT_TOKEN` | For alerts |
| `RESEND_API_KEY` | For email reports |

4. Deploy

### 3. n8n workflows

Point HTTP nodes to your Vercel URL:
- `POST /api/data/google/sync`
- `POST /api/data/meta/sync`
- `POST /api/agents/orchestrator`
- `POST /api/reports/generate`

Header: `Authorization: Bearer <N8N_API_KEY>`

## CLI deploy (with tokens)

```bash
export SUPABASE_ACCESS_TOKEN=sbp_...
export SUPABASE_PROJECT_REF=your-project-ref
export VERCEL_TOKEN=...
export NEXT_PUBLIC_SUPABASE_URL=...
export NEXT_PUBLIC_SUPABASE_ANON_KEY=...
export SUPABASE_SERVICE_ROLE_KEY=...
export ANTHROPIC_API_KEY=...
export NEXTAUTH_URL=https://your-app.vercel.app
export NEXTAUTH_SECRET=$(openssl rand -base64 32)
export N8N_API_KEY=$(openssl rand -base64 24)

bash scripts/deploy.sh
```

## GitHub Actions

Add these secrets to the repo for CI deploy:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
