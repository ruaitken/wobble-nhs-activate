# Phase 6 portal licences

Captured: 2026-09-10

Customer administrators can send a Wobble information pack from the
Licences tab. Production was not deployed. Existing `/activate` and
dashboard token routes were not changed.

## Customer flow

- Show issued / remaining seats
- Enter email, confirm email, send pack
- Sending immediately reserves a seat for 14 days
- Expired invitations release the seat
- Activation is locked to the invited email
- Historical programmes cannot send packs
- Viewers can see totals and status, but cannot send

## How seats are counted

Issued = existing claims + open pending invitations.
The live `seats_used` column is only increased when a place is activated.

Invitation tokens are stored as hashes. Raw tokens are emailed and never
written to the database.

## Hosted pack

The email includes links to `/invite/{token}` and `/pack`. No PDF is
attached.

## Practice

Use Mailpit at `http://127.0.0.1:54324` to open the sent email.
The existing `/activate?campaign_id=...` page still works without an
invitation.
