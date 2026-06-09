-- Skills / conhecimento que os agentes usam nos prompts
create table agent_skills (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  content text not null default '',
  applies_to text[] not null default array['all']::text[],
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on agent_skills(user_id, enabled);

alter table agent_skills enable row level security;

create policy "Utilizador gere as próprias skills" on agent_skills
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function set_agent_skills_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger agent_skills_updated_at
  before update on agent_skills
  for each row execute function set_agent_skills_updated_at();
