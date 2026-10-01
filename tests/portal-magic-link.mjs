import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

function source(relativePath) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("portal sign-in email does not use the single-use Supabase link", () => {
  const magicLink = source("lib/portal/magicLink.ts");
  assert.ok(magicLink.includes("generateLink"));
  assert.ok(magicLink.includes("hashed_token"));
  assert.ok(magicLink.includes('new URL("/auth/confirm"'));
  assert.equal(magicLink.includes("signInWithOtp"), false);
  assert.ok(magicLink.includes("unsafe_confirm_url"));
  assert.ok(magicLink.includes("Opening the email is not enough"));
  assert.ok(magicLink.includes("If the link has run out"));
  assert.ok(magicLink.includes("PORTAL_LOGIN_PATH"));
});

test("an expired link sends people back to request a new one", () => {
  const form = source("app/portal/login/LoginForm.tsx");
  assert.ok(form.includes("has expired or has already been used"));
  assert.ok(form.includes("Enter your email below to get a new one"));
});

test("opening the confirm page does not check the token", () => {
  const page = source("app/auth/confirm/page.tsx");
  const route = source("app/api/auth/confirm/route.ts");
  assert.equal(page.includes("verifyOtp"), false);
  assert.equal(page.includes("generateLink"), false);
  assert.ok(page.includes('method="post"'));
  assert.ok(page.includes('action="/api/auth/confirm"'));
  assert.ok(route.includes("export async function POST"));
  assert.equal(route.includes("export async function GET"), false);
  assert.ok(route.includes("verifyOtp"));
});

test("a callback page load does not check a token hash", () => {
  const callback = source("app/auth/callback/route.ts");
  assert.equal(callback.includes("verifyOtp"), false);
  assert.ok(callback.includes('new URL("/auth/confirm"'));
  assert.ok(callback.includes("token_hash"));
});
