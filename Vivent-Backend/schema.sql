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
  name text not null unique check (name in ('Basic', 'Standard', 'Premium')),
  price numeric not null,
  facilities jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  plan_id uuid not null references plans(id),
  status text not null default 'active' check (status in ('active', 'cancelled')),
  started_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Migration for databases created before the Standard plan rename.
alter table plans drop constraint if exists plans_name_check;
alter table plans add constraint plans_name_check check (name in ('Basic', 'Standard', 'Premium')) not valid;
update plans set name = 'Standard', price = 8309 where name = 'Normal';
update plans set price = case name when 'Basic' then 5539 when 'Standard' then 8309 when 'Premium' then 13349 else price end;

create unique index if not exists idx_user_subscriptions_one_active
  on user_subscriptions(user_id)
  where status = 'active';

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null check (category in ('educational', 'expo', 'food', 'job_fair')),
  status text not null default 'approved' check (status in ('approved', 'completed')),
  start_date timestamptz not null,
  end_date timestamptz not null,
  location text not null,
  price numeric,
  venue_details jsonb,
  created_by uuid not null references users(id) on delete cascade,
  approved_by uuid references users(id) on delete set null,
  plan_id uuid not null references plans(id),
  max_participants integer not null,
  current_participants integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists pending_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null check (category in ('educational', 'expo', 'food', 'job_fair')),
  status text not null default 'pending' check (status = 'pending'),
  start_date timestamptz not null,
  end_date timestamptz not null,
  location text not null,
  price numeric,
  venue_details jsonb,
  created_by uuid not null references users(id) on delete cascade,
  approved_by uuid references users(id) on delete set null,
  plan_id uuid not null references plans(id),
  max_participants integer not null,
  current_participants integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Ticket prices are first-class event data.  Keep the columns nullable for
-- non-ticketed events, then migrate values previously stored in venue_details.
alter table events add column if not exists price numeric;
alter table pending_events add column if not exists price numeric;
update events
set price = nullif(venue_details ->> 'ticket_price', '')::numeric
where price is null
  and coalesce(venue_details ->> 'ticket_price', '') ~ '^\s*[0-9]+(\.[0-9]+)?\s*$';
update pending_events
set price = nullif(venue_details ->> 'ticket_price', '')::numeric
where price is null
  and coalesce(venue_details ->> 'ticket_price', '') ~ '^\s*[0-9]+(\.[0-9]+)?\s*$';

-- Repair legacy ticket-first catalogue rows that were created without a price.
update events
set price = case title
  when 'Winter Food Carnival' then 500
  when 'Chef''s Table Evening' then 2500
  when 'Spicy Street Food Fest' then 400
  when 'Lahore Culinary Showcase' then 800
  else 500
end
where category in ('food', 'educational') and coalesce(price, 0) <= 0;
update pending_events
set price = case title
  when 'Winter Food Carnival' then 500
  when 'Chef''s Table Evening' then 2500
  when 'Spicy Street Food Fest' then 400
  when 'Lahore Culinary Showcase' then 800
  else 500
end
where category in ('food', 'educational') and coalesce(price, 0) <= 0;

create index if not exists idx_events_status_start_date on events(status, start_date);
create index if not exists idx_events_category_start_date on events(category, start_date);
create index if not exists idx_events_created_by on events(created_by);
create index if not exists idx_pending_events_created_at on pending_events(created_at);
create index if not exists idx_pending_events_created_by on pending_events(created_by);

insert into pending_events (
  id,
  title,
  description,
  category,
  status,
  start_date,
  end_date,
  location,
  venue_details,
  created_by,
  approved_by,
  plan_id,
  max_participants,
  current_participants,
  created_at,
  updated_at
)
select
  id,
  title,
  description,
  category,
  'pending',
  start_date,
  end_date,
  location,
  venue_details,
  created_by,
  null,
  plan_id,
  max_participants,
  current_participants,
  created_at,
  updated_at
from events
where status = 'pending'
on conflict (id) do nothing;

delete from events where status in ('pending', 'rejected');
alter table events alter column status set default 'approved';
alter table events drop constraint if exists events_status_check;
alter table events add constraint events_status_check check (status in ('approved', 'completed'));

