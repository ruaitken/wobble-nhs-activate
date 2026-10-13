import { createHash } from "node:crypto";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getOrgProgrammes } from "@/lib/portal/programmes";
import { OVERALL_PROGRAMME_ID } from "@/lib/portal/paths";
import { countHiddenParticipants, isNamedReportingVisible } from "@/lib/portal/participantVisibility";
import {
  assessmentsFromRows,
  averageSessionsPerWeek,
  averageWeeklyMinutes,
  latestDate,
  latestWeekMinutes,
  sessionDatesInWindow,
  sumWeeklyMinutes,
  weeklyMinutesInWindow,
  type ClaimWindow,
  type ParticipantSnapshot,
  type PortalParticipant,
} from "@/lib/portal/participantView";

export type { ParticipantSnapshot, PortalParticipant };

function displayParticipantId(userId: string) {
  return `WOB-${createHash("sha256").update(userId).digest("hex").slice(0, 6).toUpperCase()}`;
}

export async function recordParticipantsViewed({
  actorUserId,
  orgId,
  campaignId,
}: {
  actorUserId: string;
  orgId: string;
  campaignId: string | null;
}) {
  const admin = getSupabaseServer();
  await admin.from("portal_audit_events").insert({
    actor_user_id: actorUserId,
    org_id: orgId,
    campaign_id: campaignId,
    action: "portal.participants_viewed",
    details: {},
  });
}

export async function getPortalParticipants(
  campaignId: string
): Promise<ParticipantSnapshot> {
  const admin = getSupabaseServer();
  const { data: claims, error: claimError } = await admin
    .from("nhs_claims")
    .select("user_id, claimed_at, expires_at")
    .eq("campaign_id", campaignId);
  if (claimError) throw claimError;

  const userIds = (claims ?? []).map((claim) => claim.user_id).filter(Boolean);
  const windowByUser = new Map<string, ClaimWindow>(
    (claims ?? []).map((claim) => [
      claim.user_id,
      { claimedAt: claim.claimed_at ?? null, expiresAt: claim.expires_at ?? null },
    ])
  );
  if (userIds.length === 0) {
    return { campaign_id: campaignId, shown: 0, hidden: 0, participants: [] };
  }

  const [{ data: consents }, { data: metas }, { data: activity }, { data: assessmentRows }] =
    await Promise.all([
      admin
        .from("portal_reporting_consents")
        .select("user_id, consented, withdrawn_at")
        .eq("campaign_id", campaignId)
        .in("user_id", userIds),
      admin
        .from("user_meta")
        .select("user_id, first_name, last_name")
        .in("user_id", userIds),
      admin
        .from("user_data")
        .select("user_id, weekly_minutes, exercise_dates")
        .in("user_id", userIds),
      admin
        .from("assessments")
        .select(
          "user_id, assessment_type, sit_to_stand_count, balance_score, confidence_score, fall_count, created_at"
        )
        .in("user_id", userIds),
    ]);

  const consentByUser = new Map(
    (consents ?? []).map((row) => [
      row.user_id,
      { consented: Boolean(row.consented), withdrawn_at: row.withdrawn_at ?? null },
    ])
  );
  const metaByUser = new Map((metas ?? []).map((row) => [row.user_id, row]));
  const activityByUser = new Map((activity ?? []).map((row) => [row.user_id, row]));
  const assessmentsByUser = new Map<string, NonNullable<typeof assessmentRows>>();
  for (const row of assessmentRows ?? []) {
    const list = assessmentsByUser.get(row.user_id) ?? [];
    list.push(row);
    assessmentsByUser.set(row.user_id, list);
  }

  const participants: PortalParticipant[] = userIds
    .filter((userId) => isNamedReportingVisible(consentByUser.get(userId) ?? null))
    .map((userId) => {
      const meta = metaByUser.get(userId);
      const row = activityByUser.get(userId);
      const window = windowByUser.get(userId) ?? { claimedAt: null, expiresAt: null };
      const weeks = weeklyMinutesInWindow(row?.weekly_minutes, window);
      const sessions = sessionDatesInWindow(row?.exercise_dates, window);
      return {
        id: displayParticipantId(userId),
        first_name: meta?.first_name?.trim() || "Member",
        last_name: meta?.last_name?.trim() || "",
        minutes_this_week: latestWeekMinutes(weeks),
        total_minutes: sumWeeklyMinutes(weeks),
        average_weekly_minutes: averageWeeklyMinutes(weeks),
        average_sessions_per_week: averageSessionsPerWeek(sessions),
        last_session: latestDate(sessions),
        assessments: assessmentsFromRows(assessmentsByUser.get(userId) ?? [], window),
      };
    })
    .sort((a, b) => {
      const sessions = b.average_sessions_per_week - a.average_sessions_per_week;
      if (sessions !== 0) return sessions;
      const last = a.last_name.localeCompare(b.last_name);
      return last !== 0 ? last : a.first_name.localeCompare(b.first_name);
    });

  return {
    campaign_id: campaignId,
    shown: participants.length,
    hidden: countHiddenParticipants(userIds.length, participants.length),
    participants,
  };
}

