# Phase 8 portal account

Captured: 2026-09-10

Customer administrators can invite and remove colleagues from Account.
Production was not deployed. Existing dashboard token routes were not
changed.

## Rules

- Account is organisation-level, not a programme tab
- Invite with email and confirm email
- Selectable roles are Administrator and Viewer
- Customers cannot assign the Wobble administrator role
- Viewers can see who has access, but cannot invite or remove
- The last administrator cannot be removed
- Removing yourself signs you out

## Practice

Seed with `npm run seed:practice-portal`.

- `practice-admin@example.com` — administrator
- `practice-viewer@example.com` — viewer
- `practice-outsider@example.com` — no organisation

Invitations send a magic link to Mailpit at `http://127.0.0.1:54324`.
