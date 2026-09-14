# Phase 10 portal app access

Captured: 2026-09-14

Portal invitations now grant Wobble app access through a new path. The
live `nhs-activate` Edge Function, `/activate`, and `/api/nhs/activate`
were not changed.

## What happens on invite complete

1. The invitation is still locked to the invited email
2. A claim is created as `pending_grant`
3. App access is granted
4. The claim becomes `active` only after that grant succeeds
5. If the grant cannot run, the place stays reserved and the person is
   asked to try the app shortly

## Practice vs live

- Local practice (no RevenueCat keys): the grant is recorded as practice
  and the claim is activated. Live RevenueCat is not called.
- Production needs `RC_API_KEY` and `RC_ENTITLEMENT_ID` on the host. Those
  are the same secrets the existing Edge Function already uses. They are
  not stored in Git.

## Files

- `lib/portal/appAccess.ts`
- `supabase/migrations/20260914140000_portal_app_grants.sql`

The new `portal_app_grants` table is additive. Existing columns were not
changed.