export async function getPortalOrgParticipants(orgId: string): Promise<ParticipantSnapshot> {
  const programmes = await getOrgProgrammes(orgId);
  const nameByCampaign = new Map(
    programmes.map((programme) => [programme.campaign_id, programme.service_name])
  );
  const campaignIds = programmes.map((programme) => programme.campaign_id);
  if (campaignIds.length === 0) {
    return {
      campaign_id: OVERALL_PROGRAMME_ID,
      shown: 0,
      hidden: 0,
      participants: [],
    };
  }

  const admin = getSupabaseServer();
  const { data: claims, error: claimError } = await admin
    .from("nhs_claims")
    .select("user_id, campaign_id, claimed_at, expires_at")
    .in("campaign_id", campaignIds);
  if (claimError) throw claimError;

  const rows = (claims ?? []).filter((claim) => claim.user_id && claim.campaign_id);
  if (rows.length === 0) {
    return {
      campaign_id: OVERALL_PROGRAMME_ID,
      shown: 0,
      hidden: 0,
      participants: [],
    };
  }

  const userIds = [...new Set(rows.map((claim) => claim.user_id))];
  const [{ data: consents }, { data: metas }, { data: activity }, { data: assessmentRows }] =
    await Promise.all([
      admin
        .from("portal_reporting_consents")
        .select("user_id, campaign_id, consented, withdrawn_at")
        .in("campaign_id", campaignIds)
        .in("user_id", userIds),
      admin
        .from("user_meta")
        .select("user_id, first_name, last_name")
        .in("user_id", userIds),
      admin
        .from("user_data")
        .select("user_id, weekly_minutes, exercise_dates")
        .in("user_id", userIds),
      admin
        .from("assessments")
        .select(
          "user_id, assessment_type, sit_to_stand_count, balance_score, confidence_score, fall_count, created_at"
        )
        .in("user_id", userIds),
    ]);

  const consentByPlace = new Map(
    (consents ?? []).map((row) => [
      `${row.user_id}:${row.campaign_id}`,
      { consented: Boolean(row.consented), withdrawn_at: row.withdrawn_at ?? null },
    ])
  );
  const metaByUser = new Map((metas ?? []).map((row) => [row.user_id, row]));
  const activityByUser = new Map((activity ?? []).map((row) => [row.user_id, row]));
  const assessmentsByUser = new Map<string, NonNullable<typeof assessmentRows>>();
  for (const row of assessmentRows ?? []) {
    const list = assessmentsByUser.get(row.user_id) ?? [];
    list.push(row);
    assessmentsByUser.set(row.user_id, list);
  }

  const participants: PortalParticipant[] = rows
    .filter((claim) =>
      isNamedReportingVisible(consentByPlace.get(`${claim.user_id}:${claim.campaign_id}`) ?? null)
    )
    .map((claim) => {
      const meta = metaByUser.get(claim.user_id);
      const row = activityByUser.get(claim.user_id);
      const window = {
        claimedAt: claim.claimed_at ?? null,
        expiresAt: claim.expires_at ?? null,
      };
      const weeks = weeklyMinutesInWindow(row?.weekly_minutes, window);
      const sessions = sessionDatesInWindow(row?.exercise_dates, window);
      const code = displayParticipantId(claim.user_id);
      return {
        id: `${code}:${claim.campaign_id}`,
        code,
        programme_name: nameByCampaign.get(claim.campaign_id) ?? claim.campaign_id,
        first_name: meta?.first_name?.trim() || "Member",
        last_name: meta?.last_name?.trim() || "",
        minutes_this_week: latestWeekMinutes(weeks),
        total_minutes: sumWeeklyMinutes(weeks),
        average_weekly_minutes: averageWeeklyMinutes(weeks),
        average_sessions_per_week: averageSessionsPerWeek(sessions),
        last_session: latestDate(sessions),
        assessments: assessmentsFromRows(assessmentsByUser.get(claim.user_id) ?? [], window),
      };
    })
    .sort((a, b) => {
      const sessions = b.average_sessions_per_week - a.average_sessions_per_week;
      if (sessions !== 0) return sessions;
      const last = a.last_name.localeCompare(b.last_name);
      if (last !== 0) return last;
      const first = a.first_name.localeCompare(b.first_name);
      return first !== 0 ? first : (a.programme_name ?? "").localeCompare(b.programme_name ?? "");
    });

  return {
    campaign_id: OVERALL_PROGRAMME_ID,
    shown: participants.length,
    hidden: countHiddenParticipants(rows.length, participants.length),
    participants,
  };
}
