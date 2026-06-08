# RINU Marketing AI — Plano Completo para Cursor

> Stack: Next.js 15 (App Router) · Supabase · Vercel · Claude API · n8n (orquestração)

---

## 1. CREDENCIAIS E CHAVES NECESSÁRIAS

### 1.1 Dar ao Cursor no início da sessão (via MCP ou .env)

| Chave | Onde obter | Para quê |
|-------|-----------|---------|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | LLM para todos os agentes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Base de dados + auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | Operações server-side sem RLS |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | Client-side auth |
| `GOOGLE_ADS_CLIENT_ID` | console.cloud.google.com → OAuth 2.0 | Google Ads API |
| `GOOGLE_ADS_CLIENT_SECRET` | console.cloud.google.com → OAuth 2.0 | Google Ads API |
| `GOOGLE_ADS_REFRESH_TOKEN` | OAuth flow (google-ads-api npm) | Google Ads API |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | ads.google.com/nav/selectaccount → API Center | Acesso à API |
| `GOOGLE_ADS_CUSTOMER_ID` | ID da conta Google Ads (sem hífens) | Target da conta |
| `META_APP_ID` | developers.facebook.com → My Apps | Meta Marketing API |
| `META_APP_SECRET` | developers.facebook.com → My Apps → Settings | Meta Marketing API |
| `META_ACCESS_TOKEN` | Graph API Explorer → token longa duração | Meta Marketing API |
| `META_AD_ACCOUNT_ID` | act_XXXXXXXXX (Business Manager) | Target da conta |
| `GA4_PROPERTY_ID` | GA4 → Admin → Property Settings | Google Analytics Data API |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | GCP → Service Account → JSON key (base64) | GA4 + Sheets API |
| `N8N_WEBHOOK_URL` | n8n → Webhook node URL | Trigger de workflows |
| `N8N_API_KEY` | n8n → Settings → API | Acionar workflows via API |
| `RESEND_API_KEY` | resend.com → API Keys | Envio de email reports |
| `SLACK_BOT_TOKEN` | api.slack.com → Bot Token | Alertas Slack |
| `SLACK_CHANNEL_ID` | Canal do Slack para alertas | Alertas Slack |

### 1.2 MCP Servers para dar ao Cursor

