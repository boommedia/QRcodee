-- QRcodee.Online — Initial Schema
-- Run in Supabase SQL Editor

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Folders ──────────────────────────────────────────────────
create table if not exists folders (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  color      text not null default '#0891b2',
  created_at timestamptz not null default now()
);

alter table folders enable row level security;

create policy "folders: owner full access"
  on folders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── QR Codes ─────────────────────────────────────────────────
create table if not exists qr_codes (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  folder_id       uuid references folders(id) on delete set null,
  type            text not null default 'url',
  name            text not null,
  destination_url text,
  short_slug      text unique not null,
  is_dynamic      boolean not null default true,
  is_paused       boolean not null default false,
  design_config   jsonb not null default '{}',
  qr_data         jsonb not null default '{}',
  scan_count      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table qr_codes enable row level security;

create policy "qr_codes: owner full access"
  on qr_codes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public read for redirect route (service role bypasses RLS anyway,
-- but this allows anon key reads if ever needed)
create policy "qr_codes: public read by slug"
  on qr_codes for select
  using (true);

create index if not exists qr_codes_user_id_idx   on qr_codes(user_id);
create index if not exists qr_codes_short_slug_idx on qr_codes(short_slug);
create index if not exists qr_codes_folder_id_idx  on qr_codes(folder_id);

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger qr_codes_updated_at
  before update on qr_codes
  for each row execute function set_updated_at();

-- ── Scans ────────────────────────────────────────────────────
create table if not exists scans (
  id         uuid primary key default uuid_generate_v4(),
  qr_id      uuid not null references qr_codes(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  country    text,
  city       text,
  region     text,
  device     text,
  os         text,
  browser    text,
  user_agent text,
  ip_hash    text
);

alter table scans enable row level security;

create policy "scans: owner read"
  on scans for select
  using (
    exists (
      select 1 from qr_codes
      where qr_codes.id = scans.qr_id
        and qr_codes.user_id = auth.uid()
    )
  );

-- Service role inserts scans (bypasses RLS)
create index if not exists scans_qr_id_idx      on scans(qr_id);
create index if not exists scans_scanned_at_idx on scans(scanned_at desc);

-- Denormalized scan_count trigger
create or replace function increment_scan_count()
returns trigger language plpgsql security definer as $$
begin
  update qr_codes set scan_count = scan_count + 1 where id = new.qr_id;
  return new;
end;
$$;

create trigger scans_increment_count
  after insert on scans
  for each row execute function increment_scan_count();

-- ── Subscriptions ─────────────────────────────────────────────
create table if not exists subscriptions (
  id                     uuid primary key default uuid_generate_v4(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  plan                   text not null default 'free',
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  status                 text not null default 'inactive',
  current_period_end     timestamptz,
  trial_end              timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table subscriptions enable row level security;

create policy "subscriptions: owner read"
  on subscriptions for select
  using (auth.uid() = user_id);

create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();

-- ── API Keys ──────────────────────────────────────────────────
create table if not exists api_keys (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  key_hash   text not null unique,
  key_prefix text not null,
  last_used  timestamptz,
  created_at timestamptz not null default now()
);

alter table api_keys enable row level security;

create policy "api_keys: owner full access"
  on api_keys for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Profiles (public user metadata) ──────────────────────────
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  avatar_url text,
  company    text,
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles: owner full access"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile + free subscription on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );

  insert into subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
