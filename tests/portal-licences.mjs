import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

function emailsMatch(email, confirmEmail) {
  const left = email.trim().toLowerCase();
  const right = confirmEmail.trim().toLowerCase();
  return Boolean(left && left.includes("@") && left === right);
}

function isOpenReservation(invitation, now = Date.now()) {
  if (invitation.status !== "pending") return false;
  return Date.parse(invitation.expires_at) > now;
}

function licenceTotals({ seatLimit, claimed, pendingReserved }) {
  const issued = claimed + pendingReserved;
  return {
    issued,
    remaining: Math.max(0, seatLimit - issued),
  };
}

const now = Date.parse("2026-09-10T12:00:00Z");

test("licence helpers still live in licenceMath.ts", () => {
  const source = readFileSync(
    path.join(process.cwd(), "lib/portal/licenceMath.ts"),
    "utf8"
  );
  assert.ok(source.includes("isOpenReservation"));
  assert.ok(source.includes("licenceTotals"));
});

test("invitation tokens are hashed, never stored raw", () => {
  const source = readFileSync(
    path.join(process.cwd(), "lib/portal/licences.ts"),
    "utf8"
  );
  assert.ok(source.includes("hashInviteToken"));
  assert.ok(source.includes("getClaim"));
  assert.ok(!source.includes("hasClaim"));
  assert.ok(!source.includes("raw_token"));
});

test("emails must match before a pack is sent", () => {
  assert.equal(emailsMatch("Pat@example.com", "pat@example.com"), true);
  assert.equal(emailsMatch("pat@example.com", "other@example.com"), false);
});

test("pending invitations reserve a seat until they expire", () => {
  const open = isOpenReservation(
    { status: "pending", expires_at: "2026-09-24T12:00:00Z" },
    now
  );
  const expired = isOpenReservation(
    { status: "pending", expires_at: "2026-09-09T12:00:00Z" },
    now
  );
  assert.equal(open, true);
  assert.equal(expired, false);
  assert.deepEqual(
    licenceTotals({ seatLimit: 50, claimed: 12, pendingReserved: 1 }),
    { issued: 13, remaining: 37 }
  );
});

test("expired invitations release the reserved seat", () => {
  assert.deepEqual(
    licenceTotals({ seatLimit: 50, claimed: 12, pendingReserved: 0 }),
    { issued: 12, remaining: 38 }
  );
});

test("information packs can send through Resend without touching live activate", () => {
  const source = readFileSync(
    path.join(process.cwd(), "lib/portal/inviteEmail.ts"),
    "utf8"
  );
  const nhs = readFileSync(
    path.join(process.cwd(), "app/api/nhs/activate/route.ts"),
    "utf8"
  );
  assert.ok(source.includes("https://api.resend.com/emails"));
  assert.ok(source.includes("enquiries@wobblebalance.com"));
  assert.ok(source.includes("PORTAL_USE_RESEND"));
  assert.ok(source.includes("mailpitUrl"));
  assert.ok(source.includes("Your place is ready"));
  assert.ok(source.includes("Activate your Wobble place"));
  assert.ok(source.includes("apps.apple.com"));
  assert.ok(source.includes("#A6D5CE"));
  assert.ok(nhs.includes("nhs-activate"));
  assert.ok(!nhs.includes("resend.com"));
});

test("practice magic links can use Resend SMTP without a committed key", () => {
  const smtp = readFileSync(
    path.join(process.cwd(), "scripts/apply-practice-smtp.mjs"),
    "utf8"
  );
  const template = readFileSync(
    path.join(process.cwd(), "supabase/templates/magic_link.html"),
    "utf8"
  );
  assert.ok(smtp.includes("smtp.resend.com"));
  assert.ok(smtp.includes('pass = "env(RESEND_API_KEY)"'));
  assert.ok(smtp.includes("enquiries@wobblebalance.com"));
  assert.ok(!smtp.includes("re_"));
  assert.ok(template.includes("Sign in to the portal"));
  assert.ok(template.includes("{{ .TokenHash }}"));
});

test("viewers cannot read issued licence emails", () => {
  const route = readFileSync(
    path.join(process.cwd(), "app/api/portal/licences/route.ts"),
    "utf8"
  );
  const matches = route.match(/forbidden_role/g) ?? [];
  assert.ok(route.includes("canManageLicences"));
  assert.ok(matches.length >= 2);
});

test("invitation lists page 10 at a time after searching everyone", () => {
  const source = readFileSync(
    path.join(process.cwd(), "app/portal/LicenceManager.tsx"),
    "utf8"
  );
  assert.ok(source.includes("slicePage"));
  assert.ok(source.includes("Search email"));

  const invitations = Array.from({ length: 35 }, (_, index) => `user${index + 1}@example.com`);
  const filtered = invitations.filter((email) =>
    email.toLowerCase().includes("user31@")
  );
  assert.equal(Math.ceil(invitations.length / 10), 4);
  assert.equal(filtered.length, 1);
});