create table if not exists event_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  role_at_event text not null,
  registration_date timestamptz not null default timezone('utc', now()),
  registration_status text not null default 'Registered' check (registration_status in ('Registered', 'Cancelled', 'Waitlisted')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'completed', 'failed')),
  payment_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, event_id)
);

alter table event_registrations add column if not exists registration_status text not null default 'Registered';
alter table event_registrations drop constraint if exists event_registrations_registration_status_check;
alter table event_registrations add constraint event_registrations_registration_status_check check (registration_status in ('Registered', 'Cancelled', 'Waitlisted'));

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

-- Kept as ALTER statements so existing deployments receive the notification metadata too.
alter table notifications add column if not exists recipient_role text check (recipient_role in ('student', 'business', 'admin'));
alter table notifications add column if not exists type text not null default 'general';
alter table notifications add column if not exists reference_id uuid;
alter table notifications add column if not exists reference_type text;
create index if not exists idx_notifications_user_created_at on notifications(user_id, created_at desc);
create index if not exists idx_notifications_user_unread on notifications(user_id, is_read) where is_read = false;

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) >= 3 and char_length(name) <= 120),
  email text not null,
  phone text not null check (phone ~ '^\+?[0-9]+$' and char_length(regexp_replace(phone, '\D', '', 'g')) >= 10),
  service text not null check (service in (
    'General Inquiry',
    'Event Registration',
    'Business Partnership',
    'Technical Support',
    'Payment Issue',
    'Event Promotion',
    'Feedback',
    'Other'
  )),
  message text not null check (char_length(message) >= 20 and char_length(message) <= 1000),
  user_id uuid references users(id) on delete set null,
  admin_reply text,
  replied_at timestamptz,
  replied_by uuid references users(id) on delete set null,
  is_replied boolean not null default false,
  status text not null default 'New' check (status in ('New', 'In Progress', 'Replied', 'Closed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Existing installations may already have the contact_messages table.
alter table contact_messages add column if not exists user_id uuid references users(id) on delete set null;
alter table contact_messages add column if not exists admin_reply text;
alter table contact_messages add column if not exists replied_at timestamptz;
alter table contact_messages add column if not exists replied_by uuid references users(id) on delete set null;
alter table contact_messages add column if not exists is_replied boolean not null default false;

create index if not exists idx_contact_messages_created_at on contact_messages(created_at desc);
create index if not exists idx_contact_messages_status on contact_messages(status);
create index if not exists idx_contact_messages_user_created_at on contact_messages(user_id, created_at desc);

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

-- Paid AI social-media automation. All provider credentials stay outside this schema
-- and are kept in environment variables or the automation provider's credential vault.
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references users(id) on delete cascade,
  plan_id uuid not null references plans(id),
  payment_reference text not null unique,
  status text not null default 'scheduled' check (status in ('scheduled', 'active', 'completed', 'paused', 'failed')),
  start_date timestamptz not null,
  end_date timestamptz not null,
  total_posts integer not null check (total_posts > 0),
  remaining_posts integer not null check (remaining_posts >= 0),
  business_profile jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  last_ai_run timestamptz,
  next_scheduled_post timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists campaign_platforms (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'facebook', 'linkedin', 'tiktok')),
  is_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (campaign_id, platform)
);

