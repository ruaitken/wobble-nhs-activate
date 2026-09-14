# Phase 9 invitation name and consent

Captured: 2026-09-11

Invitation activation now collects a name, and Premium programmes also
collect named-reporting consent. Production was not deployed. Existing
`/activate` and `nhs-activate` were not changed.

## Rules

- First and last name are required
- Existing profile names are prefilled and can be corrected
- Names are stored on `user_meta`
- Premium invitations must choose yes or no for named reporting
- Saying no still activates Wobble; they stay in Overview totals only
- Consent is stored per programme on `portal_reporting_consents`
- Base invitations do not ask for named reporting

Consent wording on the page is a draft for practice, not a legal review.
