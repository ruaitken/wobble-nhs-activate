# Phase 11 funded window cap

Captured: 2026-10-01

Portal Overview and Participants count each person's activity only inside
their funded window: `nhs_claims.claimed_at` to `nhs_claims.expires_at`.
Self-funded activity after that date, on the same login, is not shown to the
organisation. The person stays on the programme with their history.

## Rules

- Minutes are stored per week (`2025-44` ISO week keys on live). A week that
  overlaps the window counts in full
- Sessions count only on days inside the window (Europe/London)
- Best streak is recomputed from sessions inside the window
- Assessment baseline is the latest assessment on or before activation,
  otherwise the first one inside the window. Comparison is the latest later
  assessment inside the window
- A new programme next year is a new claim with its own window
- Re-activating an ended place on the same programme returns
  `place_already_used`. Create a new programme instead

## Database

`supabase/migrations/20261001100000_portal_capped_campaign_stats.sql` adds
`get_portal_campaign_stats(text)`, `service_role` only. `get_campaign_stats`,
`get_org_stats` and `get_stats_for_campaigns` are unchanged, so token
dashboards are unchanged.

Apply the migration to live Wobble-App before the code reaches `main`, or
portal Overview will fail to load.
