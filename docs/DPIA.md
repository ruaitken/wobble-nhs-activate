# Data Protection Impact Assessment (DPIA)

**Controller:** Wobble (draft; legal to confirm legal entity).

**Processing in scope:** named, individual patient-level reporting to a commissioning service through the Premium Participants tab of the customer portal in `wobble-nhs-activate`.

**Law:** UK GDPR and the Data Protection Act 2018.

**Document status:** Draft for legal and DPO review. Technical claims are taken from this codebase. Policy and lawful-basis positions are intended, not settled. Do not treat this file as a signed DPIA.

**Out of scope of this repository (flagged as GAP):** the Wobble iOS/Android app, App Store and Play processing, and the live `nhs-activate` Edge Function source (this repository only invokes it).

**Date of technical review:** 20 September 2026.

**Repository reviewed:** `wobble-nhs-activate` (Next.js customer portal, `/activate`, token dashboards, `/invite`, portal APIs).

---

## 1. Describe the processing

### 1.1 Nature

Wobble is a UK B2B2C strength and balance service for older adults and people with neurological conditions. A commissioning organisation (NHS team, council, or similar) buys places. A patient is invited or uses an activation link, creates an Auth account, and uses the app. The app writes activity and assessment data into the same Supabase project. The customer portal lets authorised organisation staff see:

- **Overview:** anonymised cohort statistics (reuses `get_campaign_stats`).
- **Participants (Premium only):** named individual records for patients who opted in to named reporting for that programme.

Declining named reporting must still activate the app place. That person remains in Overview totals only.

### 1.2 Scope

- **Whose data:** patients (end users) enrolled on an `nhs_campaigns` programme; organisation staff who sign in to `/portal`.
- **Geography of this web app's database:** hosted Supabase project `Wobble-App`, region `eu-west-2` (London), documented in `docs/phase-0-production-baseline.md`.
- **Volume:** GAP. This repository does not encode live patient counts. Phase 0 recorded 17 campaigns and two grouped organisations at capture (`docs/phase-0-production-baseline.md`).
- **Special category data:** yes. Assessment scores, falls counts, and engagement/usage data are health-related. Named reporting discloses that data with identity to the commissioning service.

### 1.3 Context and purpose

**Intended purpose (product, for legal review):** so a commissioning service can see how consented individuals are using Wobble and how paired assessment scores have changed, without turning the product into a clinical decision-support system.

**Not found in this repo:** a documented purpose limitation statement, DPIA sign-off, or NHS DSPT mapping.

Consent wording on the invitation page is explicitly a draft, not legally reviewed (`docs/phase-9-invite-consent.md`).

### 1.4 Text data-flow diagram

```text
Commissioning staff (browser)
  -> HTTPS Vercel app (wobble-account-activate-9i2r)
  -> /portal/login (magic link) OR existing /dashboard/{token} (no login)
  -> /api/portal/* using SUPABASE_SERVICE_ROLE_KEY
  -> Postgres: membership check, then campaign-scoped reads

Patient invitation (Premium path)
  Staff enters email on Licences
  -> portal_participant_invitations (email + token hash)
  -> Resend email with raw /invite/{token} link
  -> Patient sets password, name, yes/no named reporting
  -> Auth user + nhs_claims + optional portal_reporting_consents
  -> grantAppAccess -> RevenueCat promotional entitlement `access`
  -> Patient uses mobile app (NOT in this repo)
  -> App writes user_meta, user_data, assessments (tables documented here)

Named dashboard read
  GET /api/portal/participants?org_id=&campaign_id=
  -> requireProgrammeAccess (must be member of that org; campaign must belong to org)
  -> Premium only
  -> Filter nhs_claims users with consented=true and withdrawn_at null
  -> Return names, hashed display id, minutes, sessions, last session, assessment change
```

### 1.5 Data types (from this codebase)

#### A. Patient personal data captured or stored by this web app

