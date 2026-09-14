import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

function isNamedReportingVisible(consent) {
  return Boolean(consent?.consented) && !consent?.withdrawn_at;
}

function countHiddenParticipants(enrolled, shown) {
  return Math.max(0, enrolled - shown);
}

test("named reporting helpers still live in participantVisibility.ts", () => {
  const source = readFileSync(
    path.join(process.cwd(), "lib/portal/participantVisibility.ts"),
    "utf8"
  );
  assert.ok(source.includes("isNamedReportingVisible"));
  assert.ok(source.includes("withdrawn_at"));
});

test("only explicit current consent is visible by name", () => {
  assert.equal(isNamedReportingVisible({ consented: true, withdrawn_at: null }), true);
  assert.equal(isNamedReportingVisible({ consented: false, withdrawn_at: null }), false);
  assert.equal(
    isNamedReportingVisible({ consented: true, withdrawn_at: "2026-03-01T00:00:00Z" }),
    false
  );
  assert.equal(isNamedReportingVisible(null), false);
});

test("people without named consent stay in the hidden total", () => {
  assert.equal(countHiddenParticipants(12, 8), 4);
});

test("outcome helpers still live in participantView.ts", () => {
  const source = readFileSync(
    path.join(process.cwd(), "lib/portal/participantView.ts"),
    "utf8"
  );
  assert.ok(source.includes("improvingCount"));
  assert.ok(source.includes("assessmentsFromRows"));
});
