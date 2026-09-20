# Phase 0 production baseline

Captured: 2026-09-09

This document records the production state before work begins on the
authenticated customer portal. It intentionally contains no dashboard tokens,
credentials, email addresses, or participant data.

## Production identifiers

- Git commit: `d4d7a59d4b7162a121037d41d9a22cd39d82e818`
- Canonical customer host: `wobble-account-activate-9i2r.vercel.app`
- Supabase project: `Wobble-App` (`sdjqglvdacvyisbjsfqo`)
- Supabase region: `eu-west-2`
- Supabase plan: Pro
- PostgreSQL version at capture: `17.4.1.043`

## Customer route contracts

These existing route patterns are production contracts and must remain
backwards compatible:

- `/dashboard/[campaign_dashboard_token]`
- `/dashboard/org/[org_dashboard_token]`
- `/api/dashboard`
- `/api/dashboard/org`
- `/activate?campaign_id=...`
- `/api/nhs/validate`
- `/api/nhs/activate`

The private token inventory is stored under `.phase0/`, which is excluded from
Git. At capture time, seven supplied live dashboards and three demonstration
routes returned HTTP 200 and resolved to the expected programme or organisation.

## Existing database contracts

The portal work must not remove, rename, change the type of, or make stricter
any existing column. Initial portal migrations will add new tables and new
functions only.

Important existing tables:

- `user_meta`: canonical app profile fields, including `first_name` and
  `last_name`, keyed by Supabase Auth UUID.
- `user_data`: streak, exercise-date, weekly-minute, and timezone data keyed by
  Auth UUID.
- `workout_log`: individual workout duration and timestamp keyed by Auth UUID.
- `assessments`: sit-to-stand, balance, confidence, and falls outcomes keyed by
  Auth UUID.
- `nhs_campaigns`: annual programme/campaign details, seat limit, seats used,
  access dates, type, and organisation ID.
- `nhs_claims`: programme membership and entitlement status keyed by campaign
  and Auth UUID. Nullable first-name and last-name columns already exist.
- `activation_codes`: optional single-use activation codes.
- `dashboard_orgs`: organisation dashboard records.
- `campaign_dashboard_tokens`: campaign dashboard token records.

At capture time there were 17 campaign records and two grouped dashboard
organisations. All 17 campaigns had active campaign-dashboard token records.

## Existing reporting contracts

Do not alter these functions during initial portal development:

- `get_campaign_stats(p_campaign_id text)`
- `get_org_stats(p_org_id text)`
- `get_stats_for_campaigns(p_ids text[], p_name text, p_service text)`

The existing token APIs call these functions using the server-side service
role. New authenticated portal reporting should use separately named functions
and APIs.

## Existing activation contract

Production Edge Function:

- Slug: `nhs-activate`
- Version: 8
- Source hash:
  `2097e035c28eb44d12699f05b9366666c37a65c14ae739b6e2bf7911474effd5`

Current behaviour:

1. Validate the supplied Supabase access token with `auth.getUser`.
2. Validate the campaign and its access dates.
3. Check for an existing claim.
4. Optionally redeem an activation code.
5. Check the campaign seat limit.
6. Create or update an `nhs_claims` record.
7. Increment `nhs_campaigns.seats_used`.
8. Grant the configured RevenueCat promotional entitlement.
9. Mark the claim active, or leave it pending if RevenueCat fails.

The invitation flow must initially use a new activation path. It must not
replace or modify this production function until the new path is independently
tested.

## Known baseline risks

These are existing findings, not regressions introduced by portal work:

1. Seven Vercel projects currently deploy this repository and serve the app.
   The `9i2r` project is the customer-facing project. Duplicate-project cleanup
   is separate work and must not delete or rename `9i2r`.
2. The three reporting functions above are `SECURITY DEFINER`. Practice now
   restricts `EXECUTE` to `service_role` only
   (`supabase/migrations/20260920140000_restrict_stats_function_grants.sql`).
   Apply the same migration on live before treating this as closed.
3. The current activation function checks and increments `seats_used` in
   separate operations. The new invitation flow must use an atomic reservation
   mechanism to prevent concurrent oversubscription.
4. Supabase leaked-password protection is disabled. Portal administrators will
   use magic-link authentication initially; MFA remains recommended for Wobble
   administrators and Premium-data access.
5. Supabase reports that the PostgreSQL release has security updates available.
   Any upgrade must be scheduled and tested separately from portal development.
6. The repository migration history covers dashboard changes but does not
   recreate the complete application schema. A complete schema baseline is
   required before a representative Supabase branch can be created.

## Rollback baseline

Application rollback point:

`d4d7a59d4b7162a121037d41d9a22cd39d82e818`

Canonical Vercel deployment at capture:

`https://wobble-account-activate-9i2r-1jfr9aipz-ruaridh-aitkens-projects.vercel.app`

Phase 0 makes no production database, Supabase Auth, Edge Function, RevenueCat,
DNS, Vercel-project, or customer-route changes.

## Exit criteria

Phase 0 is complete when:

- The private customer-link inventory exists outside Git tracking.
- Every supplied customer and demonstration route has been checked.
- Existing table, function, activation, deployment, and security contracts are
  documented.
- The baseline document contains no secrets or participant data.
- Git confirms that `.phase0/` is ignored.
- The application still passes lint and a production build.