| Field | Where written or shown | Evidence |
| --- | --- | --- |
| Email | Auth user; invitation `invited_email`; licence list to staff | `lib/portal/licences.ts` insert into `portal_participant_invitations`; `app/invite/InviteActivateClient.tsx` sign-up with invited email |
| Password | Supabase Auth (hashed by Auth, not stored by app code) | `app/invite/InviteActivateClient.tsx` `signUp` / `signInWithPassword` |
| First name, last name | `user_meta` if they type a name; `nhs_claims` names only when named reporting is on | `lib/portal/inviteProfile.ts` `saveProfileNames` / `claimNameFields`; `lib/portal/licences.ts` claim insert |
| Auth UUID | `auth.users.id`, claims, consents, grants | throughout |
| Display id `WOB-` plus 6 hex chars | SHA-256 of UUID, first 6 hex; not the raw UUID in the UI | `lib/portal/participants.ts` `displayParticipantId` |

**Date of birth:** not collected on `/invite` or `/activate` in this repo. Practice seed writes `age_range` on `user_meta` (`scripts/seed-practice-participants.mjs`). Overview cohort "Age of members" comes from `get_campaign_stats` (`app/dashboard/[token]/DashboardClient.tsx` `stats.age`). How production `age_range` is populated by the app: GAP (app not in this repo).

**Device identifiers, IP, crash logs, push tokens:** not processed in this repository. GAP for the mobile app and for Vercel/Supabase platform logs.

**Old `/activate` path:** email and password only. No named-reporting consent. Names are not collected on that page (`app/activate/ActivateClient.tsx`; test `tests/portal-invite.mjs` "existing /activate pages do not collect portal consent"). Activation then calls Edge Function `nhs-activate` (`app/api/nhs/activate/route.ts`).

#### B. Special category / health-related fields this dashboard can show

From `assessments` (only if named-visible):

- `sit_to_stand_count`
- `balance_score`
- `confidence_score`
- `fall_count`
- `assessment_type` (`initial` / `retake`)
- `created_at`

Evidence: `lib/portal/participants.ts` select; `lib/portal/participantView.ts` `assessmentsFromRows`.

From `user_data`:

- `weekly_minutes` (used for this week, total, weekly average)
- `exercise_dates` (sessions per week, last session date)

Evidence: `lib/portal/participants.ts`.

`workout_log` is documented in Phase 0 as existing. This portal participant query does not select it.

No diagnosis or condition field is selected for the Participants UI. Whether the app stores condition data elsewhere: GAP.

#### C. Data model (tables this repo defines or documents)

**Existing (not created by portal migrations; documented in `docs/phase-0-production-baseline.md`):**

- `auth.users`
- `user_meta` (profile, including `first_name`, `last_name`; seed also `age_range`, `gender`)
- `user_data` (weekly minutes, exercise dates, streak, timezone documented)
- `workout_log`
- `assessments`
- `nhs_campaigns`
- `nhs_claims` (campaign + user, status, `expires_at`, names)
- `activation_codes`
- `dashboard_orgs`
- `campaign_dashboard_tokens`

**Added by portal migrations:**

- `portal_org_members` (org staff, role `wobble_admin` / `customer_admin` / `viewer`)
- `portal_programme_entitlements` (Base/Premium, subscription status, `starts_at` / `ends_at`)
- `portal_participant_invitations` (email, `token_hash`, 14-day `expires_at`)
- `portal_reporting_consents` (`consented`, `consent_version`, `consented_at`, `withdrawn_at`)
- `portal_audit_events`
- `portal_app_grants`

Evidence: `supabase/migrations/20260910132151_portal_tables.sql`, `supabase/migrations/20260914140000_portal_app_grants.sql`.

### 1.6 Storage and location

