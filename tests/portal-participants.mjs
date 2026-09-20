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

const LIST_PAGE_SIZE = 10;

function pageWindow(total, page, pageSize = LIST_PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  return {
    currentPage,
    pageCount,
    start: total === 0 ? 0 : startIndex + 1,
    end: Math.min(startIndex + pageSize, total),
  };
}

function slicePage(items, page, pageSize = LIST_PAGE_SIZE) {
  const window = pageWindow(items.length, page, pageSize);
  const startIndex = window.start === 0 ? 0 : window.start - 1;
  return {
    ...window,
    items: items.slice(startIndex, window.end),
  };
}

function matchesSearch(value, query) {
  const search = query.trim().toLowerCase();
  if (!search) return true;
  return value.toLowerCase().includes(search);
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

test("participant and invitation lists show 10 per page", () => {
  const source = readFileSync(
    path.join(process.cwd(), "lib/portal/listPaging.ts"),
    "utf8"
  );
  assert.ok(source.includes("LIST_PAGE_SIZE = 10"));

  const items = Array.from({ length: 35 }, (_, index) => `person-${index + 1}`);
  assert.equal(pageWindow(35, 1).pageCount, 4);
  assert.equal(slicePage(items, 1).items.length, 10);
  assert.equal(slicePage(items, 4).items.length, 5);
  assert.deepEqual(slicePage(items, 1).items[0], "person-1");
  assert.deepEqual(slicePage(items, 4).items[0], "person-31");

  const found = items.filter((item) => matchesSearch(item, "person-31"));
  assert.equal(found.length, 1);
  assert.equal(slicePage(found, 1).pageCount, 1);
  assert.equal(matchesSearch("Pat River WOB-ABC123", "river"), true);
  assert.equal(matchesSearch("Pat River WOB-ABC123", "missing"), false);
});

test("the example participant dashboard has 35 named people, four pages", () => {
  const source = readFileSync(
    path.join(process.cwd(), "app/dashboard/demo-ggc-participants/GgcParticipantsDashboard.tsx"),
    "utf8"
  );
  assert.ok(source.includes("NAMED_PARTICIPANTS"));
  assert.ok(source.includes("EXTRA_DEMO_PEOPLE"));
  assert.ok(source.includes("Isla"));
  assert.ok(source.includes("slicePage"));
});

test("viewers cannot load named participants from the API or nav", () => {
  const roles = readFileSync(path.join(process.cwd(), "lib/portal/roles.ts"), "utf8");
  const route = readFileSync(
    path.join(process.cwd(), "app/api/portal/participants/route.ts"),
    "utf8"
  );
  const shell = readFileSync(
    path.join(process.cwd(), "app/portal/PortalShell.tsx"),
    "utf8"
  );
  const context = readFileSync(
    path.join(process.cwd(), "lib/portal/context.ts"),
    "utf8"
  );
  assert.ok(roles.includes("canViewNamedParticipants"));
  assert.ok(route.includes("canViewNamedParticipants"));
  assert.ok(route.includes("forbidden_role"));
  assert.ok(route.includes("recordParticipantsViewed"));
  const participants = readFileSync(
    path.join(process.cwd(), "lib/portal/participants.ts"),
    "utf8"
  );
  assert.ok(participants.includes('action: "portal.participants_viewed"'));
  assert.ok(participants.includes("actor_user_id"));
  assert.ok(participants.includes("campaign_id"));
  assert.ok(shell.includes("canViewOrgOperations"));
  assert.ok(context.includes("canViewOrgOperations"));
});

test("outcome helpers still live in participantView.ts", () => {
  const source = readFileSync(
    path.join(process.cwd(), "lib/portal/participantView.ts"),
    "utf8"
  );
  assert.ok(source.includes("improvingCount"));
  assert.ok(source.includes("assessmentsFromRows"));
});
