create table integration_settings (
  user_id uuid references auth.users primary key,
  google_ads_client_id text,
  google_ads_client_secret text,
  google_ads_refresh_token text,
  google_ads_developer_token text,
  google_ads_customer_id text,
  ga4_property_id text,
  google_application_credentials_json text,
  meta_app_id text,
  meta_app_secret text,
  meta_access_token text,
  meta_ad_account_id text,
  anthropic_api_key text,
  slack_bot_token text,
  slack_channel_id text,
  resend_api_key text,
  report_recipient_email text,
  n8n_webhook_url text,
  n8n_api_key text,
  onboarding_step integer not null default 0,
  onboarding_completed_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table integration_settings enable row level security;

create policy "Utilizador gere as próprias integrações" on integration_settings
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function set_integration_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger integration_settings_updated_at
  before update on integration_settings
  for each row execute function set_integration_settings_updated_at();