| Dataset | Store | Region in this repo |
| --- | --- | --- |
| All tables above | Hosted Supabase Postgres | `eu-west-2` in `docs/phase-0-production-baseline.md` |
| Auth | Hosted Supabase Auth | same project |
| Web app | Vercel project `9i2r` | GAP. No Vercel region is set in application code |
| Invite emails | Resend `https://api.resend.com/emails` | GAP. Processor location not in this repo |
| Magic-link emails | Hosted Auth SMTP (configured outside Git) | GAP |
| App entitlement | RevenueCat `https://api.revenuecat.com/v1` | GAP. Processor location not in this repo. Payload is Auth UUID plus entitlement window, not names or scores (`lib/portal/appAccess.ts`) |

**International transfers:** Resend and RevenueCat are called from this app. Legal must confirm SCCs, UK IDTA, and what each processor sees. Vercel edge/runtime location: GAP.

### 1.7 Encryption

**In transit:** production is served on HTTPS Vercel URLs. There is no HSTS or TLS config in `next.config.ts` (file only sets `distDir` and `allowedDevOrigins`). GAP for platform TLS settings (Vercel, Supabase).

**At rest:** no encryption configuration exists in this repository. GAP. Relies on Supabase and Vercel platform defaults. Human must confirm disk encryption and backup encryption with those processors.

### 1.8 Authentication

**Patients (invitation path):** email (locked to invited address) plus password, minimum 8 characters (`app/invite/InviteActivateClient.tsx`). `completeInvitation` rejects `email_mismatch` (`lib/portal/licences.ts`).

**Patients (legacy `/activate`):** email, password, then `nhs-activate` with access token (`app/activate/ActivateClient.tsx`, `app/api/nhs/activate/route.ts`).

**Service / clinician portal users:** passwordless magic link to `/auth/callback` (`lib/portal/magicLink.ts`, `app/api/portal/login/route.ts`). Administrators then complete TOTP (`aal2`) before named lists or the Wobble desk (`lib/portal/mfa.ts`, `app/portal/mfa`). Viewers stay on magic link only. Phase 0 notes leaked-password protection disabled.

**Legacy token dashboards:** whoever has the URL token. No portal login (`app/api/dashboard/route.ts`). Those pages show aggregates, not the named Participants tab.

### 1.9 Access control (tenant isolation)

**Present (application layer):**

- Portal session from Auth JWT (`lib/portal/session.ts`).
- `hasOrgAccess` requires a `portal_org_members` row for that `org_id` (`lib/portal/membership.ts`).
- `requireProgrammeAccess` also requires the campaign to belong to that org via `getProgrammeForOrg` (`lib/portal/access.ts`, `lib/portal/programmes.ts`).
- Middleware `proxy.ts` only protects `/portal` and `/api/portal`.
- Participants API returns 403 `premium_required` if the programme is not Premium (`app/api/portal/participants/route.ts`).
- Overview rejects stats payloads containing `email`, `first_name`, `last_name`, `invited_email`, `user_id` (`lib/portal/overview.ts`).

**Partial:**

- All portal data access uses `SUPABASE_SERVICE_ROLE_KEY` (`lib/supabaseServer.ts`), which bypasses RLS. Isolation is only as good as `requireProgrammeAccess`. RLS is enabled on portal tables with **no policies**; `anon`/`authenticated` grants are revoked (`supabase/migrations/20260910132151_portal_tables.sql`). Comment: intentional until policies are added. Still true in code.
- Viewers are Overview-only. Participants, Licences, and Account APIs return 403 `forbidden_role`; those nav items are hidden (`lib/portal/roles.ts`, `app/api/portal/participants/route.ts`, `app/api/portal/licences/route.ts`, `app/api/portal/account/route.ts`, `app/portal/PortalShell.tsx`). `loadPortalContext` also redirects viewers away from those pages.
- Wobble administrators can list every organisation (`lib/portal/wobbleAdmin.ts` `listWobbleOrganisations`). Opening another org's portal still needs membership in that org (`app/portal/WobbleAdminForm.tsx` `memberOrgIds`).
- Phase 0: `get_campaign_stats` is `SECURITY DEFINER`. Practice revokes `EXECUTE` from `anon` / `authenticated` and leaves `service_role` (`supabase/migrations/20260920140000_restrict_stats_function_grants.sql`). Live still needs that migration.

