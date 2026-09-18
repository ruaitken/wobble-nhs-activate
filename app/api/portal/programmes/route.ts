import { NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal/session";
import { hasOrgAccess } from "@/lib/portal/membership";
import { getOrgProgrammes, pickDefaultCampaignId } from "@/lib/portal/programmes";

export async function GET(request: Request) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  }

  const orgId = new URL(request.url).searchParams.get("org_id");
  if (!orgId) {
    return NextResponse.json({ ok: false, reason: "missing_org_id" }, { status: 400 });
  }
  if (!hasOrgAccess(session.memberships, orgId)) {
    return NextResponse.json({ ok: false, reason: "forbidden_org" }, { status: 403 });
  }

  const programmes = await getOrgProgrammes(orgId);
  const membership = session.memberships.find((item) => item.org_id === orgId);

  return NextResponse.json({
    ok: true,
    org: {
      org_id: orgId,
      org_name: membership?.org_name ?? orgId,
      role: membership?.role ?? "viewer",
    },
    default_campaign_id: pickDefaultCampaignId(programmes),
    programmes,
  });
}
