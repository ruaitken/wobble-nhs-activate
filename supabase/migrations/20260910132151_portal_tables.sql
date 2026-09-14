-- Additive portal tables for the customer dashboard.
-- Do not alter existing tables or columns.
-- Applied first to the local practice database only.

create table public.portal_org_members (
  id uuid primary key default gen_random_uuid(),
  org_id text not null references public.dashboard_orgs (org_id),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  constraint portal_org_members_role_check
    check (role in ('wobble_admin', 'customer_admin', 'viewer')),
  constraint portal_org_members_org_user_unique unique (org_id, user_id)
);

create table public.portal_programme_entitlements (
  campaign_id text primary key references public.nhs_campaigns (id),
  dashboard_tier text not null default 'base',
  subscription_status text not null default 'active',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_programme_entitlements_tier_check
    check (dashboard_tier in ('base', 'premium')),
  constraint portal_programme_entitlements_status_check
    check (subscription_status in ('trial', 'active', 'suspended', 'cancelled'))
);

create table public.portal_participant_invitations (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null references public.nhs_campaigns (id),
  invited_email text not null,
  token_hash text not null,
  status text not null default 'pending',
  invited_by uuid references auth.users (id),
  sent_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  activated_at timestamptz,
  activated_user_id uuid references auth.users (id),
  constraint portal_participant_invitations_status_check
    check (status in ('pending', 'activated', 'expired', 'cancelled')),
  constraint portal_participant_invitations_email_check
    check (invited_email = lower(invited_email)),
  constraint portal_participant_invitations_token_hash_unique unique (token_hash)
);

create table public.portal_reporting_consents (
  user_id uuid not null references auth.users (id) on delete cascade,
  campaign_id text not null references public.nhs_campaigns (id),
  consented boolean not null,
  consent_version text not null,
  consented_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, campaign_id)
);

create table public.portal_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id),
  org_id text references public.dashboard_orgs (org_id),
  campaign_id text references public.nhs_campaigns (id),
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index portal_participant_invitations_pending_email_idx
  on public.portal_participant_invitations (campaign_id, invited_email)
  where status = 'pending';

create index portal_org_members_user_id_idx
  on public.portal_org_members (user_id);

create index portal_participant_invitations_campaign_id_idx
  on public.portal_participant_invitations (campaign_id);

create index portal_participant_invitations_activated_user_id_idx
  on public.portal_participant_invitations (activated_user_id);

create index portal_reporting_consents_campaign_id_idx
  on public.portal_reporting_consents (campaign_id);

create index portal_audit_events_org_id_idx
  on public.portal_audit_events (org_id);

create index portal_audit_events_campaign_id_idx
  on public.portal_audit_events (campaign_id);

create index portal_audit_events_actor_user_id_idx
  on public.portal_audit_events (actor_user_id);

comment on table public.portal_org_members is
  'Organisation staff who can sign in to the customer portal.';
comment on table public.portal_programme_entitlements is
  'Base or Premium access for one annual programme/campaign.';
comment on table public.portal_participant_invitations is
  'Licence invitations. Store token hashes only, never the raw token.';
comment on table public.portal_reporting_consents is
  'Per-programme consent for named participant reporting.';
comment on table public.portal_audit_events is
  'Portal access and administration events.';

alter table public.portal_org_members enable row level security;
alter table public.portal_programme_entitlements enable row level security;
alter table public.portal_participant_invitations enable row level security;
alter table public.portal_reporting_consents enable row level security;
alter table public.portal_audit_events enable row level security;

-- Default privileges in the captured production schema grant new tables to
-- anon and authenticated. Revoke those grants so only service_role can access
-- these tables until later portal policies are added.
revoke all on table public.portal_org_members from anon, authenticated;
revoke all on table public.portal_programme_entitlements from anon, authenticated;
revoke all on table public.portal_participant_invitations from anon, authenticated;
revoke all on table public.portal_reporting_consents from anon, authenticated;
revoke all on table public.portal_audit_events from anon, authenticated;

grant all on table public.portal_org_members to service_role;
grant all on table public.portal_programme_entitlements to service_role;
grant all on table public.portal_participant_invitations to service_role;
grant all on table public.portal_reporting_consents to service_role;
grant all on table public.portal_audit_events to service_role;
