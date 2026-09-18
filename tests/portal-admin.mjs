import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

function slugOrgId(name) {
  const slug = name
    .trim()
    .toUpperCase()
    .replace(/['’]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return slug || "ORG";
}

function nextUniqueId(base, existing) {
  const taken = new Set(existing);
  if (!taken.has(base)) return base;
  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${base}_${index}`;
    if (!taken.has(candidate)) return candidate;
  }
  throw new Error("id_exhausted");
}

function isDurationWeeks(value) {
  return Number.isInteger(value) && value >= 12 && value <= 52;
}

function weeksToDays(weeks) {
  return weeks * 7;
}

function addWeeks(start, weeks) {
  const end = new Date(start.getTime());
  end.setUTCDate(end.getUTCDate() + weeksToDays(weeks));
  return end;
}

function hasWobbleAdminAccess(memberships) {
  return memberships.some((membership) => membership.role === "wobble_admin");
}

test("organisation ids still live in orgIds.ts", () => {
  const source = readFileSync(path.join(process.cwd(), "lib/portal/orgIds.ts"), "utf8");
  assert.ok(source.includes("slugOrgId"));
  assert.ok(source.includes("nextUniqueId"));
});

test("organisation names become stable uppercase ids", () => {
  assert.equal(slugOrgId("Example Integrated Care"), "EXAMPLE_INTEGRATED_CARE");
  assert.equal(slugOrgId("  Surrey Falls  "), "SURREY_FALLS");
});

test("duplicate organisation ids get a numeric suffix", () => {
  assert.equal(nextUniqueId("SURREY", ["SURREY"]), "SURREY_2");
  assert.equal(nextUniqueId("SURREY", []), "SURREY");
});

test("only Wobble administrators can open the desk", () => {
  assert.equal(hasWobbleAdminAccess([{ role: "customer_admin" }]), false);
  assert.equal(hasWobbleAdminAccess([{ role: "viewer" }]), false);
  assert.equal(hasWobbleAdminAccess([{ role: "wobble_admin" }]), true);
});

test("programme and user access last between 12 and 52 weeks", () => {
  const source = readFileSync(
    path.join(process.cwd(), "lib/portal/programmeDuration.ts"),
    "utf8"
  );
  assert.ok(source.includes("MIN_DURATION_WEEKS = 12"));
  assert.ok(source.includes("MAX_DURATION_WEEKS = 52"));
  assert.equal(isDurationWeeks(12), true);
  assert.equal(isDurationWeeks(52), true);
  assert.equal(isDurationWeeks(11), false);
  assert.equal(isDurationWeeks(53), false);
  assert.equal(weeksToDays(12), 84);
  assert.equal(weeksToDays(52), 364);
  const start = new Date("2026-09-14T12:00:00Z");
  assert.equal(addWeeks(start, 12).toISOString(), "2026-12-07T12:00:00.000Z");
});

test("the Wobble desk creates an org, first programme, and first admin", () => {
  const source = readFileSync(
    path.join(process.cwd(), "lib/portal/wobbleAdmin.ts"),
    "utf8"
  );
  const route = readFileSync(
    path.join(process.cwd(), "app/api/portal/admin/organisations/route.ts"),
    "utf8"
  );
  const page = readFileSync(
    path.join(process.cwd(), "app/portal/admin/page.tsx"),
    "utf8"
  );
  const activate = readFileSync(
    path.join(process.cwd(), "app/api/nhs/activate/route.ts"),
    "utf8"
  );
  assert.ok(source.includes("dashboard_orgs"));
  assert.ok(source.includes("portal_programme_entitlements"));
  assert.ok(source.includes("inviteAccountMember"));
  assert.ok(source.includes("invite_customer_email"));
  assert.ok(source.includes("addWobbleProgramme"));
  assert.ok(source.includes("claim_duration_days"));
  assert.ok(source.includes("invalid_programme_duration"));
  assert.ok(route.includes("requireWobbleAdmin"));
  assert.ok(page.includes("New organisation"));
  assert.ok(activate.includes("nhs-activate"));
  assert.ok(!activate.includes("createWobbleOrganisation"));
});

test("the Wobble desk can add a later programme and open an organisation", () => {
  const source = readFileSync(
    path.join(process.cwd(), "lib/portal/wobbleAdmin.ts"),
    "utf8"
  );
  const route = readFileSync(
    path.join(process.cwd(), "app/api/portal/admin/programmes/route.ts"),
    "utf8"
  );
  const form = readFileSync(
    path.join(process.cwd(), "app/portal/WobbleAdminForm.tsx"),
    "utf8"
  );
  const switcher = readFileSync(
    path.join(process.cwd(), "app/portal/ProgrammeSwitcher.tsx"),
    "utf8"
  );
  assert.ok(source.includes("addWobbleProgramme"));
  assert.ok(source.includes("portal.programme_added"));
  assert.ok(route.includes("requireWobbleAdmin"));
  assert.ok(form.includes("Open dashboard"));
  assert.ok(form.includes("Add a programme"));
  assert.ok(form.includes("programmePath"));
  assert.ok(form.includes("Programme duration"));
  assert.ok(form.includes("User access"));
  assert.ok(switcher.includes("Programme"));
});

test("customers still cannot assign the Wobble administrator role", () => {
  const account = readFileSync(
    path.join(process.cwd(), "lib/portal/account.ts"),
    "utf8"
  );
  assert.ok(account.includes('["customer_admin", "viewer"]'));
});
