-- Execuções dos agentes
create table agent_runs (
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

-- Acções propostas pelos agentes
create table agent_actions (
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

create index on agent_runs(agent_name, started_at desc);
create index on agent_actions(status, created_at desc);
create index on agent_actions(run_id);

alter table agent_runs enable row level security;
alter table agent_actions enable row level security;
create policy "Acesso autenticado" on agent_runs for all using (auth.role() = 'authenticated');
create policy "Acesso autenticado" on agent_actions for all using (auth.role() = 'authenticated');