create table if not exists generated_posts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'facebook', 'linkedin', 'tiktok')),
  caption text not null default '', image_url text,
  status text not null default 'generated' check (status in ('generated', 'approved', 'rejected', 'scheduled', 'publishing', 'published', 'failed', 'retrying')),
  scheduled_at timestamptz, published_at timestamptz, post_url text,
  ai_prompt text, image_prompt text, model_used text, error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists ai_logs (
  id uuid primary key default gen_random_uuid(), campaign_id uuid not null references campaigns(id) on delete cascade,
  action text not null, status text not null default 'info', details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists publishing_logs (
  id uuid primary key default gen_random_uuid(), post_id uuid not null references generated_posts(id) on delete cascade,
  platform text not null, status text not null, provider_response jsonb not null default '{}'::jsonb,
  published_at timestamptz, created_at timestamptz not null default timezone('utc', now())
);

create table if not exists workflow_executions (
  id uuid primary key default gen_random_uuid(), campaign_id uuid not null references campaigns(id) on delete cascade,
  status text not null, started_at timestamptz, completed_at timestamptz, duration_ms integer,
  error_message text, raw_output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists automation_history (
  id uuid primary key default gen_random_uuid(), campaign_id uuid references campaigns(id) on delete cascade,
  event_type text not null, payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists platform_credentials (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references users(id) on delete cascade,
  platform text not null, credential_reference text not null, status text not null default 'connected',
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()),
  unique (business_id, platform)
);

alter table campaign_platforms drop constraint if exists campaign_platforms_platform_check;
alter table campaign_platforms add constraint campaign_platforms_platform_check
  check (platform in ('instagram', 'facebook', 'linkedin', 'tiktok')) not valid;

alter table generated_posts drop constraint if exists generated_posts_platform_check;
alter table generated_posts add constraint generated_posts_platform_check
  check (platform in ('instagram', 'facebook', 'linkedin', 'tiktok')) not valid;

alter table linked_social_accounts drop constraint if exists linked_social_accounts_platform_check;
alter table linked_social_accounts add constraint linked_social_accounts_platform_check
  check (platform in ('facebook', 'instagram', 'linkedin', 'twitter', ' 'tiktok')) not valid;

create table if not exists campaign_preferences (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  campaign_information jsonb not null default '{}'::jsonb,
  content_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (campaign_id)
);

create table if not exists posting_preferences (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (campaign_id)
);

create table if not exists social_accounts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'facebook', 'linkedin', 'tiktok')),
  username text,
  profile_url text,
  page_name text,
  business_account boolean not null default false,
  connection_status text not null default 'metadata_saved',
  token_status text not null default 'not_connected',
  followers integer,
  metadata jsonb not null default '{}'::jsonb,
  last_connected timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (campaign_id, platform)
);

create table if not exists brand_assets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  asset_type text not null,
  file_name text not null,
  file_url text,
  mime_type text,
  size_bytes integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists campaign_logs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_campaigns_business_created on campaigns(business_id, created_at desc);
create index if not exists idx_generated_posts_campaign_created on generated_posts(campaign_id, created_at desc);
create index if not exists idx_ai_logs_campaign_created on ai_logs(campaign_id, created_at desc);
create index if not exists idx_workflow_executions_campaign_created on workflow_executions(campaign_id, created_at desc);
create index if not exists idx_campaign_preferences_campaign on campaign_preferences(campaign_id);
create index if not exists idx_posting_preferences_campaign on posting_preferences(campaign_id);
create index if not exists idx_social_accounts_user on social_accounts(user_id, created_at desc);
create index if not exists idx_brand_assets_campaign on brand_assets(campaign_id, created_at desc);
create index if not exists idx_campaign_logs_campaign_created on campaign_logs(campaign_id, created_at desc);

drop trigger if exists trg_campaigns_updated_at on campaigns;
create trigger trg_campaigns_updated_at before update on campaigns for each row execute procedure set_updated_at();
drop trigger if exists trg_campaign_platforms_updated_at on campaign_platforms;
create trigger trg_campaign_platforms_updated_at before update on campaign_platforms for each row execute procedure set_updated_at();
drop trigger if exists trg_generated_posts_updated_at on generated_posts;
create trigger trg_generated_posts_updated_at before update on generated_posts for each row execute procedure set_updated_at();
drop trigger if exists trg_workflow_executions_updated_at on workflow_executions;
create trigger trg_workflow_executions_updated_at before update on workflow_executions for each row execute procedure set_updated_at();

-- Campaign automation is accessed through FastAPI's service key; direct client
-- access is denied so prompts, publishing history, and credential references do
-- not become public Supabase data.
alter table campaigns enable row level security;
alter table campaign_platforms enable row level security;
alter table generated_posts enable row level security;
alter table ai_logs enable row level security;
alter table publishing_logs enable row level security;
alter table workflow_executions enable row level security;
alter table automation_history enable row level security;
alter table platform_credentials enable row level security;

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at before update on users for each row execute procedure set_updated_at();
drop trigger if exists trg_plans_updated_at on plans;
create trigger trg_plans_updated_at before update on plans for each row execute procedure set_updated_at();
drop trigger if exists trg_user_subscriptions_updated_at on user_subscriptions;
create trigger trg_user_subscriptions_updated_at before update on user_subscriptions for each row execute procedure set_updated_at();
drop trigger if exists trg_events_updated_at on events;
create trigger trg_events_updated_at before update on events for each row execute procedure set_updated_at();
drop trigger if exists trg_pending_events_updated_at on pending_events;
create trigger trg_pending_events_updated_at before update on pending_events for each row execute procedure set_updated_at();
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
drop trigger if exists trg_contact_messages_updated_at on contact_messages;
create trigger trg_contact_messages_updated_at before update on contact_messages for each row execute procedure set_updated_at();
drop trigger if exists trg_analytics_cache_updated_at on analytics_cache;
create trigger trg_analytics_cache_updated_at before update on analytics_cache for each row execute procedure set_updated_at();
drop trigger if exists trg_linked_social_accounts_updated_at on linked_social_accounts;
create trigger trg_linked_social_accounts_updated_at before update on linked_social_accounts for each row execute procedure set_updated_at();

create or replace function current_app_user_role()
returns text as $$
  select role from public.users where id = auth.uid();
$$ language sql stable security definer set search_path = public;

create or replace function current_app_user_is_admin()
returns boolean as $$
  select coalesce(public.current_app_user_role() = 'admin', false);
$$ language sql stable security definer set search_path = public;

create or replace function prevent_user_role_escalation()
returns trigger as $$
begin
  if new.role is distinct from old.role and not public.current_app_user_is_admin() then
    raise exception 'Only administrators can change user roles.';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_users_prevent_role_escalation on users;
create trigger trg_users_prevent_role_escalation
before update of role on users
for each row execute procedure prevent_user_role_escalation();

alter table users enable row level security;
alter table plans enable row level security;
alter table user_subscriptions enable row level security;
alter table events enable row level security;
alter table pending_events enable row level security;
alter table event_registrations enable row level security;
alter table payments enable row level security;
alter table discussions enable row level security;
alter table social_media_ads enable row level security;
alter table notifications enable row level security;
alter table contact_messages enable row level security;
alter table analytics_cache enable row level security;
alter table linked_social_accounts enable row level security;

-- ═══════════════════════════════════════════════════════════════════════
-- GRANTS — public (authenticated) and service-role access
-- ═══════════════════════════════════════════════════════════════════════

grant usage on schema public to authenticated;

-- Read access (existing)
grant select on plans, events to anon, authenticated;
grant select on users to authenticated;
grant select on user_subscriptions, event_registrations, payments, discussions,
               social_media_ads, notifications, contact_messages, linked_social_accounts to authenticated;
grant select on pending_events, analytics_cache to authenticated;

-- Write access — only the tables regular users are allowed to modify.
-- Role assignment is handled exclusively by administrators and is blocked
-- at both the schema level (RegisterRequest/UserUpdate don't expose role)
-- and the trigger level (prevent_user_role_escalation).
grant insert, update on users to authenticated;
grant insert, update, delete on event_registrations to authenticated;
grant insert, update on payments to authenticated;
grant insert, update, delete on discussions to authenticated;
grant insert, update, delete on notifications to authenticated;
grant update, delete on contact_messages to authenticated;
grant insert, update, delete on linked_social_accounts to authenticated;
grant insert, update on user_subscriptions to authenticated;
grant insert, update, delete on social_media_ads to authenticated;

-- service_role bypasses RLS and is used only by the backend with the Supabase
-- service-role key stored in the server environment — never exposed to clients.
grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all routines in schema public to service_role;

alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on routines to service_role;

-- ═══════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY POLICIES
-- ═══════════════════════════════════════════════════════════════════════

-- ── users ──────────────────────────────────────────────────────────────
drop policy if exists users_admin_all on users;
create policy users_admin_all on users
  for all to authenticated
  using (public.current_app_user_is_admin())
  with check (public.current_app_user_is_admin());

drop policy if exists users_self_read on users;
create policy users_self_read on users
  for select to authenticated
  using (id = auth.uid());

drop policy if exists users_self_update on users;
create policy users_self_update on users
  for update to authenticated
  using (id = auth.uid())
  -- role must remain unchanged; the prevent_user_role_escalation trigger
  -- enforces this at the DB level as a second line of defence.
  with check (id = auth.uid() and role = public.current_app_user_role());

-- ── plans ──────────────────────────────────────────────────────────────
drop policy if exists plans_public_active_read on plans;
create policy plans_public_active_read on plans
  for select to anon, authenticated
  using (is_active = true);

drop policy if exists plans_admin_all on plans;
create policy plans_admin_all on plans
  for all to authenticated
  using (public.current_app_user_is_admin())
  with check (public.current_app_user_is_admin());

-- ── user_subscriptions ─────────────────────────────────────────────────
drop policy if exists subscriptions_self_read on user_subscriptions;
create policy subscriptions_self_read on user_subscriptions
  for select to authenticated
  using (user_id = auth.uid() or public.current_app_user_is_admin());

drop policy if exists subscriptions_self_write on user_subscriptions;
create policy subscriptions_self_write on user_subscriptions
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists subscriptions_self_update on user_subscriptions;
create policy subscriptions_self_update on user_subscriptions
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists subscriptions_admin_all on user_subscriptions;
create policy subscriptions_admin_all on user_subscriptions
  for all to authenticated
  using (public.current_app_user_is_admin())
  with check (public.current_app_user_is_admin());

-- ── events ─────────────────────────────────────────────────────────────
drop policy if exists events_public_approved_read on events;
create policy events_public_approved_read on events
  for select to anon, authenticated
  using (status = 'approved');

drop policy if exists events_owner_or_admin_read on events;
create policy events_owner_or_admin_read on events
  for select to authenticated
  using (created_by = auth.uid() or public.current_app_user_is_admin());

drop policy if exists events_admin_all on events;
create policy events_admin_all on events
  for all to authenticated
  using (public.current_app_user_is_admin())
  with check (public.current_app_user_is_admin());

-- ── pending_events ─────────────────────────────────────────────────────
drop policy if exists pending_events_owner_or_admin_read on pending_events;
create policy pending_events_owner_or_admin_read on pending_events
  for select to authenticated
  using (created_by = auth.uid() or public.current_app_user_is_admin());

drop policy if exists pending_events_owner_insert on pending_events;
create policy pending_events_owner_insert on pending_events
  for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists pending_events_owner_update on pending_events;
create policy pending_events_owner_update on pending_events
  for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

drop policy if exists pending_events_owner_delete on pending_events;
create policy pending_events_owner_delete on pending_events
  for delete to authenticated
  using (created_by = auth.uid());

drop policy if exists pending_events_admin_all on pending_events;
create policy pending_events_admin_all on pending_events
  for all to authenticated
  using (public.current_app_user_is_admin())
  with check (public.current_app_user_is_admin());

-- ── event_registrations ────────────────────────────────────────────────
drop policy if exists registrations_self_or_event_owner_read on event_registrations;
create policy registrations_self_or_event_owner_read on event_registrations
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.current_app_user_is_admin()
    or exists (
      select 1 from events
      where events.id = event_registrations.event_id
        and events.created_by = auth.uid()
    )
  );

drop policy if exists registrations_self_write on event_registrations;
create policy registrations_self_write on event_registrations
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists registrations_self_update on event_registrations;
create policy registrations_self_update on event_registrations
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists registrations_self_delete on event_registrations;
create policy registrations_self_delete on event_registrations
  for delete to authenticated
  using (user_id = auth.uid() or public.current_app_user_is_admin());

-- ── payments ───────────────────────────────────────────────────────────
drop policy if exists payments_self_or_event_owner_read on payments;
create policy payments_self_or_event_owner_read on payments
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.current_app_user_is_admin()
    or exists (
      select 1 from events
      where events.id = payments.event_id
        and events.created_by = auth.uid()
    )
  );

