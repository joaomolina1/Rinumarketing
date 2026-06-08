create table agent_settings (
  user_id uuid references auth.users primary key,
  mode text not null default 'plan',
  agents_master_enabled boolean not null default true,
  google_agent_enabled boolean not null default true,
  meta_agent_enabled boolean not null default true,
  analytics_agent_enabled boolean not null default true,
  action_policies jsonb not null default '{}',
  max_budget_increase_per_action_eur numeric not null default 50,
  max_daily_budget_increase_eur numeric not null default 200,
  updated_at timestamptz not null default now()
);

alter table agent_settings enable row level security;

create policy "Utilizador gere as próprias definições de agentes" on agent_settings
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function set_agent_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger agent_settings_updated_at
  before update on agent_settings
  for each row execute function set_agent_settings_updated_at();