```json
// .cursor/mcp.json (na raiz do projecto)
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest",
               "--supabase-url", "TUA_SUPABASE_URL",
               "--supabase-service-role-key", "TUA_SERVICE_ROLE_KEY"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

> **Nota**: O MCP do Supabase permite ao Cursor ler o schema, criar tabelas e escrever migrations directamente. O sequential-thinking ajuda no planeamento de tasks complexas.

---

## 2. ESTRUTURA DE FICHEIROS COMPLETA

```
rinu-marketing-ai/
├── .cursor/
│   └── mcp.json                          # MCPs activos no Cursor
├── .cursorrules                           # Regras para o Cursor (ver secção 3)
├── .env.local                             # Todas as chaves (não commitar)
├── .env.example                           # Template sem valores reais
│
├── app/                                   # Next.js App Router
│   ├── layout.tsx                         # Root layout + providers
│   ├── page.tsx                           # Dashboard principal (redirect se não autenticado)
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx                 # Login com Supabase Auth
│   │   └── callback/route.ts              # OAuth callback handler
│   │
│   ├── dashboard/
│   │   ├── page.tsx                       # Overview: KPIs consolidados Google + Meta
│   │   ├── layout.tsx                     # Sidebar + topbar
│   │   │
│   │   ├── google/
│   │   │   ├── page.tsx                   # Campanhas Google Ads
│   │   │   ├── campaigns/[id]/page.tsx    # Detalhe de campanha
│   │   │   └── keywords/page.tsx          # Análise de keywords
│   │   │
│   │   ├── meta/
│   │   │   ├── page.tsx                   # Campanhas Meta Ads
│   │   │   ├── campaigns/[id]/page.tsx    # Detalhe de campanha
│   │   │   └── creatives/page.tsx         # Creative fatigue analysis
│   │   │
│   │   ├── analytics/
│   │   │   ├── page.tsx                   # ROAS, atribuição, funil
│   │   │   └── attribution/page.tsx       # Multi-touch attribution
│   │   │
│   │   ├── agents/
│   │   │   ├── page.tsx                   # Centro de controlo dos agentes
│   │   │   ├── runs/page.tsx              # Histórico de execuções
│   │   │   └── actions/page.tsx           # Acções pendentes de aprovação
│   │   │
│   │   └── reports/
│   │       ├── page.tsx                   # Relatórios gerados
│   │       └── [id]/page.tsx              # Relatório individual
│   │
│   └── api/
│       ├── agents/
│       │   ├── orchestrator/route.ts      # POST: inicia ciclo de análise
│       │   ├── google/route.ts            # POST: executa agente Google
│       │   ├── meta/route.ts              # POST: executa agente Meta
│       │   └── analytics/route.ts         # POST: executa agente Analytics
│       │
│       ├── actions/
│       │   ├── approve/route.ts           # POST: aprovar acção proposta
│       │   ├── reject/route.ts            # POST: rejeitar acção proposta
│       │   └── execute/route.ts           # POST: executar acção aprovada
│       │
│       ├── data/
│       │   ├── google/sync/route.ts       # POST: sync dados Google Ads → Supabase
│       │   ├── meta/sync/route.ts         # POST: sync dados Meta → Supabase
│       │   └── ga4/sync/route.ts          # POST: sync GA4 → Supabase
│       │
│       ├── reports/
│       │   ├── generate/route.ts          # POST: gerar relatório semanal
│       │   └── send/route.ts              # POST: enviar relatório por email
│       │
│       └── webhooks/
│           └── n8n/route.ts               # POST: receber triggers do n8n
│
├── components/
│   ├── ui/                                # shadcn/ui components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── PageHeader.tsx
│   │
│   ├── dashboard/
│   │   ├── KpiCard.tsx                    # Card de métrica individual
│   │   ├── KpiGrid.tsx                    # Grid de KPIs
│   │   ├── SpendChart.tsx                 # Gráfico spend ao longo do tempo
│   │   ├── RoasChart.tsx                  # ROAS por canal
│   │   └── PlatformSummary.tsx            # Resumo Google vs Meta
│   │
│   ├── campaigns/
│   │   ├── CampaignTable.tsx              # Tabela de campanhas com sorting
│   │   ├── CampaignRow.tsx                # Linha com status badge + métricas
│   │   └── CampaignFilters.tsx            # Filtros: status, datas, budget
│   │
│   ├── agents/
│   │   ├── AgentStatusCard.tsx            # Estado actual de cada agente
│   │   ├── AgentRunLog.tsx                # Log de raciocínio do agente
│   │   ├── ActionCard.tsx                 # Card de acção pendente aprovação
│   │   └── ActionApproval.tsx             # UI de aprovar/rejeitar + racional
│   │
│   └── reports/
│       ├── ReportCard.tsx                 # Card de relatório gerado
│       └── ReportViewer.tsx               # Visualizador de relatório HTML
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                      # Supabase browser client
│   │   ├── server.ts                      # Supabase server client (SSR)
│   │   └── middleware.ts                  # Auth middleware
│   │
│   ├── agents/
│   │   ├── orchestrator.ts                # Lógica do agente orquestrador
│   │   ├── google-agent.ts                # Agente Google Ads (tools + prompt)
│   │   ├── meta-agent.ts                  # Agente Meta Ads (tools + prompt)
│   │   ├── analytics-agent.ts             # Agente Analytics (tools + prompt)
│   │   └── memory.ts                      # Gestão de memória de decisões
│   │
│   ├── integrations/
│   │   ├── google-ads.ts                  # Cliente Google Ads API
│   │   ├── meta-ads.ts                    # Cliente Meta Marketing API
│   │   └── ga4.ts                         # Cliente Google Analytics Data API
│   │
│   ├── reports/
│   │   ├── generator.ts                   # Gerador de relatório com Claude
│   │   └── email-template.tsx             # Template HTML do relatório
│   │
│   └── utils/
│       ├── formatters.ts                  # Formatação de moeda, %, datas
│       ├── metrics.ts                     # Cálculo de KPIs (ROAS, CPA, CTR)
│       └── anomalies.ts                   # Detecção de anomalias
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql         # Schema base
│   │   ├── 002_campaigns.sql              # Tabelas de campanhas
│   │   ├── 003_agent_runs.sql             # Tabelas de execuções de agentes
│   │   └── 004_reports.sql                # Tabelas de relatórios
│   └── seed.sql                           # Dados de teste
│
└── types/
    ├── google-ads.ts                      # Types da Google Ads API
    ├── meta-ads.ts                        # Types da Meta Marketing API
    ├── agents.ts                          # Types dos agentes e acções
    └── database.ts                        # Types gerados pelo Supabase CLI
