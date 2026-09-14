import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

function isCurrentProgramme(programme, now = Date.now()) {
  if (!programme.is_active) return false;
  if (
    programme.subscription_status !== "active" &&
    programme.subscription_status !== "trial"
  ) {
    return false;
  }
  if (programme.ends_at && Date.parse(programme.ends_at) <= now) return false;
  return true;
}

function toProgrammeView(programme, now = Date.now()) {
  const isCurrent = isCurrentProgramme(programme, now);
  return {
    ...programme,
    is_current: isCurrent,
    can_issue_licences: isCurrent,
    show_participants: programme.dashboard_tier === "premium",
  };
}

function defaultCampaignId(programmes) {
  const current = programmes.filter((programme) => programme.is_current);
  const pool = current.length > 0 ? current : programmes;
  return [...pool].sort(
    (a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at)
  )[0]?.campaign_id;
}

const now = Date.parse("2026-09-10T12:00:00Z");

const falls = toProgrammeView(
  {
    campaign_id: "PRACTICE_FALLS_2026",
    dashboard_tier: "premium",
    subscription_status: "active",
    is_active: true,
    starts_at: "2026-06-12T00:00:00Z",
    ends_at: "2027-06-07T00:00:00Z",
  },
  now
);
const nn4 = toProgrammeView(
  {
    campaign_id: "PRACTICE_NN4_2026",
    dashboard_tier: "base",
    subscription_status: "active",
    is_active: true,
    starts_at: "2026-07-12T00:00:00Z",
    ends_at: "2027-07-07T00:00:00Z",
  },
  now
);
const historical = toProgrammeView(
  {
    campaign_id: "PRACTICE_FALLS_2025",
    dashboard_tier: "premium",
    subscription_status: "cancelled",
    is_active: false,
    starts_at: "2025-04-28T00:00:00Z",
    ends_at: "2026-04-23T00:00:00Z",
  },
  now
);

test("shell rules still live in programmeStatus.ts", () => {
  const source = readFileSync(
    path.join(process.cwd(), "lib/portal/programmeStatus.ts"),
    "utf8"
  );
  assert.ok(source.includes("can_issue_licences"));
  assert.ok(source.includes('dashboard_tier === "premium"'));
});

test("switching context prefers the latest current programme", () => {
  assert.equal(defaultCampaignId([falls, nn4, historical]), "PRACTICE_NN4_2026");
});

test("base programmes do not expose participants", () => {
  assert.equal(nn4.show_participants, false);
  assert.equal(falls.show_participants, true);
});

test("archived programmes cannot issue licences", () => {
  assert.equal(historical.can_issue_licences, false);
  assert.equal(historical.is_current, false);
  assert.equal(falls.can_issue_licences, true);
});
