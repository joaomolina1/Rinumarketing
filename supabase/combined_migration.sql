-- RINU Marketing AI — Combined migration (run in Supabase SQL Editor)
-- Order: 001 → 004

-- 001_initial_schema.sql
create extension if not exists "uuid-ossp";

create table if not exists profiles (
  id uuid references auth.users primary key,
  email text not null,
  full_name text,
  role text default 'admin',
  created_at timestamptz default now()
);

alter table profiles enable row level security;
drop policy if exists "Utilizador vê o próprio perfil" on profiles;
create policy "Utilizador vê o próprio perfil" on profiles
  for all using (auth.uid() = id);

-- 002_campaigns.sql
create table if not exists google_campaigns (
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
create index if not exists google_campaigns_campaign_date_idx on google_campaigns(campaign_id, date);

create table if not exists meta_campaigns (
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
create index if not exists meta_campaigns_campaign_date_idx on meta_campaigns(campaign_id, date);

create table if not exists daily_kpis (
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

drop policy if exists "Acesso autenticado" on google_campaigns;
drop policy if exists "Acesso autenticado" on meta_campaigns;
drop policy if exists "Acesso autenticado" on daily_kpis;
create policy "Acesso autenticado" on google_campaigns for all to authenticated using (true) with check (true);
create policy "Acesso autenticado" on meta_campaigns for all to authenticated using (true) with check (true);
create policy "Acesso autenticado" on daily_kpis for all to authenticated using (true) with check (true);

-- 003_agent_runs.sql
create table if not exists agent_runs (
  id uuid primary key default uuid_generate_v4(),
  agent_name text not null,
  trigger_type text not null,
  status text not null default 'running',
  input jsonb,
  reasoning text,
  output jsonb,
  error text,
  started_at timestamptz default now(),
  completed_at timestamptz,
  duration_ms integer generated always as (
    extract(milliseconds from (completed_at - started_at))::integer
  ) stored
);

create table if not exists agent_actions (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid references agent_runs(id),
  agent_name text not null,
  action_type text not null,
  platform text not null,
  entity_type text not null,
  entity_id text not null,
  entity_name text,
  current_value jsonb,
  proposed_value jsonb,
  reasoning text not null,
  expected_impact text,
  risk_level text default 'low',
  status text default 'pending',
  approved_by text,
  approved_at timestamptz,
  executed_at timestamptz,
  execution_result jsonb,
  created_at timestamptz default now()
);

create index if not exists agent_runs_name_started_idx on agent_runs(agent_name, started_at desc);
create index if not exists agent_actions_status_created_idx on agent_actions(status, created_at desc);
create index if not exists agent_actions_run_idx on agent_actions(run_id);

alter table agent_runs enable row level security;
alter table agent_actions enable row level security;
drop policy if exists "Acesso autenticado" on agent_runs;
drop policy if exists "Acesso autenticado" on agent_actions;
create policy "Acesso autenticado" on agent_runs for all to authenticated using (true) with check (true);
create policy "Acesso autenticado" on agent_actions for all to authenticated using (true) with check (true);

-- 004_reports.sql
create table if not exists reports (
  id uuid primary key default uuid_generate_v4(),
  week_start date not null,
  week_end date not null,
  title text not null,
  summary text,
  html_content text,
  metrics_snapshot jsonb,
  actions_taken jsonb,
  insights jsonb,
  recommendations jsonb,
  status text default 'draft',
  sent_at timestamptz,
  sent_to text[],
  created_at timestamptz default now()
);

alter table reports enable row level security;
drop policy if exists "Acesso autenticado" on reports;
create policy "Acesso autenticado" on reports for all to authenticated using (true) with check (true);

-- Expose tables to Data API (PostgREST)
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
