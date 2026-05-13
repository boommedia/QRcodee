-- Client report share tokens (Agency feature)
create table if not exists client_reports (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  token      text unique not null,
  name       text not null,
  qr_ids     uuid[] not null default '{}',
  branding   jsonb not null default '{}',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table client_reports enable row level security;

create policy "client_reports: owner full access"
  on client_reports for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "client_reports: public read by token"
  on client_reports for select
  using (true);

create index if not exists client_reports_token_idx on client_reports(token);
create index if not exists client_reports_user_id_idx on client_reports(user_id);
