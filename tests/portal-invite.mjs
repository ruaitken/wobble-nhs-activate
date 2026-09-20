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

function claimNameFields(storeNames, firstName, lastName) {
  if (!storeNames) {
    return { first_name: "", last_name: "" };
  }
  return {
    first_name: normalizeName(firstName),
    last_name: normalizeName(lastName),
  };
}

function isNamedReportingVisible(consent) {
  return Boolean(consent?.consented) && !consent?.withdrawn_at;
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
  assert.ok(source.includes("claimNameFields"));
});

test("first and last name are required when named reporting is on", () => {
  assert.equal(namesAreValid("Pat", "River"), true);
  assert.equal(namesAreValid("  ", "River"), false);
  assert.equal(namesAreValid("Pat", "   "), false);
});

test("a declined patient has no name on the claim and is not shown named", () => {
  const declinedClaim = claimNameFields(false, "Drew", "Park");
  assert.deepEqual(declinedClaim, { first_name: "", last_name: "" });
  assert.deepEqual(claimNameFields(true, "Pat", "River"), {
    first_name: "Pat",
    last_name: "River",
  });

  const enrolled = [
    {
      first_name: "Pat",
      last_name: "River",
      consent: { consented: true, withdrawn_at: null },
    },
    {
      first_name: declinedClaim.first_name,
      last_name: declinedClaim.last_name,
      consent: { consented: false, withdrawn_at: null },
    },
  ];
  const named = enrolled.filter((person) =>
    isNamedReportingVisible(person.consent)
  );
  assert.equal(named.length, 1);
  assert.equal(named[0].first_name, "Pat");
  assert.equal(
    named.some((person) => person.first_name === "Drew" || person.last_name === "Park"),
    false
  );
  assert.equal(isNamedReportingVisible({ consented: false, withdrawn_at: null }), false);

  const licences = readFileSync(
    path.join(process.cwd(), "lib/portal/licences.ts"),
    "utf8"
  );
  const participants = readFileSync(
    path.join(process.cwd(), "lib/portal/participants.ts"),
    "utf8"
  );
  const ui = readFileSync(
    path.join(process.cwd(), "app/invite/InviteActivateClient.tsx"),
    "utf8"
  );
  assert.ok(licences.includes("claimNameFields"));
  assert.ok(licences.includes("storeClaimNames"));
  assert.ok(participants.includes("isNamedReportingVisible"));
  assert.ok(ui.includes("You can leave the name boxes blank"));
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
  assert.ok(ui.includes("nameRequired"));
  assert.ok(complete.includes("missing_name"));
  assert.ok(complete.includes("consent_required"));
  assert.ok(complete.includes("storeClaimNames"));
});

function isLocalSupabaseUrl(url) {
  return url.includes("127.0.0.1") || url.includes("localhost");
}

function classifyAppAccessMode({ url, apiKey, entitlementId }) {
  if (apiKey && entitlementId) return "live";
  if (isLocalSupabaseUrl(url)) return "practice";
  return "unavailable";
}

test("portal invitations grant app access without changing nhs-activate", () => {
  const access = readFileSync(
    path.join(process.cwd(), "lib/portal/appAccess.ts"),
    "utf8"
  );
  const complete = readFileSync(
    path.join(process.cwd(), "lib/portal/licences.ts"),
    "utf8"
  );
  const nhs = readFileSync(
    path.join(process.cwd(), "app/api/nhs/activate/route.ts"),
    "utf8"
  );
  const ui = readFileSync(
    path.join(process.cwd(), "app/invite/InviteActivateClient.tsx"),
    "utf8"
  );

  assert.ok(access.includes("grantRevenueCatEntitlement"));
  assert.ok(access.includes("practice"));
  assert.ok(complete.includes("grantAppAccess"));
  assert.ok(complete.includes("pending_grant"));
  assert.ok(nhs.includes('functions.invoke("nhs-activate"'));
  assert.ok(!nhs.includes("grantAppAccess"));
  assert.ok(ui.includes("Your place is reserved"));
});

test("practice skips live RevenueCat; missing keys on a live host stay pending", () => {
  assert.equal(
    classifyAppAccessMode({
      url: "http://127.0.0.1:54321",
      apiKey: "",
      entitlementId: "",
    }),
    "practice"
  );
  assert.equal(
    classifyAppAccessMode({
      url: "https://example.supabase.co",
      apiKey: "",
      entitlementId: "",
    }),
    "unavailable"
  );
  assert.equal(
    classifyAppAccessMode({
      url: "https://example.supabase.co",
      apiKey: "rc_key",
      entitlementId: "wobble",
    }),
    "live"
  );
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
