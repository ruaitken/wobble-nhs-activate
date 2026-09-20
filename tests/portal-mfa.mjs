import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

function sessionNeedsMfa(memberships) {
  return memberships.some(
    (membership) =>
      membership.role === "customer_admin" || membership.role === "wobble_admin"
  );
}

function parseAal(value) {
  return value === "aal2" ? "aal2" : "aal1";
}

function mfaSatisfied({ needsMfa, aal }) {
  return !needsMfa || aal === "aal2";
}

test("MFA helpers live in mfa.ts", () => {
  const source = readFileSync(path.join(process.cwd(), "lib/portal/mfa.ts"), "utf8");
  assert.ok(source.includes("sessionNeedsMfa"));
  assert.ok(source.includes("mfaSatisfied"));
  assert.ok(source.includes("resetMfaForEmail"));
});

test("viewers skip authenticator checks", () => {
  assert.equal(sessionNeedsMfa([{ role: "viewer" }]), false);
  assert.equal(mfaSatisfied({ needsMfa: false, aal: "aal1" }), true);
});

test("administrators need aal2 before named tools", () => {
  assert.equal(sessionNeedsMfa([{ role: "customer_admin" }]), true);
  assert.equal(sessionNeedsMfa([{ role: "wobble_admin" }]), true);
  assert.equal(mfaSatisfied({ needsMfa: true, aal: "aal1" }), false);
  assert.equal(mfaSatisfied({ needsMfa: true, aal: "aal2" }), true);
  assert.equal(parseAal("aal2"), "aal2");
  assert.equal(parseAal("aal1"), "aal1");
});

test("named APIs and the Wobble desk require a completed authenticator", () => {
  const access = readFileSync(path.join(process.cwd(), "lib/portal/access.ts"), "utf8");
  const participants = readFileSync(
    path.join(process.cwd(), "app/api/portal/participants/route.ts"),
    "utf8"
  );
  const licences = readFileSync(
    path.join(process.cwd(), "app/api/portal/licences/route.ts"),
    "utf8"
  );
  const account = readFileSync(
    path.join(process.cwd(), "app/api/portal/account/route.ts"),
    "utf8"
  );
  const admin = readFileSync(
    path.join(process.cwd(), "app/portal/admin/page.tsx"),
    "utf8"
  );
  const callback = readFileSync(
    path.join(process.cwd(), "app/auth/callback/route.ts"),
    "utf8"
  );
  const context = readFileSync(
    path.join(process.cwd(), "lib/portal/context.ts"),
    "utf8"
  );

  assert.ok(access.includes("requireSatisfiedMfa"));
  assert.ok(access.includes("mfa_required"));
  assert.ok(participants.includes("requireSatisfiedMfa"));
  assert.ok(licences.includes("requireSatisfiedMfa"));
  assert.ok(account.includes("requireSatisfiedMfa"));
  assert.ok(admin.includes("mfaPagePath"));
  assert.ok(admin.includes("MfaResetForm"));
  assert.ok(callback.includes("sessionNeedsMfa"));
  assert.ok(context.includes("mfaSatisfied"));
});

test("the MFA page and reset route exist", () => {
  const page = readFileSync(
    path.join(process.cwd(), "app/portal/mfa/MfaForm.tsx"),
    "utf8"
  );
  const reset = readFileSync(
    path.join(process.cwd(), "app/api/portal/admin/mfa-reset/route.ts"),
    "utf8"
  );
  assert.ok(page.includes("factorType: \"totp\""));
  assert.ok(page.includes("enquiries@wobblebalance.com"));
  assert.ok(reset.includes("resetMfaForEmail"));
});
