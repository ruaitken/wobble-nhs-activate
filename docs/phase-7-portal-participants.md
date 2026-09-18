# Phase 7 portal participants

Captured: 2026-09-10

The Premium Participants tab now matches the deployed example list and
detail view: search, weekly activity, outcomes, and a selected-person
record. Production was not deployed. Existing dashboard token routes and
Overview totals were not changed.

## Rules

- Base programmes do not show the tab, and the API returns `premium_required`
- Only current consent is listed
- Declined or missing consent stays in Overview totals only
- Historical Premium programmes remain readable

## Practice

Falls Prevention 2026 has 8 consented fictional names, 2 declined, and 2
with no consent record. Seed with `npm run seed:practice-participants`.
