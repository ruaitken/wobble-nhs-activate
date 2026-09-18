# Phase 12 Wobble administrator desk

Captured: 2026-09-14

Wobble administrators can create a customer organisation, its first
programme, and invite the first customer administrator. Live `/activate`
and dashboard token links were not changed.

## Who can use it

Only accounts with the `wobble_admin` role. Customer administrators and
viewers do not see the desk.

Practice: `ruaitken@wobblebalance.com` is the Wobble administrator.

## What it creates

- A `dashboard_orgs` row
- One `nhs_campaigns` programme for that organisation
- A `portal_programme_entitlements` row (Base or Premium)
- A Wobble-admin membership for the person who created it
- A customer-administrator membership and sign-in email for the invited
  address

Existing columns were not renamed or removed. Live `nhs-activate` was not
modified. Campaign dashboard tokens are not created here, so this does not
mint a new public dashboard URL.

## How to try it

1. Sign in on http://127.0.0.1:3001 as `ruaitken@wobblebalance.com`
2. Open **Wobble desk** in the sidebar, or go to `/portal/admin`
3. Create an organisation and invite a customer inbox you control
4. That person requests a sign-in link on this Mac

Click an organisation in the list to open its dashboard (the latest
programme). If that organisation has more than one programme, switch
them with the **Programme** menu in the sidebar.

To renew after a year, stay on Wobble desk and use **Add a programme**.
That adds a new `nhs_campaigns` row for the same organisation. The
previous year stays as a historical programme when its end date passes.

Programme duration and user access both default to 52 weeks (one year).
The minimum for both is 12 weeks. Programme duration writes
`portal_programme_entitlements.ends_at` and `nhs_campaigns.claim_deadline_at`.
User access writes `nhs_campaigns.claim_duration_days`. Existing columns
were not renamed.
