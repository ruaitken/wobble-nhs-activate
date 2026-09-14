# Phase 11 Resend information packs

Captured: 2026-09-14

Licence information packs and practice magic links can now send through
Resend. Live `/activate`, dashboard links, and hosted Auth were not
changed.

## From address

`Wobble <enquiries@wobblebalance.com>`

## Information packs

Packs are sent by the app from `lib/portal/inviteEmail.ts`.

To send a real test pack from the practice shop:

1. Put the Resend sending key in `.env.local` as `RESEND_API_KEY`
2. Keep `PORTAL_USE_RESEND=true`
3. Use `npm run dev:practice` on port 3001
4. Send a pack to an address you control

Do not run `npm run dev` (port 3000, live database) while testing packs.

## Practice magic links

Login and Account invites still go through local Supabase Auth. Point that
practice SMTP at Resend with:

```bash
npm run smtp:practice
```

That script reads `RESEND_API_KEY` from `.env.local`, writes it into the
gitignored local stack, and restarts Docker. It does not change hosted
Auth.

After that, invite a real inbox from Account (while still signed in as
`practice-admin@example.com`). `practice-admin@example.com` itself is not
a real mailbox, so those login emails will no longer appear in Mailpit.

The API key must never be committed. `.env*` is gitignored.

## Production later

Vercel will need the pack values. Hosted Supabase SMTP is a separate
dashboard change and should wait until we are ready to send customer
mail.
