# RINU Marketing AI — Documentação

**Versão:** 0.1.0  
**Data:** Junho 2026  
**Repositório:** https://github.com/joaomolina1/Rinumarketing

---

## 1. Visão geral

O **RINU Marketing AI** é uma plataforma de marketing digital com agentes de inteligência artificial para optimizar campanhas **Google Ads** e **Meta Ads** (Facebook/Instagram). Foi desenvolvida para a RINU — plataforma de aluguer de espaços para eventos em Portugal.

### Objectivos principais

- Consolidar KPIs de Google Ads e Meta Ads num único dashboard
- Analisar campanhas automaticamente com agentes Claude especializados
- Propor acções concretas (ajustar licitações, pausar keywords, alterar budgets)
- Exigir aprovação humana antes de executar acções nas plataformas (modo Planeamento)
- Permitir execução automática dentro de limites configuráveis (modo Automático)
- Gerar relatórios semanais e alertas via Slack

### Princípio de segurança

> **Ligar as chaves das plataformas não executa nada.** Os agentes só correm quando são acionados manualmente ou via agendamento (n8n). Por defeito, a app está em **modo Planeamento** — cada acção espera aprovação em **Aprovações**.

---

## 2. Stack técnica

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn/ui, Recharts, Lucide Icons |
| Fonte | Poppins (design system RINU) |
| Backend | Next.js API Routes (Serverless na Vercel) |
| Base de dados | Supabase (PostgreSQL 15) |
| Autenticação | Supabase Auth (email/password) |
| Agentes IA | Anthropic Claude API |
| Google Ads | google-ads-api |
| Meta Ads | Facebook Graph API v21 |
| Analytics | Google Analytics 4 (BetaAnalyticsDataClient) |
| Notificações | Slack Web API |
| Email | Resend |
| Automação | n8n (webhooks e agendamentos) |
| Deploy | Vercel |

---

## 3. Arquitectura

**Camadas:**

1. **Dashboard (Next.js)** — Overview, Google, Meta, Analytics, Agentes, Controlo
2. **API Routes (/api)** — agents, data/sync, actions, settings, reports
3. **Agentes Claude** — orchestrator, google, meta, analytics
4. **Supabase (Postgres)** — campanhas, KPIs, acções, integration_settings, agent_settings
5. **APIs externas** — Google Ads, Meta Marketing, GA4, Slack, Resend
6. **n8n** — agendamento de sync, orquestrador e relatórios

### Fluxo dos agentes

1. **Trigger** — botão manual no dashboard ou webhook n8n
2. **Orquestrador** — corre agentes Google, Meta e Analytics em paralelo
3. **Análise LLM** — cada agente analisa dados e propõe acções
4. **Síntese** — orquestrador prioriza e resolve conflitos
5. **Guardrails** — avalia cada acção (modo, políticas, tetos de budget)
6. **Persistência** — acções `pending` (aprovação) ou `approved` (auto)
7. **Execução** — modo Automático executa acções aprovadas automaticamente
8. **Notificação** — Slack com resumo e link para Aprovações

---

## 4. Instalação local

### Pré-requisitos

- Node.js 20+
- Conta Supabase
- Chaves API (Anthropic, Google Ads, Meta — conforme necessário)

### Passos

```bash
git clone https://github.com/joaomolina1/Rinumarketing.git
cd Rinumarketing
cp .env.example .env.local
# Preencher .env.local com credenciais reais
npm install
npm run dev
```

Aceder a `http://localhost:3000/login`

### Migrations Supabase

Executar por ordem em `supabase/migrations/`:

| Ficheiro | Conteúdo |
|----------|----------|
| `001_initial_schema.sql` | Perfis de utilizador |
| `002_campaigns.sql` | Campanhas Google/Meta, KPIs diários |
| `003_agent_runs.sql` | Execuções e acções dos agentes |
| `004_reports.sql` | Relatórios semanais |
| `004_integration_settings.sql` | Chaves API por utilizador |
| `005_agent_settings.sql` | Controlo e guardrails dos agentes |

Alternativa: correr `supabase/combined_migration.sql` no SQL Editor.

**Project Supabase:** `tegvtxpwwpbefaqqizyd`  
**URL:** https://tegvtxpwwpbefaqqizyd.supabase.co

---

## 5. Primeiro acesso (Onboarding)

URL: `/onboarding`

No primeiro login, o utilizador é redireccionado para um wizard em 5 passos:

1. **Bem-vindo** — explicação do que é necessário
2. **Google Ads** — Client ID, Secret, Refresh Token, Developer Token, Customer ID + teste de ligação
3. **Meta Ads** — App ID, Secret, Access Token, Ad Account ID + teste
4. **Claude AI** — Anthropic API Key (+ GA4 opcional) + teste
5. **Concluir** — guardar e primeira sincronização

