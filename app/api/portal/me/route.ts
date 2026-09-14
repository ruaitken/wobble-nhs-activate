import { NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal/session";
import { hasOrgAccess } from "@/lib/portal/membership";

export async function GET(request: Request) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  }

  const orgId = new URL(request.url).searchParams.get("org_id");
  if (orgId && !hasOrgAccess(session.memberships, orgId)) {
    return NextResponse.json({ ok: false, reason: "forbidden_org" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    email: session.email,
    memberships: session.memberships,
  });
}
