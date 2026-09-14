import { NextResponse } from "next/server";
import { jsonError, requireProgrammeAccess } from "@/lib/portal/access";
import { getPortalParticipants } from "@/lib/portal/participants";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const orgId = url.searchParams.get("org_id");
    const campaignId = url.searchParams.get("campaign_id");
    if (!orgId || !campaignId) {
      return NextResponse.json({ ok: false, reason: "missing_ids" }, { status: 400 });
    }

    const { programme } = await requireProgrammeAccess(orgId, campaignId);
    if (!programme.show_participants) {
      return NextResponse.json({ ok: false, reason: "premium_required" }, { status: 403 });
    }

    const snapshot = await getPortalParticipants(programme.campaign_id);
    return NextResponse.json({ ok: true, ...snapshot });
  } catch (error) {
    const mapped = jsonError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
