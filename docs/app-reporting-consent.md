# App named-reporting consent API

Patient-facing wiring for the Settings toggle. Staff `/api/portal/*` routes are not used.

Base URL: the live portal host (for example `https://wobble-account-activate-9i2r.vercel.app`).

Authenticate with the same Supabase user access token the app already has:

```
Authorization: Bearer <access_token>
```

## GET `/api/app/reporting-consent`

- Direct-to-consumer (no campaign claim): `campaign_member: false`, `show_toggle: false`. Hide the toggle.
- Campaign member on a Premium / consented programme: `show_toggle: true`. `consented` is true if they are currently named-visible on any of those programmes.
- `programmes` is unchanged: only the programmes the Settings toggle applies to.

### Organisation access (end-of-access messaging)

`access_programmes` lists every organisation place, Base and Premium, sorted by end date:

```json
{
  "campaign_id": "ACTIVE_NOW_JUNE_2026_A1",
  "programme_name": "Active Norfolk",
  "org_name": "Norfolk Integrated Care",
  "access_starts_at": "2026-06-20T10:12:00Z",
  "access_ends_at": "2026-09-12T10:12:00Z",
  "named_reporting": false,
  "consented": null
}
```

- `programme_name` is the name to show patients. A year in brackets is removed.
- `access_ends_at` is when organisation-funded access ends. It can be null (no end set).
- `named_reporting` is true on Premium programmes. Only then include the "turn this off in Settings" line.
- `current_access` is the place that is live now, or null. If two overlap, it is the one that ends last.

Use `current_access.access_ends_at` for the 5-day banner and notification. Use the RevenueCat promotional date only if this field is missing.

After the end date, new activity on the same login is not shown to the organisation (`docs/phase-11-claim-window-cap.md`).

## POST `/api/app/reporting-consent`

```json
{ "consented": true }
```

or

```json
{ "consented": false, "campaign_id": "OPTIONAL_CAMPAIGN_ID" }
```

Omit `campaign_id` to update every programme the toggle applies to.

- `consented: false` sets `withdrawn_at`, clears claim names, and hides the person on Participants. Overview totals stay.
- `consented: true` restores named reporting and copies `user_meta` names onto the claim if present.
- `403 not_applicable` if they are not a campaign person the toggle applies to.

After app access expires they may not reach Settings. Exceptions: `enquiries@wobblebalance.com`.
