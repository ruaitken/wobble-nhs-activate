-- First sign-in invitations for portal staff, valid for 24 hours.
-- Everyday sign-in links still use Supabase email links (one hour).
-- Additive only. Store token hashes, never the raw token.

create table public.portal_staff_invitations (
  id uuid primary key default gen_random_uuid(),
  org_id text not null references public.dashboard_orgs (org_id),
  user_id uuid not null references auth.users (id) on delete cascade,
  token_hash text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  used_at timestamptz,
  constraint portal_staff_invitations_token_hash_unique unique (token_hash)
);

create index portal_staff_invitations_user_id_idx
  on public.portal_staff_invitations (user_id);

comment on table public.portal_staff_invitations is
  'First sign-in invitations for portal staff. 24 hours, single use. Token hashes only.';

alter table public.portal_staff_invitations enable row level security;
revoke all on table public.portal_staff_invitations from anon, authenticated;
grant all on table public.portal_staff_invitations to service_role;