**Absent:**

- Audit of who opened which named record (see 1.10).
- RLS policies that would enforce org isolation if a user used the anon key.

### 1.10 Audit logging

`portal_audit_events` exists. Actions written in code:

- `portal.magic_link_sent`
- `portal.sign_out`
- `portal.licence_invited`
- `portal.licence_activated` (includes `consented` in `details`)
- `portal.member_invited` / `portal.member_removed`
- `portal.org_created` / `portal.programme_added`

Named Participants views write `portal.participants_viewed` with `actor_user_id`, `org_id`, and `campaign_id` (`lib/portal/participants.ts`, used by `app/api/portal/participants/route.ts` and the participants page). Overview views are not logged.

### 1.11 Consent implementation

**Where captured:** Premium invitation activation only. `ask_consent` is true when `dashboard_tier === "premium"` (`lib/portal/licences.ts`). UI: separate fieldset, two radios, initial state `""` so neither is pre-ticked (`app/invite/InviteActivateClient.tsx`). Server rejects Premium complete without yes/no (`consent_required`).

**Not bundled with password or T&Cs on that form:** separate "Named reporting" fieldset. Full privacy notice / Article 13 text: GAP (wording is a short draft; `docs/phase-9-invite-consent.md` says not legally reviewed).

**Stored:** `portal_reporting_consents`

- `consented` boolean
- `consent_version` constant `portal-v1` (`lib/portal/inviteProfile.ts` `REPORTING_CONSENT_VERSION`)
- `consented_at` set only if `consented` is true; otherwise null
- `withdrawn_at` always set to **null** on save
- `created_at` default now

**Logged:** `portal.licence_activated` details include `consented` (`lib/portal/licences.ts`).

**Decline still grants app access:** yes. `grantAppAccess` runs **before** `saveReportingConsent` and does not branch on the yes/no choice (`lib/portal/licences.ts` around the claim insert, `grantAppAccess`, then consent save). UI copy: "You still get Wobble if you say no." Docs: `docs/phase-9-invite-consent.md`.

**Named view after decline or missing consent:** `isNamedReportingVisible` requires `consented` and no `withdrawn_at` (`lib/portal/participantVisibility.ts`). Hidden people stay in Overview (`countHiddenParticipants`; Participants copy in `app/portal/ParticipantList.tsx`).

**Withdrawal later:** Partial / effectively absent as a product flow. Column `withdrawn_at` exists and the visibility helper honours it. Tests cover a withdrawn timestamp (`tests/portal-participants.mjs`). There is **no** patient or staff API in this repo that sets `withdrawn_at` or lets a patient change their mind. `saveReportingConsent` always writes `withdrawn_at: null`. Re-upserting `consented: false` would hide the name (because `consented` must be true), but nothing calls that after activation.

**Base programmes:** no consent question; Participants tab hidden (`lib/portal/programmeStatus.ts` `show_participants`).

**Legacy `/activate` users:** no `portal_reporting_consents` row, so they never appear named. Intended, not a backfill.

### 1.12 Data minimisation (named UI)

Participants API/UI exposes: first name, last name, display id, minutes this week, total minutes, weekly average, sessions per week, last session date, four outcome metrics with baseline/previous/current and percent change.

It does **not** return email, raw UUID, date of birth, or `workout_log` rows.

**At rest / other staff screens (minimisation gaps):**

- Names are omitted from `nhs_claims` if the patient said no (`claimNameFields` in `lib/portal/inviteProfile.ts`). Name boxes are optional on decline.
- Staff Licences tab sees invited emails (`lib/portal/licences.ts` snapshot).
- Overview still shows cohort age/gender slices from `get_campaign_stats` (aggregated, with a suppress-under-5 members rule in `app/portal/PortalOverview.tsx`).

