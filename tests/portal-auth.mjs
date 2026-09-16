import assert from "node:assert/strict";
import test from "node:test";

// Defaults to the practice server on 3001. Port 3000 runs against the live
// database, so it must never be the fallback here.
const baseUrl = new URL(
  process.env.PORTAL_TEST_BASE_URL ?? "http://127.0.0.1:3001"
);

async function fetchSafely(path, init = {}) {
  const url = new URL(path, baseUrl);
  const response = await fetch(url, {
    ...init,
    redirect: "manual",
    headers: { Accept: "application/json", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(15_000),
  });
  return response;
}

test("logged-out users cannot open the portal home", async () => {
  const response = await fetchSafely("/portal");
  assert.ok(
    [307, 308, 302, 303].includes(response.status),
    `expected redirect, got ${response.status}`
  );
  const location = response.headers.get("location") ?? "";
  assert.ok(
    location.includes("/portal/login"),
    `expected login redirect, got ${location}`
  );
});

test("the portal login page is reachable without a session", async () => {
  const response = await fetchSafely("/portal/login");
  assert.equal(response.status, 200);
});

test("portal APIs reject logged-out users", async () => {
  const response = await fetchSafely("/api/portal/me");
  assert.equal(response.status, 401);

  const programmes = await fetchSafely("/api/portal/programmes?org_id=PRACTICE_ORG");
  assert.equal(programmes.status, 401);

  const participants = await fetchSafely(
    "/api/portal/participants?org_id=PRACTICE_ORG&campaign_id=PRACTICE_FALLS_2026"
  );
  assert.equal(participants.status, 401);

  const overview = await fetchSafely(
    "/api/portal/overview?org_id=PRACTICE_ORG&campaign_id=PRACTICE_NN4_2026"
  );
  assert.equal(overview.status, 401);

  const licences = await fetchSafely(
    "/api/portal/licences?org_id=PRACTICE_ORG&campaign_id=PRACTICE_FALLS_2026"
  );
  assert.equal(licences.status, 401);

  const account = await fetchSafely("/api/portal/account?org_id=PRACTICE_ORG");
  assert.equal(account.status, 401);

  const adminOrgs = await fetchSafely("/api/portal/admin/organisations");
  assert.equal(adminOrgs.status, 401);

  const adminProgrammes = await fetchSafely("/api/portal/admin/programmes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(adminProgrammes.status, 401);
});

test("a user cannot read another organisation through the portal API", async () => {
  const response = await fetchSafely("/api/portal/me?org_id=NOT_A_MEMBER_ORG");
  assert.equal(response.status, 401);
});

test("existing token dashboards still load without login", async () => {
  const dashboard = await fetchSafely("/dashboard/demo-wobble-impact-2026");
  assert.equal(dashboard.status, 200);

  const missingToken = await fetchSafely("/api/dashboard");
  assert.equal(missingToken.status, 400);
  const body = await missingToken.json();
  assert.equal(body.ok, false);
  assert.equal(body.reason, "missing_token");
});
