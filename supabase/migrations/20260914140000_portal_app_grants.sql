-- Additive table for portal invitation app-access grants.
-- Do not alter existing tables or columns.
-- Applied first to the local practice database only.

create table public.portal_app_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  campaign_id text not null references public.nhs_campaigns (id),
  status text not null,
  mode text not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint portal_app_grants_status_check
    check (status in ('granted', 'pending')),
  constraint portal_app_grants_mode_check
    check (mode in ('live', 'practice', 'unavailable'))
);

create index portal_app_grants_user_campaign_idx
  on public.portal_app_grants (user_id, campaign_id);

alter table public.portal_app_grants enable row level security;

revoke all on table public.portal_app_grants from anon, authenticated;
grant all on table public.portal_app_grants to service_role;

comment on table public.portal_app_grants is
  'Records whether a portal invitation granted Wobble app access. Live grants go through RevenueCat; practice skips the live API.';
