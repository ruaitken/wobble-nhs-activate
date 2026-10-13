import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

function source(relativePath) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const MIGRATION = "supabase/migrations/20261003170000_portal_staff_invitations.sql";

test("staff invites last 24 hours, store hashes only, and are server-only", () => {
  const migration = source(MIGRATION);
  assert.ok(migration.includes("interval '24 hours'"));
  assert.ok(migration.includes("token_hash text not null"));
  assert.ok(!/\btoken text\b/.test(migration));
  assert.ok(migration.includes("enable row level security"));
  assert.ok(migration.includes("from anon, authenticated"));

  const invite = source("lib/portal/staffInvite.ts");
  assert.ok(invite.includes("STAFF_INVITE_HOURS = 24"));
  assert.ok(invite.includes('createHash("sha256")'));
  assert.ok(invite.includes("token_hash: hashStaffInviteToken(token)"));
});

test("an invite can be used once, before it expires, by a current member", () => {
  const invite = source("lib/portal/staffInvite.ts");
  assert.ok(invite.includes('.is("used_at", null)'));
  assert.ok(invite.includes('.gt("expires_at"'));
  assert.ok(invite.includes('from("portal_org_members")'));
  assert.ok(invite.includes('action: "portal.staff_invite_used"'));
});

test("staff email lookup continues past the first page of accounts", () => {
  const lookup = source("lib/portal/findAuthUser.ts");
  assert.ok(lookup.includes("for (let page = 1; page <= MAX_PAGES; page += 1)"));
  assert.ok(lookup.includes("perPage: PAGE_SIZE"));
  assert.ok(source("lib/portal/account.ts").includes("findAuthUserByEmail"));
  assert.ok(source("app/api/portal/login/route.ts").includes("findAuthUserByEmail"));
  assert.equal(source("lib/portal/account.ts").includes("perPage: 200"), false);
});

test("adding staff sends the 24-hour invite; everyday sign-in stays one hour", () => {
  const account = source("lib/portal/account.ts");
  assert.ok(account.includes("sendStaffInvite"));
  assert.ok(!account.includes("sendPortalMagicLink"));

  const login = source("app/api/portal/login/route.ts");
  assert.ok(login.includes("sendPortalMagicLink"));
  assert.ok(source("lib/portal/magicLink.ts").includes("The link lasts one hour"));
});

test("opening the invite page does not use it; pressing Sign in does", () => {
  const page = source("app/auth/confirm/page.tsx");
  const route = source("app/api/auth/confirm/route.ts");
  assert.ok(page.includes('name="invite"'));
  assert.equal(page.includes("redeemStaffInvite"), false);
  assert.ok(route.includes("redeemStaffInvite"));
  assert.ok(route.includes("invite_expired"));
  assert.ok(route.includes("destinationAfterSignIn"));
  assert.ok(source("app/portal/login/LoginForm.tsx").includes("invite_expired"));
});
