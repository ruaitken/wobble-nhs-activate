# Phase 5 portal overview

Captured: 2026-09-10

The portal Overview tab now uses the same anonymised campaign totals as
the shareable dashboards. The existing token APIs were not changed.

## How it works

- `/api/portal/overview?org_id=&campaign_id=` requires a signed-in org member
- It calls `get_campaign_stats` for that campaign only
- Historical programmes remain readable
- Another organisation's campaign returns 403
- The payload is rejected if it ever contains names, emails, or user ids

Practice Falls 2026 now has 12 fictional members, so Overview shows the
same anonymised totals as a public dashboard. NN4 Practice 2026 still has
only 4 members and stays on the privacy holding message. Seed with
`npm run seed:practice-participants`.

Account management (inviting other admins and viewers) is not in this
phase.
