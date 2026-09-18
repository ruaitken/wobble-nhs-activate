# Phase 4 portal shell

Captured: 2026-09-10

The signed-in portal now has the agreed office layout. Production was not
deployed.

## Layout

- Left: organisation name and programme-period dropdown
- Main: Overview, Participants, Licences
- Account: signed-in email and sign out

Routes:

- `/portal` → current programme for the user’s organisation
- `/portal/{org}/{campaign}` → Overview
- `/portal/{org}/{campaign}/participants` → Premium only
- `/portal/{org}/{campaign}/licences`

## Practice programmes

- Falls Prevention 2026: Premium, current
- NN4 Practice 2026: Base, current
- Falls Prevention 2025: Premium, historical

The latest current programme is selected first. Historical programmes stay
visible and read-only. Licence issuing is blocked for them.

Base programmes do not show the Participants tab, and
`/api/portal/participants` returns `premium_required`.

`/api/portal/licences` returns `archived_programme` for historical periods.

## Safety

Existing `/dashboard` and `/activate` routes are unchanged.