```

---

## 3. .CURSORRULES (colar na raiz do projecto)

```
# RINU Marketing AI — Cursor Rules

## Stack
- Next.js 15 App Router (TypeScript strict)
- Supabase (Postgres + Auth + Realtime)
- Tailwind CSS + shadcn/ui
- Claude API (Anthropic SDK) para todos os agentes LLM
- Vercel para deploy

## Convenções obrigatórias

### Arquitectura
- Server Components por defeito; usar "use client" apenas quando necessário (interactividade, hooks)
- API Routes em /app/api — cada route tem schema Zod para validação de input
- Supabase server client em Server Components e API Routes; browser client em Client Components
- Nunca expor SUPABASE_SERVICE_ROLE_KEY no cliente — apenas server-side

### Agentes LLM
- Cada agente vive em /lib/agents/[nome]-agent.ts
- System prompt definido como constante no topo do ficheiro
- Tools definidas como array tipado antes de chamar a API
- Sempre usar streaming (streamText do Vercel AI SDK) para respostas longas
- Guardar cada run em agent_runs table com: agent_name, input, output, actions_proposed, timestamp

### Base de dados
- Todas as queries via Supabase client tipado (nunca SQL raw no frontend)
- RLS activado em todas as tabelas — service role key apenas em API Routes
- Migrations numeradas sequencialmente em /supabase/migrations/
- Após criar tabela: executar `npx supabase gen types typescript` e actualizar /types/database.ts

### Componentes
- Componentes de UI genéricos em /components/ui (shadcn)
- Componentes de domínio em /components/[domínio]/
- Props sempre tipadas com interface explícita
- Loading states com Suspense + skeleton components

### Formatação e estilo
- Paleta: branco/cinzas neutros, accent em #E91E8C (RINU pink) ou #0070B0 (RINU blue)
- Fonte principal: Geist Sans (Next.js default)
- Todas as moedas em EUR com Intl.NumberFormat('pt-PT')
- Datas sempre em PT-PT: dd/MM/yyyy

### Segurança
- Validar todos os inputs com Zod antes de qualquer operação
- Rate limiting em API Routes de agentes (max 10 req/min)
- Nunca logar tokens ou refresh tokens em produção
- Variáveis de ambiente: verificar com z.string().min(1) no arranque

## Ordem de implementação (seguir sempre)
1. Schema Supabase + migrations
2. Types gerados
3. Integrations (Google, Meta, GA4)
4. Agent tools e prompts
5. API Routes
6. Server Components (páginas)
7. Client Components (interactividade)
8. Deploy Vercel

## Não fazer
- Não usar Pages Router — apenas App Router
- Não usar Prisma — apenas Supabase client
- Não instalar bibliotecas de charts pesadas — usar Recharts apenas
- Não commitar .env.local
- Não chamar APIs externas (Google, Meta) directamente do cliente
```

---

## 4. SCHEMA SUPABASE (migrations por ordem)

### 001_initial_schema.sql
```sql
-- Extensões
create extension if not exists "uuid-ossp";

