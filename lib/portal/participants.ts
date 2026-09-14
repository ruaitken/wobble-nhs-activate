import { createHash } from "node:crypto";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { countHiddenParticipants, isNamedReportingVisible } from "@/lib/portal/participantVisibility";
import {
  assessmentsFromRows,
  averageSessionsPerWeek,
  averageWeeklyMinutes,
  latestDate,
  latestWeekMinutes,
  sumWeeklyMinutes,
  type ParticipantSnapshot,
  type PortalParticipant,
} from "@/lib/portal/participantView";

export type { ParticipantSnapshot, PortalParticipant };

function displayParticipantId(userId: string) {
  return `WOB-${createHash("sha256").update(userId).digest("hex").slice(0, 6).toUpperCase()}`;
}

export async function getPortalParticipants(
  campaignId: string
): Promise<ParticipantSnapshot> {
  const admin = getSupabaseServer();
  const { data: claims, error: claimError } = await admin
    .from("nhs_claims")
    .select("user_id")
    .eq("campaign_id", campaignId);
  if (claimError) throw claimError;

  const userIds = (claims ?? []).map((claim) => claim.user_id).filter(Boolean);
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
      return {
        id: displayParticipantId(userId),
        first_name: meta?.first_name?.trim() || "Member",
        last_name: meta?.last_name?.trim() || "",
        minutes_this_week: latestWeekMinutes(row?.weekly_minutes),
        total_minutes: sumWeeklyMinutes(row?.weekly_minutes),
        average_weekly_minutes: averageWeeklyMinutes(row?.weekly_minutes),
        average_sessions_per_week: averageSessionsPerWeek(row?.exercise_dates),
        last_session: latestDate(row?.exercise_dates),
        assessments: assessmentsFromRows(assessmentsByUser.get(userId) ?? []),
      };
    })
    .sort((a, b) => {
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
