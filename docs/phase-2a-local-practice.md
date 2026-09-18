# Phase 2A local practice database

The practice database runs on this Mac in Docker. It is not a paid
Supabase branch and does not contain production participant data.

## What it is for

- Rehearse portal tables and functions before production
- Keep existing customer dashboard links untouched
- Test with fictional organisations and campaigns only

## How to start

Docker Desktop must be running.

```bash
supabase start --workdir .phase0/supabase-reference
```

Expected local ports:

- API: `http://127.0.0.1:54321`
- Database: `127.0.0.1:54322`

## Fictional seed programmes

- Organisation: Example Integrated Care
- Falls Prevention 2026
- NN4 Practice 2026

Dashboard tokens are obvious practice values such as
`practice-campaign-falls-local-only`. They are not customer tokens.

## Safety

- Production remains the source of live customer data.
- The captured schema and local stack live under `.phase0/`, which is
  excluded from Git.
- Later portal tables will be added here first, then copied to production
  as reviewed additive migrations.
- Phase 2B added those tables locally. See `docs/phase-2b-portal-tables.md`.