-- Utilizadores (espelha auth.users do Supabase)
create table profiles (
  id uuid references auth.users primary key,
  email text not null,
  full_name text,
  role text default 'admin',
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
create policy "Utilizador vê o próprio perfil" on profiles
  for all using (auth.uid() = id);
```

### 002_campaigns.sql
```sql
-- Snapshot diário de campanhas Google Ads
create table google_campaigns (
  id uuid primary key default uuid_generate_v4(),
  campaign_id text not null,
  campaign_name text not null,
  status text,
  budget_amount_micros bigint,
  impressions bigint,
  clicks bigint,
  cost_micros bigint,
  conversions numeric,
  conversion_value numeric,
  date date not null,
  synced_at timestamptz default now()
);
create index on google_campaigns(campaign_id, date);

-- Snapshot diário de campanhas Meta
create table meta_campaigns (
  id uuid primary key default uuid_generate_v4(),
  campaign_id text not null,
  campaign_name text not null,
  status text,
  daily_budget numeric,
  impressions bigint,
  clicks bigint,
  spend numeric,
  reach bigint,
  frequency numeric,
  conversions bigint,
  conversion_value numeric,
  date date not null,
  synced_at timestamptz default now()
);
create index on meta_campaigns(campaign_id, date);

-- KPIs consolidados diários
create table daily_kpis (
  id uuid primary key default uuid_generate_v4(),
  date date unique not null,
  google_spend numeric default 0,
  google_conversions numeric default 0,
  google_revenue numeric default 0,
  meta_spend numeric default 0,
  meta_conversions numeric default 0,
  meta_revenue numeric default 0,
  total_spend numeric generated always as (google_spend + meta_spend) stored,
  total_revenue numeric generated always as (google_revenue + meta_revenue) stored,
  blended_roas numeric generated always as (
    case when (google_spend + meta_spend) > 0
    then (google_revenue + meta_revenue) / (google_spend + meta_spend)
    else 0 end
  ) stored,
  created_at timestamptz default now()
);

alter table google_campaigns enable row level security;
alter table meta_campaigns enable row level security;
alter table daily_kpis enable row level security;

create policy "Acesso autenticado" on google_campaigns for all using (auth.role() = 'authenticated');
create policy "Acesso autenticado" on meta_campaigns for all using (auth.role() = 'authenticated');
create policy "Acesso autenticado" on daily_kpis for all using (auth.role() = 'authenticated');
```

### 003_agent_runs.sql
```sql
-- Execuções dos agentes
create table agent_runs (
  id uuid primary key default uuid_generate_v4(),
  agent_name text not null, -- 'orchestrator' | 'google' | 'meta' | 'analytics'
  trigger_type text not null, -- 'scheduled' | 'manual' | 'alert'
  status text not null default 'running', -- 'running' | 'completed' | 'failed'
  input jsonb,
  reasoning text, -- raciocínio completo do LLM
  output jsonb,
  error text,
  started_at timestamptz default now(),
  completed_at timestamptz,
  duration_ms integer generated always as (
    extract(milliseconds from (completed_at - started_at))::integer
  ) stored
);

-- Acções propostas pelos agentes
create table agent_actions (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid references agent_runs(id),
  agent_name text not null,
  action_type text not null,
  -- ex: 'adjust_bid' | 'pause_campaign' | 'increase_budget' | 'pause_ad'
  platform text not null, -- 'google' | 'meta'
  entity_type text not null, -- 'campaign' | 'ad_group' | 'keyword' | 'ad'
  entity_id text not null,
  entity_name text,
  current_value jsonb, -- valor actual (bid, budget, status, etc.)
  proposed_value jsonb, -- valor proposto
  reasoning text not null, -- porquê desta acção
  expected_impact text, -- impacto esperado em linguagem simples
  risk_level text default 'low', -- 'low' | 'medium' | 'high'
  status text default 'pending', -- 'pending' | 'approved' | 'rejected' | 'executed' | 'failed'
  approved_by text,
  approved_at timestamptz,
  executed_at timestamptz,
  execution_result jsonb,
  created_at timestamptz default now()
);

create index on agent_runs(agent_name, started_at desc);
create index on agent_actions(status, created_at desc);
create index on agent_actions(run_id);

alter table agent_runs enable row level security;
alter table agent_actions enable row level security;
create policy "Acesso autenticado" on agent_runs for all using (auth.role() = 'authenticated');
create policy "Acesso autenticado" on agent_actions for all using (auth.role() = 'authenticated');
```

### 004_reports.sql
```sql
-- Relatórios semanais gerados
create table reports (
  id uuid primary key default uuid_generate_v4(),
  week_start date not null,
  week_end date not null,
  title text not null,
  summary text,
  html_content text,
  metrics_snapshot jsonb, -- KPIs da semana
  actions_taken jsonb, -- acções executadas no período
  insights jsonb, -- array de insights gerados pelo LLM
  recommendations jsonb, -- próximas prioridades
  status text default 'draft', -- 'draft' | 'sent'
  sent_at timestamptz,
  sent_to text[],
  created_at timestamptz default now()
);

alter table reports enable row level security;
create policy "Acesso autenticado" on reports for all using (auth.role() = 'authenticated');
```

---

## 5. AGENTES — PROMPTS E TOOLS

### Agente Google Ads (`/lib/agents/google-agent.ts`)

**System Prompt:**
```
És o agente especialista em Google Ads da RINU, uma plataforma de aluguer de espaços para eventos em Portugal.

O teu objectivo é analisar o desempenho das campanhas Google Ads e propor acções concretas para melhorar o ROAS.

CONTEXTO DO NEGÓCIO:
- RINU opera em Portugal (Lisboa é o principal mercado)
- Produto: marketplace de espaços para eventos (casamentos, festas, corporativos)
- Ticket médio: €500–€5.000 por reserva
- KPIs alvo: ROAS > 4x, CPA < €80, CTR > 3%

REGRAS DE DECISÃO:
- Se ROAS < 2x há mais de 3 dias → propor redução de bid de 15–20%
- Se CTR < 1% com impressões > 1000 → propor pausa do ad group
- Se Quality Score < 5 → propor revisão do landing page ou ad copy
- Se budget esgota antes das 18h → propor aumento de budget de 20%
- Se keyword tem conversions > 5 e CPA < target → propor aumento de bid de 10%
- Nunca propor alterações > 30% de uma só vez

FORMATO DE OUTPUT:
Devolve sempre JSON com: { analysis: string, actions: Action[], alerts: string[] }
```

**Tools:**
```typescript
const googleAgentTools = [
  {
    name: "get_campaigns_performance",
    description: "Obtém métricas das campanhas Google Ads dos últimos N dias",
    input_schema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Número de dias a analisar (1-90)" },
        campaign_ids: { type: "array", items: { type: "string" }, description: "IDs específicos (opcional)" }
      },
      required: ["days"]
    }
  },
  {
    name: "get_keywords_analysis",
    description: "Analisa keywords por CPC, Quality Score, CTR e conversões",
    input_schema: {
      type: "object",
      properties: {
        campaign_id: { type: "string" },
        min_impressions: { type: "number", default: 100 }
      }
    }
  },
  {
    name: "propose_bid_adjustment",
    description: "Propõe ajuste de bid para keyword ou ad group",
    input_schema: {
      type: "object",
      properties: {
        entity_type: { type: "string", enum: ["keyword", "ad_group"] },
        entity_id: { type: "string" },
        adjustment_percent: { type: "number", minimum: -30, maximum: 30 },
        reasoning: { type: "string" }
      },
      required: ["entity_type", "entity_id", "adjustment_percent", "reasoning"]
    }
  },
  {
    name: "propose_campaign_status_change",
    description: "Propõe pausar ou activar campanha/ad group/keyword",
    input_schema: {
      type: "object",
      properties: {
        entity_type: { type: "string", enum: ["campaign", "ad_group", "keyword"] },
        entity_id: { type: "string" },
        new_status: { type: "string", enum: ["ENABLED", "PAUSED"] },
        reasoning: { type: "string" }
      },
      required: ["entity_type", "entity_id", "new_status", "reasoning"]
    }
  },
  {
    name: "propose_budget_change",
    description: "Propõe alteração de budget diário de campanha",
    input_schema: {
      type: "object",
      properties: {
        campaign_id: { type: "string" },
        current_budget_eur: { type: "number" },
        proposed_budget_eur: { type: "number" },
        reasoning: { type: "string" }
      },
      required: ["campaign_id", "current_budget_eur", "proposed_budget_eur", "reasoning"]
    }
  }
]
```

---

## 6. WORKFLOWS N8N (acionar via webhook)

### Workflow 1: Ciclo diário de análise
```
Trigger: Schedule (todos os dias às 08:00)
→ HTTP Request → /api/data/google/sync
→ HTTP Request → /api/data/meta/sync
→ HTTP Request → /api/data/ga4/sync
→ Wait 2 min (garantir que dados estão no Supabase)
→ HTTP Request → /api/agents/orchestrator (POST { trigger: "scheduled_daily" })
→ IF actions_requiring_approval > 0:
   → Send Slack message com lista de acções pendentes
