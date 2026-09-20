import { NextResponse } from "next/server";
import { jsonError, requireProgrammeAccess, requireSatisfiedMfa } from "@/lib/portal/access";
import {
  getPortalParticipants,
  recordParticipantsViewed,
} from "@/lib/portal/participants";
import { canViewNamedParticipants } from "@/lib/portal/roles";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const orgId = url.searchParams.get("org_id");
    const campaignId = url.searchParams.get("campaign_id");
    if (!orgId || !campaignId) {
      return NextResponse.json({ ok: false, reason: "missing_ids" }, { status: 400 });
    }

    const { session, programme } = await requireProgrammeAccess(orgId, campaignId);
    const membership = session.memberships.find((item) => item.org_id === orgId);
    if (!canViewNamedParticipants(membership?.role)) {
      return NextResponse.json({ ok: false, reason: "forbidden_role" }, { status: 403 });
    }
    requireSatisfiedMfa(session);
    if (!programme.show_participants) {
      return NextResponse.json({ ok: false, reason: "premium_required" }, { status: 403 });
    }

    await recordParticipantsViewed({
      actorUserId: session.userId,
      orgId,
      campaignId: programme.campaign_id,
    });
    const snapshot = await getPortalParticipants(programme.campaign_id);
    return NextResponse.json({ ok: true, ...snapshot });
  } catch (error) {
    const mapped = jsonError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
