import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  assessmentsFromRows,
  sessionDatesInWindow,
  sumWeeklyMinutes,
  weekStartFromKey,
  weeklyMinutesInWindow,
} from "../lib/portal/participantView.ts";

const MIGRATION = "supabase/migrations/20261001100000_portal_capped_campaign_stats.sql";

function practiceEnv() {
  const status = spawnSync(
    "supabase",
    ["status", "--workdir", ".phase0/supabase-reference", "-o", "env"],
    { encoding: "utf8" }
  );
  if (status.status !== 0) return null;
  const env = {};
  for (const line of status.stdout.split("\n")) {
    const match = line.match(/^(ANON_KEY|API_URL|SERVICE_ROLE_KEY)="(.*)"$/);
    if (match) env[match[1]] = match[2];
  }
  if (!env.API_URL || !env.ANON_KEY || !env.SERVICE_ROLE_KEY) return null;
  return env;
}

// Activated Wednesday 14 January 2026, funded until Sunday 1 February 2026.
const window = {
  claimedAt: "2026-01-14T10:00:00Z",
  expiresAt: "2026-02-01T12:00:00Z",
};

function assessment(created_at, sit_to_stand_count, assessment_type = "retake") {
  return {
    assessment_type,
    sit_to_stand_count,
    balance_score: 3,
    confidence_score: 90,
    fall_count: 1,
    created_at,
  };
}

test("live ISO week keys and dated keys resolve to the Monday", () => {
  assert.equal(weekStartFromKey("2025-44"), "2025-10-27");
  assert.equal(weekStartFromKey("2026-01"), "2025-12-29");
  assert.equal(weekStartFromKey("2026-01-07"), "2026-01-05");
  assert.equal(weekStartFromKey("minutes"), null);
});

test("weeks touching the window count in full; weeks outside do not", () => {
  const weeks = weeklyMinutesInWindow(
    {
      "2026-02": 100, // w/c 5 Jan, before activation
      "2026-03": 40, // w/c 12 Jan, activation week
      "2026-04": 50, // w/c 19 Jan
      "2026-05": 60, // w/c 26 Jan, ends Sunday 1 Feb
      "2026-06": 500, // w/c 2 Feb, self-funded
    },
    window
  );
  assert.deepEqual(Object.keys(weeks).sort(), ["2026-01-12", "2026-01-19", "2026-01-26"]);
  assert.equal(sumWeeklyMinutes(weeks), 150);
});

test("sessions count only on days inside the window", () => {
  const days = sessionDatesInWindow(
    ["2026-01-13", "2026-01-14", "2026-02-01", "2026-02-02"],
    window
  );
  assert.deepEqual(days, ["2026-01-14", "2026-02-01"]);
});

test("baseline is the latest assessment on or before activation", () => {
  const rows = [
    assessment("2025-06-01T09:00:00Z", 5, "initial"),
    assessment("2026-01-10T09:00:00Z", 8),
    assessment("2026-01-30T09:00:00Z", 11),
    assessment("2026-03-01T09:00:00Z", 20),
  ];
  const [sts] = assessmentsFromRows(rows, window);
  assert.equal(sts.baseline, 8);
  assert.equal(sts.current, 11);
});

test("with nothing before activation, the first assessment in the window is the baseline", () => {
  const rows = [
    assessment("2026-01-15T09:00:00Z", 7, "initial"),
    assessment("2026-01-31T09:00:00Z", 9),
  ];
  const [sts] = assessmentsFromRows(rows, window);
  assert.equal(sts.baseline, 7);
  assert.equal(sts.current, 9);
});

test("a retake after the funded window does not pair", () => {
  const rows = [
    assessment("2026-01-15T09:00:00Z", 7, "initial"),
    assessment("2026-02-10T09:00:00Z", 12),
  ];
  assert.deepEqual(assessmentsFromRows(rows, window), []);
});

test("a second programme next year starts fresh on the same login", () => {
  const nextYear = {
    claimedAt: "2027-01-11T09:00:00Z",
    expiresAt: "2027-04-05T09:00:00Z",
  };
  const minutes = { "2026-04": 50, "2026-30": 300, "2027-03": 40 };
  assert.equal(sumWeeklyMinutes(weeklyMinutesInWindow(minutes, nextYear)), 40);

  const rows = [
    assessment("2026-01-15T09:00:00Z", 7, "initial"),
    assessment("2026-07-01T09:00:00Z", 10),
    assessment("2027-03-01T09:00:00Z", 12),
  ];
  const [sts] = assessmentsFromRows(rows, nextYear);
  assert.equal(sts.baseline, 10);
  assert.equal(sts.current, 12);
});

test("Overview uses the capped function; token dashboards keep the old one", () => {
  const overview = readFileSync(path.join(process.cwd(), "lib/portal/overview.ts"), "utf8");
  const tokenRoute = readFileSync(path.join(process.cwd(), "app/api/dashboard/route.ts"), "utf8");
  assert.ok(overview.includes('"get_portal_campaign_stats"'));
  assert.ok(tokenRoute.includes('"get_campaign_stats"'));

  const migration = readFileSync(path.join(process.cwd(), MIGRATION), "utf8");
  assert.ok(migration.includes("create or replace function public.get_portal_campaign_stats"));
  assert.ok(!/function public\.get_campaign_stats/.test(migration));
  assert.ok(!/function public\.get_org_stats/.test(migration));
  assert.ok(!/function public\.get_stats_for_campaigns/.test(migration));
  assert.ok(migration.includes("from public, anon, authenticated"));
  assert.ok(migration.includes("to service_role"));
});

test("re-activating an ended place on the same programme is refused", () => {
  const source = readFileSync(path.join(process.cwd(), "lib/portal/licences.ts"), "utf8");
  const client = readFileSync(path.join(process.cwd(), "app/invite/InviteActivateClient.tsx"), "utf8");
  assert.ok(source.includes('"place_already_used"'));
  assert.ok(client.includes('"place_already_used"'));
});

test("anon cannot run get_portal_campaign_stats; service_role can", async (t) => {
  const env = practiceEnv();
  if (!env) {
    t.skip("local practice Supabase is not running");
    return;
  }

  async function rpc(key) {
    const response = await fetch(`${env.API_URL}/rest/v1/rpc/get_portal_campaign_stats`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_campaign_id: "PRACTICE_FALLS_2026" }),
      signal: AbortSignal.timeout(10_000),
    });
    return { status: response.status, body: await response.json() };
  }

  const denied = await rpc(env.ANON_KEY);
  assert.equal(denied.status, 401);
  const allowed = await rpc(env.SERVICE_ROLE_KEY);
  assert.equal(allowed.status, 200);
  assert.equal(allowed.body.found, true);
  assert.equal(typeof allowed.body.total_minutes, "number");
});
