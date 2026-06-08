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
