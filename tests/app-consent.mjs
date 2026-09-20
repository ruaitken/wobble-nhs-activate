import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

function isNamedReportingVisible(consent) {
  return Boolean(consent?.consented) && !consent?.withdrawn_at;
}

function parseConsentChoice(value) {
  if (value === true || value === "true" || value === "yes") return true;
  if (value === false || value === "false" || value === "no") return false;
  return null;
}

test("patient consent helpers live outside the staff portal matcher", () => {
  const proxy = readFileSync(path.join(process.cwd(), "proxy.ts"), "utf8");
  const route = readFileSync(
    path.join(process.cwd(), "app/api/app/reporting-consent/route.ts"),
    "utf8"
  );
  const logic = readFileSync(
    path.join(process.cwd(), "lib/portal/patientConsent.ts"),
    "utf8"
  );
  const profile = readFileSync(
    path.join(process.cwd(), "lib/portal/inviteProfile.ts"),
    "utf8"
  );
  assert.ok(!proxy.includes("/api/app"));
  assert.ok(route.includes("bearerAccessToken"));
  assert.ok(logic.includes("show_toggle"));
  assert.ok(logic.includes("not_applicable"));
  assert.ok(profile.includes("setReportingConsent"));
  assert.ok(profile.includes("withdrawn_at: consented ? null : now"));
  assert.ok(profile.includes("claimNameFields"));
});

test("withdrawing named reporting hides the person", () => {
  assert.equal(
    isNamedReportingVisible({
      consented: false,
      withdrawn_at: "2026-09-20T12:00:00Z",
    }),
    false
  );
  assert.equal(
    isNamedReportingVisible({ consented: true, withdrawn_at: null }),
    true
  );
});

test("the app toggle body must be an explicit yes or no", () => {
  assert.equal(parseConsentChoice(true), true);
  assert.equal(parseConsentChoice(false), false);
  assert.equal(parseConsentChoice(undefined), null);
});
