-- Preferências do assistente Geninu
create table geninu_settings (
  user_id uuid references auth.users primary key,
  mode text not null default 'plan' check (mode in ('plan', 'execute', 'auto')),
  model text not null default 'claude-sonnet-4-20250514',
  updated_at timestamptz not null default now()
);

create table geninu_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index on geninu_messages(user_id, created_at desc);

alter table geninu_settings enable row level security;
alter table geninu_messages enable row level security;

create policy "Utilizador gere geninu_settings" on geninu_settings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Utilizador gere geninu_messages" on geninu_messages
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
