# Deploy RINU Marketing AI

## Quick deploy (3 steps)

### 1. Supabase

1. Create project at [supabase.com/dashboard](https://supabase.com/dashboard) (EU region recommended)
2. Open **SQL Editor** → paste and run `supabase/combined_migration.sql`
3. Go to **Authentication → Users** → create admin user (email/password)
4. Copy from **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

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