### 1.13 Third parties / subprocessors (patient-related)

| Party | What this repo sends | Evidence |
| --- | --- | --- |
| Supabase (Auth + Postgres) | All account, claim, consent, health tables | `lib/supabaseServer.ts`, migrations |
| Vercel | HTTP requests, session cookies | deployment of this Next.js app |
| Resend | Invitee email, programme name, activate URL, pack URL | `lib/portal/inviteEmail.ts` |
| RevenueCat | Auth user id, entitlement id, start/end timestamps | `lib/portal/appAccess.ts` |
| Hosted Auth SMTP (configured outside Git) | Magic-link emails to staff (and to invited admins) | `lib/portal/magicLink.ts`; not in app code beyond Auth API |

No Sentry, analytics SDK, or AI/ML call appears in application TypeScript.

Apple and Google are linked as app download URLs only (`lib/portal/inviteEmail.ts`). What those stores process: GAP (outside this repo).

### 1.14 Retention and deletion

| Topic | Finding |
| --- | --- |
| Invitation hold | 14 days then reservation can expire (`portal_participant_invitations.expires_at` default) |
| App access window | `nhs_claims.expires_at` from `claim_duration_days` (desk "user access") |
| Programme live window | entitlements `ends_at` / campaign `claim_deadline_at` |
| Contract end / org offboarding | GAP. No job or route to delete an organisation's patients |
| Account deletion / erasure | GAP. No patient delete-my-data route. Auth `on delete cascade` exists on some portal FKs if a user is deleted in Auth, but nothing in this app performs that deletion |
| Backups | GAP. Not in this repo |

**Intended product position after user access ends (agreed 20 September 2026; legal to confirm):**

- RevenueCat entitlement end **locks the app**. It does **not** delete the person and it does **not** hide them from the named Participants list.
- If named-reporting consent is still on, the commissioning service can still open them as an **individual** after access expires. Their activity also stays in **Overview** totals. That is how the service reviews the year.
- They drop out of the **individual** view only if they **withdraw consent** (future in-app toggle while they still have access, or an exception request to `enquiries@wobblebalance.com` after they can no longer open the app). Overview totals still include them.
- **Erasure** (remove from the database) is a separate rights request to the same inbox, handled case by case. It is not automatic at entitlement end. Anonymised programme totals may be kept so year-end reporting does not break.
- The Participants query today selects all `nhs_claims` for the campaign and does not filter on `expires_at` (`lib/portal/participants.ts`). The intended position matches current code: expiry does not remove the named row.

A published retention clock (when records are later deleted or anonymised) is still GAP.

### 1.15 Risk-flagging / clinical decision support

**What exists:**

- Percent change from baseline and from previous assessment (`percentChange`, `changeLabel` in `lib/portal/participantView.ts`).
- Colour: green "positive" (improvement), coral "negative" (worsening), grey neutral (`changeTone`; badges in `app/portal/ParticipantList.tsx`).
- Copy: "Green indicates improvement".
- Pill: "N of 4 improving" with green / amber / coral by count (`improvingCount`).
- Falls is shown as a count with `direction: "lower"` (fewer falls treated as improvement).

**What does not exist in this portal:**

- Strings such as "at risk", "deterioration", "falls risk score", or a sort-by-decline control. Default sort is last name then first name (`lib/portal/participants.ts`).

**Assessment:** this is individual outcome **display** with improvement/decline colouring. It is not a documented clinical algorithm. Legal and clinical safety should still decide whether colour-coded decline on falls and balance is acceptable for a non-decision-support product.

Demo page `app/dashboard/demo-ggc-participants/GgcParticipantsDashboard.tsx` uses similar UI with **hardcoded** people, not live data.

---

## 2. Necessity and proportionality

### 2.1 Lawful basis (UK GDPR Art. 6) — for legal review