drop policy if exists payments_self_insert on payments;
create policy payments_self_insert on payments
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists payments_self_update on payments;
create policy payments_self_update on payments
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── discussions ────────────────────────────────────────────────────────
drop policy if exists discussions_visible_to_participants on discussions;
create policy discussions_visible_to_participants on discussions
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.current_app_user_is_admin()
    or exists (
      select 1 from events
      where events.id = discussions.event_id
        and events.created_by = auth.uid()
    )
    or exists (
      select 1 from event_registrations
      where event_registrations.event_id = discussions.event_id
        and event_registrations.user_id = auth.uid()
    )
  );

drop policy if exists discussions_self_write on discussions;
create policy discussions_self_write on discussions
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists discussions_self_delete on discussions;
create policy discussions_self_delete on discussions
  for delete to authenticated
  using (user_id = auth.uid() or public.current_app_user_is_admin());

-- ── social_media_ads ───────────────────────────────────────────────────
drop policy if exists ads_requester_or_admin_read on social_media_ads;
create policy ads_requester_or_admin_read on social_media_ads
  for select to authenticated
  using (requested_by = auth.uid() or public.current_app_user_is_admin());

drop policy if exists ads_requester_insert on social_media_ads;
create policy ads_requester_insert on social_media_ads
  for insert to authenticated
  with check (requested_by = auth.uid());

