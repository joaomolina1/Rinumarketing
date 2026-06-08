-- Relatórios semanais gerados
create table reports (
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
create policy "Acesso autenticado" on reports for all using (auth.role() = 'authenticated');