**Intended position for named reporting to the commissioning service:** Art. 6(1)(a) consent, because the product treats named sharing as optional and distinct from getting the app.

**Not settled:** the contract with the organisation, provision of the app itself, and aggregate reporting may rest on Art. 6(1)(b) and/or (f). Legal must map each processing purpose. This DPIA must not treat "consent" as covering all Wobble processing.

### 2.2 Article 9 condition — for legal review

**Intended position for named health data on the Participants tab:** Art. 9(2)(a) explicit consent (yes/no radios, version `portal-v1`).

Whether aggregate-only health statistics for the commissioner instead use 9(2)(h) or 9(2)(i), and whether falls counts are special category in all cases: legal review.

DPA 2018 Schedule 1 condition: GAP (not in code).

### 2.3 Data minimisation

Named UI is close to the field list agreed for the Impact Dashboard. Gaps: staff see emails on Licences; hashed id is still a persistent identifier; service_role can read full tables. Claim names are omitted after "no".

### 2.4 Accuracy

Patients can correct prefilled names at activation (`loadProfileNamesByEmail` then editable fields). No later in-portal name correction flow: GAP. Assessment accuracy depends on the app (not in this repo): GAP.

### 2.5 Retention

Access length is configurable (12–52 weeks, default 52) and is sent to RevenueCat. App lock at that date is not erasure and is not withdrawal of named reporting. Deletion at contract end: GAP. Exception withdrawal or erasure after lock: email `enquiries@wobblebalance.com`.

### 2.6 Processor arrangements

Supabase, Vercel, Resend, RevenueCat. Contracts, UK addenda, and records of processing: GAP (not in Git).

### 2.7 International transfers

Supabase London: UK. Resend, RevenueCat, Vercel: confirm. Flag as a transfer risk until documented.

### 2.8 Individual rights

| Right | In this repo |
| --- | --- |
| Access | No patient SAR/export tool. GAP |
| Withdrawal of named sharing | Schema ready; no user journey. GAP |
| Erasure | No product flow. GAP |
| Object / restrict | Not implemented. GAP |
| Staff can hide a name by setting consent false | No UI |

### 2.9 How consent is obtained and evidenced

- Separate optional radios, not pre-ticked.
- Required choice on Premium before complete.
- Stored with version `portal-v1` and `consented_at` if yes.
- Audit row on activation with the boolean.
- Wording is a **draft** (`docs/phase-9-invite-consent.md`). Legal must replace it with ICO-grade explicit consent text (who sees what, for how long, how to withdraw).

---

## 3. Risks to individuals

Ratings are a technical draft for the DPO, not a residual risk sign-off.

| ID | Risk | Likelihood | Severity | Notes |
| --- | --- | --- | --- | --- |
| R1 | Staff in org A see org B's named patients | Low if membership SQL is correct; higher because service_role bypasses RLS | High | Mitigated in app by `requireProgrammeAccess`. No RLS policies |
| R2 | Viewer or wide staff role sees named health data | Low after role gate | High | Viewers redirected from Participants / Licences / Account; APIs return 403 |
| R3 | Named data shown after withdrawal | High if withdrawal is requested | High | No withdrawal product path |
| R4 | Named data for people who never consented (legacy `/activate`) | Low in UI (filter). Medium if someone queries leftover claim names | High | UI hides them; invite decline now omits claim names. Legacy `/activate` still has no consent |
| R5 | Token dashboard or `get_campaign_stats` leak | Medium (token URL; SECURITY DEFINER) | Medium | Aggregates; suppress under 5 on Overview. Practice execute grants now `service_role` only; live still to apply |
| R6 | Over-collection (emails to staff) | Medium | Medium | See minimisation |
| R7 | Invite email / magic link goes to wrong mailbox or is forwarded | Medium | High | Email is the identifier |
| R8 | RevenueCat or Resend transfer outside UK | Medium | Medium | UUID versus email; no scores to RevenueCat |
| R9 | Retention beyond need / leftover after contract | High (no deletion job) | High | GAP |
| R10 | Colour-coded decline treated as clinical risk | Medium | Medium | Display only; still a safety and communications risk |
| R11 | No view audit: cannot investigate who looked at a named record | High | Medium | Absent logging |
| R12 | Wobble admin lists all customer orgs | Low (trusted staff) | High if account compromised | TOTP required for wobble_admin named/desk access |
| R13 | Duplicate Vercel projects serving the same repo | Documented in Phase 0 | Medium | Operational, not coded |

