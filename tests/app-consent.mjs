import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  currentAccess,
  patientProgrammeName,
  sortAccessProgrammes,
} from "../lib/portal/accessProgrammes.ts";

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

test("patients see the programme name without the year in brackets", () => {
  assert.equal(patientProgrammeName("Active Norfolk (2026-2027)", "X"), "Active Norfolk");
  assert.equal(patientProgrammeName("Active Norfolk (Initial Pilot)", "X"), "Active Norfolk (Initial Pilot)");
  assert.equal(patientProgrammeName("NN4 (2026-2027)", "X"), "NN4");
  assert.equal(patientProgrammeName("", "NN4_JUNE_2026_A1"), "NN4_JUNE_2026_A1");
});

function place(campaign_id, access_starts_at, access_ends_at) {
  return {
    campaign_id,
    programme_name: campaign_id,
    org_name: "Norfolk Integrated Care",
    access_starts_at,
    access_ends_at,
    named_reporting: false,
    consented: null,
  };
}

test("current access is the live place that ends last; ended places are not current", () => {
  const now = Date.parse("2027-02-01T12:00:00Z");
  const ended = place("2026", "2026-01-05T09:00:00Z", "2026-03-30T09:00:00Z");
  const live = place("2027", "2027-01-11T09:00:00Z", "2027-04-05T09:00:00Z");
  assert.equal(currentAccess([ended, live], now)?.campaign_id, "2027");
  assert.equal(currentAccess([ended], now), null);
  assert.deepEqual(
    sortAccessProgrammes([live, ended]).map((item) => item.campaign_id),
    ["2026", "2027"]
  );
});

test("the GET answer lists every organisation place, Base included", () => {
  const logic = readFileSync(path.join(process.cwd(), "lib/portal/patientConsent.ts"), "utf8");
  assert.ok(logic.includes("access_programmes"));
  assert.ok(logic.includes("current_access"));
  assert.ok(logic.includes("access_ends_at: claim.expires_at"));
  assert.ok(logic.includes('from("dashboard_orgs")'));
});

test("the app toggle body must be an explicit yes or no", () => {
  assert.equal(parseConsentChoice(true), true);
  assert.equal(parseConsentChoice(false), false);
  assert.equal(parseConsentChoice(undefined), null);
});
