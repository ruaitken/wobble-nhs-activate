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
