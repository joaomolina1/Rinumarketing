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
