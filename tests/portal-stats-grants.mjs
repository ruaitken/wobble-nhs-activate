import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const MIGRATION = "supabase/migrations/20260920140000_restrict_stats_function_grants.sql";

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

test("stats RPCs are granted only to service_role in the migration", () => {
  const source = readFileSync(path.join(process.cwd(), MIGRATION), "utf8");
  assert.ok(source.includes("revoke all on function public.get_campaign_stats"));
  assert.ok(source.includes("revoke all on function public.get_org_stats"));
  assert.ok(source.includes("revoke all on function public.get_stats_for_campaigns"));
  assert.ok(source.includes("from public, anon, authenticated"));
  assert.ok(source.includes("grant execute on function public.get_campaign_stats(text) to service_role"));
  assert.ok(!source.includes("create or replace function"));
  assert.ok(!source.includes("CREATE OR REPLACE FUNCTION"));
});

test("anon cannot run get_campaign_stats; service_role still can", async (t) => {
  const env = practiceEnv();
  if (!env) {
    t.skip("local practice Supabase is not running");
    return;
  }

  async function rpc(key, body) {
    const response = await fetch(`${env.API_URL}/rest/v1/rpc/get_campaign_stats`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    return { status: response.status, body: await response.json() };
  }

  const denied = await rpc(env.ANON_KEY, { p_campaign_id: "PRACTICE_FALLS_2026" });
  assert.equal(denied.status, 401);
  assert.match(String(denied.body.message ?? ""), /permission denied/i);

  const allowed = await rpc(env.SERVICE_ROLE_KEY, {
    p_campaign_id: "PRACTICE_FALLS_2026",
  });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.body.found, true);
  assert.equal(typeof allowed.body.enrolled, "number");
});
