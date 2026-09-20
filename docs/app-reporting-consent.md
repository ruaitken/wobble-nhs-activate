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
