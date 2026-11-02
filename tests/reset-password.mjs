import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

function source(relativePath) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("opening the reset page does not use the link", () => {
  const page = source("app/reset-password/page.tsx");
  const route = source("app/api/auth/reset-password/route.ts");
  assert.equal(page.includes("verifyOtp"), false);
  assert.equal(page.includes("updateUser"), false);
  assert.ok(page.includes('method="post"'));
  assert.ok(page.includes('action="/api/auth/reset-password"'));
  assert.ok(page.includes("Opening this page does not change your password."));
  assert.ok(route.includes("export async function POST"));
  assert.equal(route.includes("export async function GET"), false);
  assert.ok(route.includes('type: "recovery"'));
  assert.ok(route.includes("verifyOtp"));
  assert.ok(route.includes("updateUser"));
  assert.ok(route.includes('scope: "global"'));
});

test("the reset email uses a page link, not Supabase's one-click link", () => {
  const helper = source("lib/auth/resetPassword.ts");
  assert.ok(helper.includes('RESET_PASSWORD_PATH = "/reset-password"'));
  assert.ok(helper.includes("?token_hash={{ .TokenHash }}&type=recovery"));
  assert.ok(helper.includes("wobble-account-activate-9i2r.vercel.app"));
  assert.equal(helper.includes(".ConfirmationURL"), false);
  assert.ok(helper.includes("Opening this email is not enough."));
  assert.equal(helper.includes("auth/v1/verify"), false);
});

test("a short or mismatched password is rejected before the link is used", () => {
  const route = source("app/api/auth/reset-password/route.ts");
  const helper = source("lib/auth/resetPassword.ts");
  const problemFirst = route.indexOf("passwordResetProblem");
  const verifyAt = route.indexOf("verifyOtp");
  assert.ok(problemFirst > -1);
  assert.ok(verifyAt > problemFirst);
  assert.ok(helper.includes("password.length < 8"));
  assert.ok(helper.includes('return "mismatch"'));
});