As chaves são guardadas na tabela `integration_settings` (encriptadas em repouso pelo Supabase, mascaradas na UI). Também funcionam variáveis de ambiente no Vercel como fallback.

**Gerir depois:** Dashboard → Integrações (`/dashboard/settings`)

---

## 6. Controlo dos agentes

URL: `/dashboard/agents/settings`

### Modos de operação

| Modo | Comportamento |
|------|---------------|
| **Planeamento** (default) | Todas as acções ficam `pending`. Nada executa sem aprovação manual. |
| **Automático** | Acções permitidas executam dentro dos limites. O resto vai para aprovação. |

### Kill switch

Botão **"Pausar todos os agentes"** — impede qualquer proposta ou execução. O orquestrador termina imediatamente sem acções.

### Agentes por plataforma

Toggles independentes para Google Ads, Meta Ads e Analytics.

### Políticas de acção

Cada tipo de acção pode ser configurado como:

- **Bloquear** — nunca proposta nem executada
- **Pedir aprovação** — vai para Aprovações
- **Automático** — executa em modo Automático (se passar guardrails)

| Acção | Plataforma | Default |
|-------|------------|---------|
| Ajustar licitação | Google | Automático |
| Pausar keyword sem conversões | Google | Automático |
| Pausar campanha/grupo/keyword | Google | Automático |
| Pausar anúncio | Meta | Automático |
| Alterar budget diário | Meta | Pedir aprovação |
| Renovar criativo | Meta | Pedir aprovação |

### Tetos de budget

- **Máximo por acção** (default: €50) — aumentos acima deste valor exigem aprovação
- **Máximo agregado por corrida** (default: €200) — protege contra gastos descontrolados no cartão

---

## 7. Páginas do dashboard

| Rota | Descrição |
|------|-----------|
| `/dashboard` | Overview — KPIs, gráficos de spend e ROAS |
| `/dashboard/google` | Campanhas Google Ads |
| `/dashboard/google/keywords` | Análise de keywords |
| `/dashboard/meta` | Campanhas Meta Ads |
| `/dashboard/meta/creatives` | Análise de criativos e fadiga |
| `/dashboard/analytics` | Analytics cross-canal |
| `/dashboard/analytics/attribution` | Atribuição GA4 |
| `/dashboard/agents` | Estado dos agentes e botão para correr orquestrador |
| `/dashboard/agents/actions` | **Aprovações** — aprovar/rejeitar/executar acções |
| `/dashboard/agents/runs` | Histórico de execuções |
| `/dashboard/agents/settings` | **Controlo** — modo, limites, kill switch |
| `/dashboard/reports` | Relatórios semanais |
| `/dashboard/settings` | **Integrações** — chaves API |
| `/onboarding` | Wizard de configuração inicial |

---

## 8. API Reference

### Autenticação

- **Utilizador:** sessão Supabase (cookie)
- **n8n/automação:** header `Authorization: Bearer <N8N_API_KEY>`

### Agentes

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/agents/orchestrator` | Corre orquestrador completo |
| POST | `/api/agents/google` | Agente Google isolado |
| POST | `/api/agents/meta` | Agente Meta isolado |
| POST | `/api/agents/analytics` | Agente Analytics isolado |

### Sincronização de dados

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/data/google/sync` | Sync campanhas Google → DB |
| POST | `/api/data/meta/sync` | Sync campanhas Meta → DB |
| POST | `/api/data/ga4/sync` | Sync conversões GA4 |

### Acções

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/actions/approve` | Aprovar acção pendente |
| POST | `/api/actions/reject` | Rejeitar acção |
| POST | `/api/actions/execute` | Executar acção aprovada |

### Configurações

| Método | Rota | Descrição |
|--------|------|-----------|
| GET/PUT | `/api/settings/integrations` | Chaves API |
| POST | `/api/settings/integrations/test` | Testar ligação (Google/Meta/Claude/GA4/Slack) |
| GET/PUT | `/api/settings/agent-controls` | Modo, políticas, tetos |

### Relatórios

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/reports/generate` | Gerar relatório semanal |
| POST | `/api/reports/send` | Enviar por email (Resend) |