drop policy if exists ads_admin_all on social_media_ads;
create policy ads_admin_all on social_media_ads
  for all to authenticated
  using (public.current_app_user_is_admin())
  with check (public.current_app_user_is_admin());

-- ── notifications ──────────────────────────────────────────────────────
drop policy if exists notifications_self_or_admin_read on notifications;
create policy notifications_self_or_admin_read on notifications
  for select to authenticated
  using (user_id = auth.uid() or public.current_app_user_is_admin());

drop policy if exists notifications_self_update on notifications;
create policy notifications_self_update on notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists notifications_admin_insert on notifications;
create policy notifications_admin_insert on notifications
  for insert to authenticated
  with check (public.current_app_user_is_admin());

drop policy if exists contact_messages_admin_read on contact_messages;
create policy contact_messages_admin_read on contact_messages
  for select to authenticated
  using (public.current_app_user_is_admin());

drop policy if exists contact_messages_owner_read on contact_messages;
create policy contact_messages_owner_read on contact_messages
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists contact_messages_admin_update on contact_messages;
create policy contact_messages_admin_update on contact_messages
  for update to authenticated
  using (public.current_app_user_is_admin())
  with check (public.current_app_user_is_admin());

drop policy if exists contact_messages_admin_delete on contact_messages;
create policy contact_messages_admin_delete on contact_messages
  for delete to authenticated
  using (public.current_app_user_is_admin());

