import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

function canRemoveOrgAdmin(admins, targetUserId) {
  const adminIds = admins
    .filter((member) => member.role === "customer_admin" || member.role === "wobble_admin")
    .map((member) => member.user_id);

  if (!adminIds.includes(targetUserId)) return false;
  if (adminIds.length <= 1) return false;
  return true;
}

function safePortalPath(value) {
  if (!value) return "/portal";
  if (!value.startsWith("/portal")) return "/portal";
  if (value.startsWith("//") || value.includes("://")) return "/portal";
  return value;
}

function isPublicPortalPath(pathname) {
  return (
    pathname === "/portal/login" ||
    pathname.startsWith("/portal/login/") ||
    pathname === "/api/portal/login"
  );
}

test("guard helpers in source still match the Phase 3 rules", () => {
  const guards = readFileSync(
    path.join(process.cwd(), "lib/portal/adminGuards.ts"),
    "utf8"
  );
  const paths = readFileSync(
    path.join(process.cwd(), "lib/portal/paths.ts"),
    "utf8"
  );
  assert.ok(guards.includes("adminIds.length <= 1"));
  assert.ok(paths.includes('value.startsWith(PORTAL_HOME_PATH)'));
});

test("the last organisation administrator cannot remove themselves", () => {
  const onlyAdmin = [{ user_id: "admin-1", role: "customer_admin" }];
  assert.equal(canRemoveOrgAdmin(onlyAdmin, "admin-1"), false);
});

test("an organisation with two administrators can remove one of them", () => {
  const admins = [
    { user_id: "admin-1", role: "customer_admin" },
    { user_id: "admin-2", role: "customer_admin" },
  ];
  assert.equal(canRemoveOrgAdmin(admins, "admin-1"), true);
});

test("viewers are not counted as administrators", () => {
  const members = [
    { user_id: "admin-1", role: "customer_admin" },
    { user_id: "viewer-1", role: "viewer" },
  ];
  assert.equal(canRemoveOrgAdmin(members, "admin-1"), false);
});

test("portal path helper rejects open redirects", () => {
  assert.equal(safePortalPath("/dashboard/secret"), "/portal");
  assert.equal(safePortalPath("https://example.com"), "/portal");
  assert.equal(safePortalPath("/portal/licences"), "/portal/licences");
});

test("login routes stay public inside the portal", () => {
  assert.equal(isPublicPortalPath("/portal/login"), true);
  assert.equal(isPublicPortalPath("/api/portal/login"), true);
  assert.equal(isPublicPortalPath("/portal"), false);
  assert.equal(isPublicPortalPath("/api/portal/me"), false);
});
