import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const CONFIG_PATH =
  process.env.DASHBOARD_SMOKE_CONFIG ??
  path.join(process.cwd(), ".phase0", "dashboard-smoke-cases.json");

const CAMPAIGN_DETAIL_FIELDS = [
  "seat_limit",
  "seats_remaining",
  "active_users",
  "engagement_rate_pct",
  "active_last_7d",
  "total_minutes",
  "total_workouts",
  "best_streak",
  "top_member_minutes",
  "highest_weekly_minutes",
  "avg_active_member_minutes",
  "avg_minutes_per_active_week",
  "avg_sessions_per_active_week",
  "age",
  "sex",
  "outcomes",
];

async function loadConfig() {
  try {
    return JSON.parse(await readFile(CONFIG_PATH, "utf8"));
  } catch {
    throw new Error(
      `Dashboard smoke-test config was not found at ${CONFIG_PATH}. ` +
        "Copy tests/fixtures/dashboard-smoke-cases.example.json to " +
        ".phase0/dashboard-smoke-cases.json and add private tokens locally."
    );
  }
}

const config = await loadConfig();
const baseUrl = new URL(config.baseUrl);

async function fetchSafely(url, label) {
  try {
    return await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error(`${label} could not be reached`);
  }
}

async function fetchJson(pathname, params, label) {
  const url = new URL(pathname, baseUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetchSafely(url, label);
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(`${label} did not return JSON`);
  }
  return { response, body };
}

function assertBaseStats(stats, label) {
  assert.equal(typeof stats, "object", `${label}: stats must be an object`);
  assert.equal(stats.found, true, `${label}: campaign must be found`);
  assert.equal(
    typeof stats.suppressed,
    "boolean",
    `${label}: suppression flag must be boolean`
  );
  assert.ok("trust_name" in stats, `${label}: trust_name is missing`);
  assert.ok("service_name" in stats, `${label}: service_name is missing`);
  assert.equal(
    typeof stats.enrolled,
    "number",
    `${label}: enrolled must be numeric`
  );

  if (!stats.suppressed) {
    for (const field of CAMPAIGN_DETAIL_FIELDS) {
      assert.ok(field in stats, `${label}: ${field} is missing`);
    }
  }
}

test("campaign dashboard API preserves customer contracts", async (t) => {
  for (const campaign of config.campaigns) {
    await t.test(campaign.label, async () => {
      const { response, body } = await fetchJson(
        "/api/dashboard",
        { token: campaign.token },
        campaign.label
      );

      assert.equal(response.status, 200, `${campaign.label}: expected HTTP 200`);
      assert.equal(body.ok, true, `${campaign.label}: expected ok response`);
      assertBaseStats(body.stats, campaign.label);
      assert.equal(
        body.stats.trust_name,
        campaign.expectedTrust,
        `${campaign.label}: organisation changed`
      );
      assert.equal(
        body.stats.service_name,
        campaign.expectedService,
        `${campaign.label}: service changed`
      );
    });
  }
});

test("organisation dashboard API preserves grouped contracts", async (t) => {
  for (const organisation of config.organisations) {
    await t.test(organisation.label, async () => {
      const { response, body } = await fetchJson(
        "/api/dashboard/org",
        { token: organisation.token },
        organisation.label
      );

      assert.equal(
        response.status,
        200,
        `${organisation.label}: expected HTTP 200`
      );
      assert.equal(body.ok, true, `${organisation.label}: expected ok response`);
      assert.equal(body.org.found, true, `${organisation.label}: org not found`);
      assert.equal(
        body.org.org_name,
        organisation.expectedOrg,
        `${organisation.label}: organisation changed`
      );
      assert.ok(
        Array.isArray(body.org.services),
        `${organisation.label}: services must be an array`
      );
      assertBaseStats(body.org.combined, `${organisation.label} combined`);

      const serviceNames = body.org.services
        .map((entry) => entry.stats?.service_name)
        .filter(Boolean)
        .sort();
      assert.deepEqual(
        serviceNames,
        [...organisation.expectedServices].sort(),
        `${organisation.label}: grouped services changed`
      );
    });
  }
});

test("dashboard APIs continue rejecting missing and invalid tokens", async () => {
  for (const pathname of ["/api/dashboard", "/api/dashboard/org"]) {
    const missing = await fetchJson(pathname, {}, `${pathname} missing token`);
    assert.equal(missing.response.status, 400);
    assert.equal(missing.body.ok, false);
    assert.equal(missing.body.reason, "missing_token");

    const invalid = await fetchJson(
      pathname,
      { token: "phase0-invalid-token-that-does-not-exist" },
      `${pathname} invalid token`
    );
    assert.equal(invalid.response.status, 404);
    assert.equal(invalid.body.ok, false);
    assert.equal(invalid.body.reason, "invalid_token");
  }
});

test("public customer and demonstration pages remain reachable", async (t) => {
  for (const page of config.pages) {
    await t.test(page.label, async () => {
      const url = new URL(page.path, baseUrl);
      const response = await fetchSafely(url, page.label);
      assert.equal(response.status, 200, `${page.label}: expected HTTP 200`);

      if (page.expectedText) {
        const html = await response.text();
        assert.ok(
          html.includes(page.expectedText),
          `${page.label}: expected page content is missing`
        );
      }
    });
  }
});