-- ── analytics_cache ────────────────────────────────────────────────────
-- Regular users must never read or write analytics data.
drop policy if exists analytics_admin_read on analytics_cache;
create policy analytics_admin_read on analytics_cache
  for select to authenticated
  using (public.current_app_user_is_admin());

drop policy if exists analytics_admin_write on analytics_cache;
create policy analytics_admin_write on analytics_cache
  for all to authenticated
  using (public.current_app_user_is_admin())
  with check (public.current_app_user_is_admin());

-- ── linked_social_accounts ─────────────────────────────────────────────
drop policy if exists linked_social_accounts_self_or_admin_read on linked_social_accounts;
create policy linked_social_accounts_self_or_admin_read on linked_social_accounts
  for select to authenticated
  using (user_id = auth.uid() or public.current_app_user_is_admin());

drop policy if exists linked_social_accounts_self_write on linked_social_accounts;
create policy linked_social_accounts_self_write on linked_social_accounts
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists linked_social_accounts_self_update on linked_social_accounts;
create policy linked_social_accounts_self_update on linked_social_accounts
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists linked_social_accounts_self_delete on linked_social_accounts;
create policy linked_social_accounts_self_delete on linked_social_accounts
  for delete to authenticated
  using (user_id = auth.uid() or public.current_app_user_is_admin());