→ IF alerts.length > 0:
   → Send Email com alertas críticos
```

### Workflow 2: Relatório semanal (segunda-feira 09:00)
```
Trigger: Schedule (toda segunda-feira às 09:00)
→ HTTP Request → /api/reports/generate (POST { period: "last_week" })
→ HTTP Request → /api/reports/send (POST { report_id: "...", recipients: ["joao@rinu.fun"] })
→ Send Slack → "📊 Relatório semanal enviado"
```

### Workflow 3: Alertas de anomalia (a cada 4h)
```
Trigger: Schedule (cada 4 horas)
→ HTTP Request → /api/agents/analytics (POST { mode: "anomaly_check" })
→ IF anomalies.critical > 0:
   → Send Slack URGENTE
   → Send Email imediato
```

---

## 7. VARIÁVEIS DE AMBIENTE (.env.example)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Anthropic (Claude API)
ANTHROPIC_API_KEY=sk-ant-...

# Google Ads API
GOOGLE_ADS_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=GOCSPX-...
GOOGLE_ADS_REFRESH_TOKEN=1//...
GOOGLE_ADS_DEVELOPER_TOKEN=xxxxxxxx
GOOGLE_ADS_CUSTOMER_ID=1234567890

# Google Analytics 4
GA4_PROPERTY_ID=12345678
GOOGLE_APPLICATION_CREDENTIALS_JSON=eyJ... (base64 do service account JSON)

# Meta Marketing API
META_APP_ID=123456789
META_APP_SECRET=abcdef...
META_ACCESS_TOKEN=EAAxxxxx...
META_AD_ACCOUNT_ID=act_123456789

# n8n
N8N_WEBHOOK_URL=https://n8n.exemplo.com/webhook/rinu-marketing
N8N_API_KEY=n8n_api_...

# Email (Resend)
RESEND_API_KEY=re_...
REPORT_RECIPIENT_EMAIL=joao@rinu.fun

# Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_CHANNEL_ID=C0XXXXXXXXX

# App
NEXTAUTH_URL=https://rinu-marketing.vercel.app
NEXTAUTH_SECRET=xxxxx (gerar com: openssl rand -base64 32)
```

