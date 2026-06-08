# RINU Marketing AI

Plataforma de marketing digital com agentes de IA para optimização de campanhas Google Ads e Meta Ads.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Supabase** (Postgres, Auth, RLS)
- **Claude API** (agentes LLM)
- **Tailwind CSS** + shadcn/ui
- **Recharts** (gráficos)
- **n8n** (automação de workflows)

## Setup

1. Copiar variáveis de ambiente:
   ```bash
   cp .env.example .env.local
   ```

2. Preencher credenciais em `.env.local` (Supabase, Anthropic, Google Ads, Meta, GA4, Slack, Resend, n8n).

3. Executar migrations no Supabase:
   ```bash
   # Via Supabase CLI ou dashboard SQL editor
   # Ficheiros em supabase/migrations/
   ```

4. Instalar dependências e arrancar:
   ```bash
   npm install
   npm run dev
   ```

5. Aceder a `http://localhost:3000/login`

## Estrutura

- `/app/dashboard` — Dashboard com KPIs, campanhas, agentes e relatórios
- `/app/api/agents` — API dos agentes (orchestrator, google, meta, analytics)
- `/app/api/data` — Sync de dados (Google, Meta, GA4)
- `/lib/agents` — Lógica dos agentes LLM
- `/lib/integrations` — Clientes das APIs externas
- `/supabase/migrations` — Schema da base de dados

## Workflows n8n

Ver `RINU_MARKETING_AI_PLAN.md` (extraído dos ficheiros zip) para workflows de:
- Ciclo diário de análise (08:00)
- Relatório semanal (segunda 09:00)
- Alertas de anomalia (cada 4h)

## Deploy

Deploy em Vercel com as variáveis de ambiente configuradas. Ligar repositório GitHub para auto-deploy.
