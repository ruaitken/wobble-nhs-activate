# Phase 2B portal tables

Captured: 2026-09-10

Portal tables were added to the local Docker practice database only.
Production was not changed.

## Tables added

- `portal_org_members` — organisation staff who can sign in
- `portal_programme_entitlements` — Base or Premium per campaign
- `portal_participant_invitations` — licence invitations, token hashes only, 14-day expiry
- `portal_reporting_consents` — named reporting consent per programme
- `portal_audit_events` — portal administration events

Existing tables and columns were not renamed, removed, or type-changed.
`get_campaign_stats`, `get_org_stats`, and `get_stats_for_campaigns` were not modified.

## Practice seed

- Falls Prevention 2026: Premium, active
- NN4 Practice 2026: Base, active

## Access

Row Level Security is enabled on all five tables, with no policies yet.
`anon` and `authenticated` have no table grants. Only `service_role` can read
or write these tables. That is intentional until portal login exists.

Invitation tokens must be stored as hashes. Raw tokens must not be written to
the database.

## Files

- Reviewed migration: `supabase/migrations/20260910132151_portal_tables.sql`
- Local practice copy: `.phase0/supabase-reference/supabase/migrations/20260910132151_portal_tables.sql`

This migration has not been applied to production.