---

## 8. ORDEM DE IMPLEMENTAÇÃO NO CURSOR

Seguir exactamente esta sequência — cada fase é independente e testável:

### Fase 1 — Base (3–4 dias)
```
[ ] 1. Criar projecto Next.js: npx create-next-app@latest rinu-marketing-ai --typescript --tailwind --app
[ ] 2. Instalar dependências base: npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk zod
[ ] 3. Instalar UI: npx shadcn@latest init + componentes essenciais
[ ] 4. Criar .cursorrules (copiar secção 3 deste documento)
[ ] 5. Configurar .cursor/mcp.json com Supabase MCP
[ ] 6. Criar projecto Supabase + correr migrations 001–004
[ ] 7. Gerar types: npx supabase gen types typescript > types/database.ts
[ ] 8. Configurar Supabase Auth (email/password)
[ ] 9. Criar /app/(auth)/login + middleware de protecção de rotas
```

### Fase 2 — Integrações de dados (3–4 dias)
```
[ ] 10. /lib/integrations/google-ads.ts — cliente + função getCampaignsPerformance()
[ ] 11. /lib/integrations/meta-ads.ts — cliente + função getCampaignsInsights()
[ ] 12. /lib/integrations/ga4.ts — cliente + função getConversions()
[ ] 13. /app/api/data/google/sync/route.ts — sync diário para Supabase
[ ] 14. /app/api/data/meta/sync/route.ts
[ ] 15. /app/api/data/ga4/sync/route.ts
[ ] 16. Testar syncs manualmente via Postman/curl
```

