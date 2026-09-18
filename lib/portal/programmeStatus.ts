export type ProgrammeTier = "base" | "premium";
export type SubscriptionStatus = "trial" | "active" | "suspended" | "cancelled";

export type ProgrammeRecord = {
  campaign_id: string;
  org_id: string;
  service_name: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  dashboard_tier: ProgrammeTier;
  subscription_status: SubscriptionStatus;
};

export type ProgrammeView = ProgrammeRecord & {
  label: string;
  is_current: boolean;
  can_issue_licences: boolean;
  show_participants: boolean;
};

function parseTime(value: string | null) {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

export function isCurrentProgramme(programme: ProgrammeRecord, now = Date.now()) {
  if (!programme.is_active) return false;
  if (
    programme.subscription_status !== "active" &&
    programme.subscription_status !== "trial"
  ) {
    return false;
  }
  const endsAt = parseTime(programme.ends_at);
  if (endsAt !== null && endsAt <= now) return false;
  return true;
}

export function toProgrammeView(
  programme: ProgrammeRecord,
  now = Date.now()
): ProgrammeView {
  const isCurrent = isCurrentProgramme(programme, now);
  return {
    ...programme,
    label: programme.service_name,
    is_current: isCurrent,
    can_issue_licences: isCurrent,
    show_participants: programme.dashboard_tier === "premium",
  };
}

export function defaultCampaignId(programmes: ProgrammeView[]) {
  const current = programmes.filter((programme) => programme.is_current);
  const pool = current.length > 0 ? current : programmes;
  return [...pool].sort((a, b) => {
    const aStart = parseTime(a.starts_at) ?? 0;
    const bStart = parseTime(b.starts_at) ?? 0;
    return bStart - aStart;
  })[0]?.campaign_id;
}
