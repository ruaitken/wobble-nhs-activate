import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

function normalizeName(value) {
  return value.trim().replace(/\s+/g, " ");
}

function namesAreValid(firstName, lastName) {
  return normalizeName(firstName).length > 0 && normalizeName(lastName).length > 0;
}

function parseConsentChoice(value) {
  if (value === true || value === "true" || value === "yes") return true;
  if (value === false || value === "false" || value === "no") return false;
  return null;
}

test("invite profile helpers still live in inviteProfile.ts", () => {
  const source = readFileSync(
    path.join(process.cwd(), "lib/portal/inviteProfile.ts"),
    "utf8"
  );
  assert.ok(source.includes("REPORTING_CONSENT_VERSION"));
  assert.ok(source.includes("saveReportingConsent"));
  assert.ok(source.includes("saveProfileNames"));
});

test("first and last name are required", () => {
  assert.equal(namesAreValid("Pat", "River"), true);
  assert.equal(namesAreValid("  ", "River"), false);
  assert.equal(namesAreValid("Pat", "   "), false);
});

test("Premium consent must be an explicit yes or no", () => {
  assert.equal(parseConsentChoice("yes"), true);
  assert.equal(parseConsentChoice("no"), false);
  assert.equal(parseConsentChoice(""), null);
  assert.equal(parseConsentChoice(undefined), null);
});

test("declining consent still counts as a recorded choice", () => {
  assert.equal(parseConsentChoice(false), false);
});

test("existing /activate pages do not collect portal consent", () => {
  const activate = readFileSync(
    path.join(process.cwd(), "app/activate/ActivateClient.tsx"),
    "utf8"
  );
  const nhs = readFileSync(
    path.join(process.cwd(), "app/api/nhs/activate/route.ts"),
    "utf8"
  );
  assert.ok(!activate.includes("portal_reporting_consents"));
  assert.ok(!activate.includes("ask_consent"));
  assert.ok(nhs.includes("nhs-activate"));
  assert.ok(!nhs.includes("portal_reporting_consents"));
});

test("the invitation page collects name and Premium consent", () => {
  const ui = readFileSync(
    path.join(process.cwd(), "app/invite/InviteActivateClient.tsx"),
    "utf8"
  );
  const complete = readFileSync(
    path.join(process.cwd(), "lib/portal/licences.ts"),
    "utf8"
  );
  assert.ok(ui.includes("First name"));
  assert.ok(ui.includes("Named reporting"));
  assert.ok(ui.includes("ask_consent"));
  assert.ok(complete.includes("missing_name"));
  assert.ok(complete.includes("consent_required"));
});

test("the live activation page wraps search params in Suspense", () => {
  const page = readFileSync(
    path.join(process.cwd(), "app/activate/page.tsx"),
    "utf8"
  );
  const client = readFileSync(
    path.join(process.cwd(), "app/activate/ActivateClient.tsx"),
    "utf8"
  );
  assert.ok(page.includes("Suspense"));
  assert.ok(client.includes("AbortSignal.timeout"));
});