### Fase 3 — Agentes (4–5 dias)
```
[ ] 17. /lib/agents/google-agent.ts — tools + system prompt + função runGoogleAgent()
[ ] 18. /lib/agents/meta-agent.ts
[ ] 19. /lib/agents/analytics-agent.ts
[ ] 20. /lib/agents/orchestrator.ts — coordena os 3 agentes
[ ] 21. /lib/agents/memory.ts — guardar/recuperar decisões anteriores
[ ] 22. /app/api/agents/* — routes para cada agente
[ ] 23. /app/api/actions/* — approve/reject/execute
```

### Fase 4 — Dashboard (4–5 dias)
```
[ ] 24. /app/dashboard/page.tsx — KPIs consolidados (Server Component)
[ ] 25. /components/dashboard/KpiCard + KpiGrid + SpendChart (Recharts)
[ ] 26. /app/dashboard/google/page.tsx — tabela de campanhas
[ ] 27. /app/dashboard/meta/page.tsx
[ ] 28. /app/dashboard/agents/page.tsx — centro de controlo
[ ] 29. /app/dashboard/agents/actions/page.tsx — aprovação de acções
[ ] 30. /app/dashboard/reports/page.tsx
```

### Fase 5 — Reports e automação (2–3 dias)
```
[ ] 31. /lib/reports/generator.ts — gerador com Claude
[ ] 32. /lib/reports/email-template.tsx — template HTML
[ ] 33. /app/api/reports/generate + send routes
[ ] 34. Configurar workflows n8n (ver secção 6)
[ ] 35. Testar ciclo completo end-to-end
```

### Fase 6 — Deploy (1–2 dias)
```
[ ] 36. Configurar projecto Vercel + variáveis de ambiente
[ ] 37. Ligar repositório GitHub → Vercel (auto-deploy em push)
[ ] 38. Configurar domínio (ex: marketing.rinu.fun)
[ ] 39. Testar em produção + activar workflows n8n
```

---

## 9. PRIMEIROS PROMPTS PARA DAR AO CURSOR

Depois de ter o projecto criado e o .cursorrules no lugar, dar estes prompts em sequência:

**Prompt 1 (Schema):**
> "Cria as migrations Supabase em /supabase/migrations/ conforme a secção 4 do plano. Depois corre `npx supabase gen types typescript --local > types/database.ts`."

**Prompt 2 (Auth):**
> "Implementa autenticação Supabase SSR: login page em /app/(auth)/login/page.tsx, callback em /app/(auth)/callback/route.ts, e middleware em middleware.ts que protege tudo em /dashboard/*."

**Prompt 3 (Google Ads integration):**
> "Cria /lib/integrations/google-ads.ts com o cliente google-ads-api e as funções: getCampaignsPerformance(days), getKeywordsAnalysis(campaignId), adjustBid(entityType, entityId, adjustmentPercent), pauseEntity(entityType, entityId). Usar as env vars GOOGLE_ADS_*."

**Prompt 4 (Agente Google):**
> "Cria /lib/agents/google-agent.ts com o system prompt e tools da secção 5 do plano. A função principal runGoogleAgent() chama a Claude API com as tools, executa os tool calls chamando as funções de /lib/integrations/google-ads.ts, e guarda o resultado em agent_runs. Devolver { analysis, actions_proposed, alerts }."

---

*Documento gerado para: João / RINU Marketing AI*
*Stack: Next.js 15 · Supabase · Vercel · Claude API*
