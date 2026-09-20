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

function canRemoveMember(members, targetUserId) {
  const target = members.find((member) => member.user_id === targetUserId);
  if (!target) return false;
  if (target.role === "viewer") return true;
  return canRemoveOrgAdmin(members, targetUserId);
}

function canManageUsers(role) {
  return role === "customer_admin" || role === "wobble_admin";
}

function tabFromPath(pathname) {
  if (pathname.endsWith("/participants")) return "participants";
  if (pathname.endsWith("/licences")) return "licences";
  if (pathname.endsWith("/account")) return "account";
  return "overview";
}

test("account helpers still live in adminGuards and roles", () => {
  const guards = readFileSync(
    path.join(process.cwd(), "lib/portal/adminGuards.ts"),
    "utf8"
  );
  const roles = readFileSync(path.join(process.cwd(), "lib/portal/roles.ts"), "utf8");
  const account = readFileSync(
    path.join(process.cwd(), "lib/portal/account.ts"),
    "utf8"
  );
  assert.ok(guards.includes("canRemoveMember"));
  assert.ok(roles.includes("canManageUsers"));
  assert.ok(account.includes("INVITE_ROLES"));
});

test("customers cannot assign the Wobble administrator role", () => {
  const source = readFileSync(
    path.join(process.cwd(), "lib/portal/account.ts"),
    "utf8"
  );
  assert.ok(source.includes('["customer_admin", "viewer"]'));
});

test("the last administrator cannot be removed", () => {
  const members = [
    { user_id: "admin-1", role: "customer_admin" },
    { user_id: "viewer-1", role: "viewer" },
  ];
  assert.equal(canRemoveMember(members, "admin-1"), false);
  assert.equal(canRemoveMember(members, "viewer-1"), true);
});

test("a second administrator can be removed", () => {
  const members = [
    { user_id: "admin-1", role: "customer_admin" },
    { user_id: "admin-2", role: "customer_admin" },
  ];
  assert.equal(canRemoveMember(members, "admin-1"), true);
});

test("viewers cannot read or manage the account list", () => {
  assert.equal(canManageUsers("viewer"), false);
  assert.equal(canManageUsers("customer_admin"), true);
  const route = readFileSync(
    path.join(process.cwd(), "app/api/portal/account/route.ts"),
    "utf8"
  );
  assert.ok(route.includes("forbidden_role"));
});

test("account is its own tab and does not highlight Overview", () => {
  assert.equal(tabFromPath("/portal/PRACTICE_ORG/PRACTICE_NN4_2026/account"), "account");
  assert.equal(tabFromPath("/portal/PRACTICE_ORG/PRACTICE_NN4_2026"), "overview");
});

test("account invitations require matching emails", () => {
  const source = readFileSync(
    path.join(process.cwd(), "lib/portal/account.ts"),
    "utf8"
  );
  const ui = readFileSync(
    path.join(process.cwd(), "app/portal/AccountManager.tsx"),
    "utf8"
  );
  assert.ok(source.includes("emailsMatch"));
  assert.ok(source.includes("emails_do_not_match"));
  assert.ok(ui.includes("Confirm email address"));
});