---

## 4. Measures found, and what is not yet mitigated

| Risk | Controls in code | Residual |
| --- | --- | --- |
| R1 | Org membership + campaign-in-org check; portal matcher; Premium gate | RLS policies not written; service_role |
| R2 | Named Participants, Licences, and Account require customer_admin or wobble_admin on API, page, and nav | Residual: service_role still bypasses RLS |
| R3 | `withdrawn_at` in schema and filter | Not mitigated as a right |
| R4 | Visibility filter; Overview privacy copy; claim names omitted on decline | Legacy activate has no consent |
| R5 | Forbidden-key check; n<5 suppress on Overview; practice execute grants now `service_role` only | Token dashboards; live grants still to apply. Partial |
| R6 | Participants payload stripped of email/uuid; claim names omitted on decline | Licences emails. Partial |
| R7 | Email locked to invite; token hashed at rest | Raw token in email. Partial |
| R8 | RevenueCat gets id + dates only | Transfer docs GAP |
| R9 | Claim and invite expiry windows | Contract/account deletion GAP |
| R10 | No "at risk" label or sort-by-decline | Colour-coded worsening remains |
| R11 | `portal.participants_viewed` on named list API and page | Overview views still unlogged |
| R12 | Magic link plus TOTP for administrators; membership | Viewers still magic-link only |

---

## 5. Outstanding items and sign-off

### 5.1 GAP list (human / legal / ops)

- [ ] Lawful basis map (Art. 6) per purpose
- [ ] Article 9 and DPA 2018 Schedule 1 conditions
- [ ] Replace draft named-reporting wording; record a controlled consent version
- [ ] App Settings toggle (other repo) calling `GET`/`POST /api/app/reporting-consent`. Website wiring is in place. After lock, email `enquiries@wobblebalance.com`.
- [x] Omit `nhs_claims` names when the patient says no; name boxes optional on decline
- [x] Restrict named Participants, Licences, and Account to `customer_admin` / `wobble_admin` (viewers are Overview-only)
- [x] Audit log for named Participants views (`portal.participants_viewed`). Overview views still unlogged.
- [ ] RLS policies or an equivalent database-enforced tenant check
- [x] Restrict `EXECUTE` on `get_campaign_stats` / `get_org_stats` / `get_stats_for_campaigns` to `service_role` (practice applied; live still to apply)
- [ ] Retention, backup, and deletion at contract end and on erasure requests
- [ ] Processor register: Vercel region, Resend, RevenueCat, Auth SMTP; transfer tools
- [ ] Encryption at rest confirmation from Supabase/Vercel
- [ ] Mobile app data inventory (DOB, conditions, device, crash, push)
- [ ] `nhs-activate` Edge Function source review (legacy activate)
- [x] MFA (TOTP) for staff who can see Premium named data. Viewers exempt. Lost-app reset on the Wobble desk.
- [ ] SAR / export process
- [ ] Clinical safety review of improvement/decline colouring (is this still "display only"?)
- [ ] Volume and DPIA screening numbers from live ops, not Git
- [ ] Confirm RoPA, ICO registration, NHS DSPT if applicable (not in this repo)

### 5.2 Sign-off (blank)

| Role | Name | Date | Decision |
| --- | --- | --- | --- |
| Product owner | | | |
| DPO / data protection lead | | | |
| Legal | | | |
| Security / engineering | | | |
| Clinical safety (if required) | | | |
