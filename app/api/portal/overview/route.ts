import { NextResponse } from "next/server";
import { PortalAccessError, requireProgrammeAccess } from "@/lib/portal/access";
import { getPortalCampaignStats } from "@/lib/portal/overview";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const orgId = url.searchParams.get("org_id");
    const campaignId = url.searchParams.get("campaign_id");
    if (!orgId || !campaignId) {
      return NextResponse.json({ ok: false, reason: "missing_ids" }, { status: 400 });
    }

    await requireProgrammeAccess(orgId, campaignId);
    const stats = await getPortalCampaignStats(campaignId);
    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    if (error instanceof PortalAccessError) {
      return NextResponse.json({ ok: false, reason: error.reason }, { status: error.status });
    }
    if (error instanceof Error && error.message === "aggregate_contains_personal_data") {
      return NextResponse.json({ ok: false, reason: "unsafe_payload" }, { status: 500 });
    }
    return NextResponse.json({ ok: false, reason: "stats_error" }, { status: 500 });
  }
}
