import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

const MIGRATION = "supabase/migrations/20261013160000_portal_org_overview.sql";

function source(relativePath) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("overall stats are a new portal function and leave the token dashboards alone", () => {
  const migration = source(MIGRATION);
  assert.ok(migration.includes("create or replace function public.get_portal_org_stats"));
  assert.ok(migration.includes("distinct on (cl.user_id, w.week_start)"));
  assert.ok(migration.includes("select distinct user_id from claims"));
  assert.ok(migration.includes("(select enrolled from kpi) < 3"));
  assert.ok(migration.includes("(select paired_members from outcomes) < 3"));
  assert.ok(!migration.includes("seat_limit"));
  assert.ok(!migration.includes("seats_remaining"));
  assert.ok(!/function public\.get_org_stats/.test(migration));
  assert.ok(!/function public\.get_campaign_stats/.test(migration));
  assert.ok(!/function public\.get_stats_for_campaigns/.test(migration));
  assert.ok(!/function public\.get_portal_campaign_stats/.test(migration));
  assert.ok(migration.includes("from public, anon, authenticated"));
  assert.ok(migration.includes("to service_role"));
});

test("Overall is the first programme choice and hides licences", () => {
  const switcher = source("app/portal/ProgrammeSwitcher.tsx");
  const shell = source("app/portal/PortalShell.tsx");
  const page = source("app/portal/[orgId]/[campaignId]/page.tsx");
  assert.ok(switcher.includes("OVERALL_PROGRAMME_ID"));
  assert.ok(switcher.includes("All programmes"));
  assert.ok(switcher.includes("Each programme"));
  assert.ok(switcher.includes("font-extrabold"));
  assert.ok(shell.includes("!selected.is_overall"));
  assert.ok(page.includes("getPortalOrgStats"));
  assert.ok(source("app/dashboard/[token]/DashboardClient.tsx").includes(
    'typeof stats.seats_remaining === "number"'
  ));
  assert.ok(source("lib/portal/participants.ts").includes("programme_name"));
});
