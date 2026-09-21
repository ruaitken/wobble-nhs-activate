import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

function isCurrentProgramme(programme, now = Date.now()) {
  if (!programme.is_active) return false;
  if (
    programme.subscription_status !== "active" &&
    programme.subscription_status !== "trial"
  ) {
    return false;
  }
  if (programme.ends_at && Date.parse(programme.ends_at) <= now) return false;
  return true;
}

function toProgrammeView(programme, now = Date.now()) {
  const isCurrent = isCurrentProgramme(programme, now);
  return {
    ...programme,
    is_current: isCurrent,
    can_issue_licences: isCurrent,
    show_participants: programme.dashboard_tier === "premium",
  };
}

function defaultCampaignId(programmes) {
  const current = programmes.filter((programme) => programme.is_current);
  const pool = current.length > 0 ? current : programmes;
  return [...pool].sort(
    (a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at)
  )[0]?.campaign_id;
}

const now = Date.parse("2026-09-10T12:00:00Z");

const falls = toProgrammeView(
  {
    campaign_id: "PRACTICE_FALLS_2026",
    dashboard_tier: "premium",
    subscription_status: "active",
    is_active: true,
    starts_at: "2026-06-12T00:00:00Z",
    ends_at: "2027-06-07T00:00:00Z",
  },
  now
);
const nn4 = toProgrammeView(
  {
    campaign_id: "PRACTICE_NN4_2026",
    dashboard_tier: "base",
    subscription_status: "active",
    is_active: true,
    starts_at: "2026-07-12T00:00:00Z",
    ends_at: "2027-07-07T00:00:00Z",
  },
  now
);
const historical = toProgrammeView(
  {
    campaign_id: "PRACTICE_FALLS_2025",
    dashboard_tier: "premium",
    subscription_status: "cancelled",
    is_active: false,
    starts_at: "2025-04-28T00:00:00Z",
    ends_at: "2026-04-23T00:00:00Z",
  },
  now
);

test("shell rules still live in programmeStatus.ts", () => {
  const source = readFileSync(
    path.join(process.cwd(), "lib/portal/programmeStatus.ts"),
    "utf8"
  );
  assert.ok(source.includes("can_issue_licences"));
  assert.ok(source.includes('dashboard_tier === "premium"'));
});

test("switching context prefers the latest current programme", () => {
  assert.equal(defaultCampaignId([falls, nn4, historical]), "PRACTICE_NN4_2026");
});

test("base programmes do not expose participants", () => {
  assert.equal(nn4.show_participants, false);
  assert.equal(falls.show_participants, true);
});

test("viewers only see Overview in the portal shell", () => {
  const shell = readFileSync(
    path.join(process.cwd(), "app/portal/PortalShell.tsx"),
    "utf8"
  );
  assert.ok(shell.includes("canViewOrgOperations"));
  assert.ok(shell.includes("canOperate && selected.show_participants"));
  assert.ok(shell.includes("canOperate ? ("));
});

test("archived programmes cannot issue licences", () => {
  assert.equal(historical.can_issue_licences, false);
  assert.equal(historical.is_current, false);
  assert.equal(falls.can_issue_licences, true);
});

test("tab changes show a pane spinner, not a full-page freeze", () => {
  const loading = readFileSync(
    path.join(
      process.cwd(),
      "app/portal/[orgId]/[campaignId]/loading.tsx"
    ),
    "utf8"
  );
  const pane = readFileSync(
    path.join(process.cwd(), "app/portal/PortalPaneLoading.tsx"),
    "utf8"
  );
  const layout = readFileSync(
    path.join(process.cwd(), "app/portal/[orgId]/[campaignId]/layout.tsx"),
    "utf8"
  );

  assert.ok(loading.includes("PortalPaneLoading"));
  assert.ok(pane.includes("Loading…"));
  assert.ok(pane.includes("role=\"status\""));
  assert.equal(pane.includes("min-h-screen"), false);
  assert.ok(layout.includes("PortalShell"));
});

test("overview sits on the teal page, not inside a cream card", () => {
  const shell = readFileSync(
    path.join(process.cwd(), "app/portal/PortalShell.tsx"),
    "utf8"
  );
  const header = readFileSync(
    path.join(process.cwd(), "app/portal/PortalMainHeader.tsx"),
    "utf8"
  );
  const dashboard = readFileSync(
    path.join(process.cwd(), "app/dashboard/[token]/DashboardClient.tsx"),
    "utf8"
  );

  assert.equal(shell.includes('src="/wobble-logo.svg"'), false);
  assert.ok(header.includes('src="/wobble-logo.svg"'));
  assert.ok(header.includes("Wobble impact dashboard"));
  assert.equal(shell.includes("rounded-2xl bg-[#F9F5EF] p-6"), false);
  assert.ok(dashboard.includes("bg-[#E7B450]/40"));
});
