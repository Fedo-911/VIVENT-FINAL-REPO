create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  hashed_password text not null,
  full_name text not null,
  role text not null check (role in ('admin', 'student', 'business')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name in ('Basic', 'Normal', 'Premium')),
  price numeric not null,
  facilities jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null check (category in ('educational', 'expo', 'food', 'job_fair')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'completed')),
  start_date timestamptz not null,
  end_date timestamptz not null,
  location text not null,
  venue_details jsonb,
  created_by uuid not null references users(id) on delete cascade,
  approved_by uuid references users(id) on delete set null,
  plan_id uuid not null references plans(id),
  max_participants integer not null,
  current_participants integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists event_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  role_at_event text not null,
  registration_date timestamptz not null default timezone('utc', now()),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'completed', 'failed')),
  payment_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, event_id)
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  amount numeric not null,
  status text not null,
  transaction_id text unique not null,
  payment_method text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists discussions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  message text not null,
  sent_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists social_media_ads (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  requested_by uuid not null references users(id) on delete cascade,
  platforms text[] not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists analytics_cache (
  id uuid primary key default gen_random_uuid(),
  metric_name text not null,
  value jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists linked_social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  platform text not null check (platform in ('facebook', 'instagram', 'linkedin', 'twitter')),
  username text not null,
  avatar_url text,
  access_token text not null,
  linked_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, platform)
);

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at before update on users for each row execute procedure set_updated_at();
drop trigger if exists trg_plans_updated_at on plans;
create trigger trg_plans_updated_at before update on plans for each row execute procedure set_updated_at();
drop trigger if exists trg_events_updated_at on events;
create trigger trg_events_updated_at before update on events for each row execute procedure set_updated_at();
drop trigger if exists trg_event_registrations_updated_at on event_registrations;
create trigger trg_event_registrations_updated_at before update on event_registrations for each row execute procedure set_updated_at();
drop trigger if exists trg_payments_updated_at on payments;
create trigger trg_payments_updated_at before update on payments for each row execute procedure set_updated_at();
drop trigger if exists trg_discussions_updated_at on discussions;
create trigger trg_discussions_updated_at before update on discussions for each row execute procedure set_updated_at();
drop trigger if exists trg_social_media_ads_updated_at on social_media_ads;
create trigger trg_social_media_ads_updated_at before update on social_media_ads for each row execute procedure set_updated_at();
drop trigger if exists trg_notifications_updated_at on notifications;
create trigger trg_notifications_updated_at before update on notifications for each row execute procedure set_updated_at();
drop trigger if exists trg_analytics_cache_updated_at on analytics_cache;
create trigger trg_analytics_cache_updated_at before update on analytics_cache for each row execute procedure set_updated_at();
drop trigger if exists trg_linked_social_accounts_updated_at on linked_social_accounts;
create trigger trg_linked_social_accounts_updated_at before update on linked_social_accounts for each row execute procedure set_updated_at();

grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all routines in schema public to service_role;

alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on routines to service_role;