### Webhooks

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/webhooks/n8n` | Entrada para workflows n8n |

---

## 9. Base de dados

### Tabelas principais

| Tabela | Função |
|--------|--------|
| `profiles` | Perfil do utilizador (espelha auth.users) |
| `google_campaigns` | Snapshot diário campanhas Google |
| `meta_campaigns` | Snapshot diário campanhas Meta |
| `daily_kpis` | KPIs consolidados (spend, revenue, ROAS) |
| `agent_runs` | Log de execuções dos agentes |
| `agent_actions` | Acções propostas/aprovadas/executadas |
| `reports` | Relatórios semanais gerados |
| `integration_settings` | Chaves API por utilizador |
| `agent_settings` | Modo, políticas e limites dos agentes |

### Estados das acções (`agent_actions.status`)

| Estado | Significado |
|--------|-------------|
| `pending` | Aguarda aprovação |
| `approved` | Aprovada, pronta para executar |
| `rejected` | Rejeitada pelo utilizador |
| `executed` | Executada com sucesso nas plataformas |
| `failed` | Falha na execução |

### Row Level Security (RLS)

Todas as tabelas têm RLS activo. `integration_settings` e `agent_settings` são per-user (`auth.uid() = user_id`). As restantes permitem acesso autenticado.

---

## 10. Variáveis de ambiente

### Obrigatórias

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave secreta (agentes e API) |
| `ANTHROPIC_API_KEY` | Claude API para agentes |
| `NEXTAUTH_URL` | URL da app (ex: https://marketing.rinu.fun) |
| `NEXTAUTH_SECRET` | Secret para sessões |
| `N8N_API_KEY` | Token para autenticação n8n |

### Integrações (também configuráveis na UI)

| Variável | Descrição |
|----------|-----------|
| `GOOGLE_ADS_CLIENT_ID` | OAuth Google Ads |
| `GOOGLE_ADS_CLIENT_SECRET` | OAuth secret |
| `GOOGLE_ADS_REFRESH_TOKEN` | Token de refresh |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Developer token |
| `GOOGLE_ADS_CUSTOMER_ID` | ID da conta |
| `META_ACCESS_TOKEN` | Token Meta Marketing API |
| `META_AD_ACCOUNT_ID` | ID da ad account (act_...) |
| `GA4_PROPERTY_ID` | Property ID GA4 |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Service account (base64) |

### Notificações

| Variável | Descrição |
|----------|-----------|
| `SLACK_BOT_TOKEN` | Bot token Slack |
| `SLACK_CHANNEL_ID` | Canal para alertas |
| `RESEND_API_KEY` | API Resend para emails |
| `REPORT_RECIPIENT_EMAIL` | Destinatário relatórios |
| `FROM_EMAIL` | Remetente emails |

---

## 11. Deploy (Vercel)

1. Importar repo `joaomolina1/Rinumarketing` na Vercel
2. Framework: Next.js (auto-detectado)
3. Configurar variáveis de ambiente (ver secção 10)
4. Deploy automático em cada push para `main`

**URL de produção sugerida:** https://marketing.rinu.fun

---

## 12. Workflows n8n

Configurar HTTP nodes apontando para a URL Vercel:

| Workflow | Endpoint | Frequência sugerida |
|----------|----------|---------------------|
| Sync Google + Meta | `POST /api/data/google/sync` + `/api/data/meta/sync` | Diário 07:00 |
| Orquestrador | `POST /api/agents/orchestrator` | Diário 08:00 |
| Relatório semanal | `POST /api/reports/generate` | Segunda 09:00 |
| Alertas | `POST /api/webhooks/n8n` | Cada 4h |

Header obrigatório: `Authorization: Bearer <N8N_API_KEY>`

---

## 13. Design system

A app segue o design system da RINU (web-app):

- **Cor primária:** `#5cb7f3` (azul RINU)
- **Cor secundária:** `#5475f9`
- **Background:** `#f8f9fa`
- **Texto:** `#272b30`
- **Fonte:** Poppins
- **Logo:** SVG RINU oficial

---

## 14. Estrutura de ficheiros

```
Rinumarketing/
├── app/
│   ├── (auth)/login/          # Login
│   ├── onboarding/            # Wizard inicial
│   ├── dashboard/             # Páginas do dashboard
│   └── api/                   # API routes
├── components/
│   ├── agents/                # UI agentes e controlo
│   ├── dashboard/             # KPIs e gráficos
│   ├── layout/                # Sidebar, TopBar
│   ├── onboarding/            # Wizard de integrações
│   └── ui/                    # shadcn/ui
├── lib/
│   ├── agents/                # Orquestrador, agentes, guardrails
│   ├── integrations/          # Google Ads, Meta, GA4
│   ├── settings/              # Integrações e agent settings
│   └── supabase/              # Clientes Supabase
├── supabase/migrations/       # Schema SQL
├── types/                     # TypeScript types
└── docs/                      # Documentação
```

---

## 15. Suporte e contacto

- **Repositório:** https://github.com/joaomolina1/Rinumarketing
- **Supabase Dashboard:** https://supabase.com/dashboard/project/tegvtxpwwpbefaqqizyd
- **Email RINU:** joao@rinu.fun

---

*Documentação gerada automaticamente — RINU Marketing AI v0.1.0*
