# Phase 3 portal authentication

Captured: 2026-09-10

Staff sign-in lives at `/portal`. Existing customer dashboard links do not
require this login.

## What was added

- `/portal/login` — work email, magic-link sign-in
- `/portal` — signed-in home, organisations the user belongs to, sign out
- `/auth/callback` — completes the magic-link sign-in
- `/api/portal/login`, `/api/portal/logout`, `/api/portal/me`

Next.js `proxy.ts` refreshes the session and protects only:

- `/portal`
- `/portal/*`
- `/api/portal/*`

`/dashboard/*`, `/activate`, `/api/dashboard`, and `/api/nhs/*` are not
covered by this proxy.

## Access rules

- Magic links are requested only after the email belongs to
  `portal_org_members`. Unknown emails get the same generic response.
- `shouldCreateUser` is false, so login cannot create new Auth users.
- Magic links are single-use and expire after one hour (Supabase Auth default).
- `/api/portal/me?org_id=` returns 403 if the signed-in user is not a member
  of that organisation.
- The last organisation administrator cannot be removed. That rule is in
  `lib/portal/adminGuards.ts` and will be used when invite/remove is built.

## Local practice login

Keep Docker running, then:

```bash
npm run seed:practice-portal
npm run dev:practice
```

Open `http://127.0.0.1:3001/portal/login`. Request a new email after any
sign-in-link change; old emails still use the previous URL.

Practice admin: `practice-admin@example.com`

Until practice SMTP is applied, the sign-in email is caught by Mailpit at
[http://127.0.0.1:54324](http://127.0.0.1:54324). After
`npm run smtp:practice`, magic links go through Resend instead. See
`docs/phase-11-resend.md`.

`npm run dev` still uses `.env.local` (production keys). Prefer
`dev:practice` for portal login so magic links are not sent from the live
Auth project. Magic-link sending is disabled against hosted Auth unless
`PORTAL_ALLOW_HOSTED_AUTH=true`.

## Safety

Production was not deployed and the production database was not changed.
