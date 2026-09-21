# Data protection guardrails checklist

Controls audit for the named Impact Dashboard in `wobble-nhs-activate`.

Marks: **Present** / **Partial** / **Absent**.

Evidence is file-backed. Unknowns are GAP. This is a technical audit, not legal sign-off. Not previously issued.

**Date of review:** 20 September 2026 (same-day revision so this matches the first DPIA draft).

| Control | Status | Evidence or gap |
| --- | --- | --- |
| Separate unticked consent (not bundled, not pre-ticked) | **Partial** | Separate radios, initial `consentChoice === ""`, not pre-ticked: `app/invite/InviteActivateClient.tsx`. Only on Premium invite path. Draft wording, not a full notice: `docs/phase-9-invite-consent.md`. Legacy `/activate` has no consent: `app/activate/ActivateClient.tsx`, `tests/portal-invite.mjs`. |
| Consent timestamped, version-recorded and logged | **Partial** | `consent_version` `portal-v1`, `consented_at` if yes: `lib/portal/inviteProfile.ts`, table `portal_reporting_consents` in `supabase/migrations/20260910132151_portal_tables.sql`. Audit `portal.licence_activated` with `consented`: `lib/portal/licences.ts`. `consented_at` is null on "no". No later version bump process. |
| Decline still gives full app access | **Present** | Copy and docs: `app/invite/InviteActivateClient.tsx`, `docs/phase-9-invite-consent.md`. Code: `grantAppAccess` does not depend on the consent boolean (`lib/portal/licences.ts`, `lib/portal/appAccess.ts`). |
| Withdrawal supported and removes named data from service view | **Partial** | Hide rule: `lib/portal/participantVisibility.ts`. Patient API `GET`/`POST /api/app/reporting-consent` sets `withdrawn_at` (`lib/portal/inviteProfile.ts` `setReportingConsent`, `lib/portal/patientConsent.ts`). App Settings toggle is not in this repo. After access ends: email `enquiries@wobblebalance.com`. |
| Per-service access isolation | **Partial** | `hasOrgAccess` + `getProgrammeForOrg`: `lib/portal/access.ts`, `lib/portal/membership.ts`, `lib/portal/programmes.ts`. **But** all reads use service role (`lib/supabaseServer.ts`). RLS on with no policies (`supabase/migrations/20260910132151_portal_tables.sql`). Wobble desk lists all orgs (`lib/portal/wobbleAdmin.ts`). |
| Role-based access | **Partial** | Roles `wobble_admin`, `customer_admin`, `viewer` (`portal_org_members`). Viewers are Overview-only. Administrators need TOTP (`aal2`) for Participants, Licences, Account, and the Wobble desk (`lib/portal/mfa.ts`, `lib/portal/access.ts`). RLS policies are still absent. |
| Audit logging of dashboard views | **Partial** | Named Participants views write `portal.participants_viewed` with `actor_user_id`, `org_id`, and `campaign_id` (`lib/portal/participants.ts`, `app/api/portal/participants/route.ts`, participants page). Overview views are not logged. |
| Field-level data minimisation | **Partial** | Named JSON: names, hashed id, minutes, sessions, last session, four outcomes (`lib/portal/participants.ts`, `app/portal/ParticipantList.tsx`). Overview strips identity keys (`lib/portal/overview.ts`). Decline omits claim names (`claimNameFields` in `lib/portal/inviteProfile.ts`). Still stored or shown: invite emails. |
| Encryption in transit and at rest | **Partial** (transit assumed) / **GAP** (at rest) | Live site is HTTPS on Vercel. No TLS/HSTS in `next.config.ts`. At-rest encryption not configured in this repo. |
| UK/EEA-only storage | **Partial** | Database: `eu-west-2` in `docs/phase-0-production-baseline.md`. Resend `api.resend.com` and RevenueCat `api.revenuecat.com` (`lib/portal/inviteEmail.ts`, `lib/portal/appAccess.ts`): location GAP. Vercel region GAP. |
| Retention and deletion at contract end | **Absent** | Invite 14-day expiry and claim `expires_at` only. No contract-end or erasure implementation. Backup handling GAP. |
| No individual clinical risk-scoring in the UI | **Partial** | No "at risk" tag or decline sort (`lib/portal/participants.ts` name sort). **Does** colour-code improvement versus worsening and "N of 4 improving", including falls (`lib/portal/participantView.ts`, `app/portal/ParticipantList.tsx`). Treat as display of change, not a documented risk model. Clinical safety still to confirm. |

## Extra findings (not in the requested table)

| Item | Status | Evidence |
| --- | --- | --- |
| Invitation tokens hashed at rest | **Present** | `lib/portal/inviteToken.ts`; comment in `supabase/migrations/20260910132151_portal_tables.sql` |
| Small-number suppression on Overview | **Present** | `app/portal/PortalOverview.tsx` `suppressed` / enrolled count |
| MFA for Premium staff | **Partial** | TOTP after magic link for `customer_admin` / `wobble_admin`. Viewers skip. Wobble desk can reset a lost app (`app/portal/mfa`, `app/api/portal/admin/mfa-reset`). Live staff must enroll after deploy. |
| Stats RPCs not callable with the public key | **Present** | `EXECUTE` on `get_campaign_stats`, `get_org_stats`, `get_stats_for_campaigns` is `service_role` only on practice and live Wobble-App (`supabase/migrations/20260920140000_restrict_stats_function_grants.sql`). Token dashboards still use the server key. |
| Patient app and Edge Function in this evidence set | **GAP** | Not in this repository; `nhs-activate` invoked only (`app/api/nhs/activate/route.ts`) |

See `docs/DPIA.md` for the ICO-structured assessment, risk table, and sign-off checklist.
