import { NextResponse } from "next/server";
import { jsonError, requireProgrammeAccess, requireSatisfiedMfa } from "@/lib/portal/access";
import { canManageLicences } from "@/lib/portal/roles";
import { getLicenceSnapshot, issueLicence, LicenceError } from "@/lib/portal/licences";

function idsFrom(request: Request, body?: { org_id?: string; campaign_id?: string }) {
  const url = new URL(request.url);
  const orgId = body?.org_id ?? url.searchParams.get("org_id") ?? "";
  const campaignId = body?.campaign_id ?? url.searchParams.get("campaign_id") ?? "";
  return { orgId, campaignId };
}

export async function GET(request: Request) {
  try {
    const { orgId, campaignId } = idsFrom(request);
    if (!orgId || !campaignId) {
      return NextResponse.json({ ok: false, reason: "missing_ids" }, { status: 400 });
    }
    const { session, programme } = await requireProgrammeAccess(orgId, campaignId);
    const membership = session.memberships.find((item) => item.org_id === orgId);
    if (!canManageLicences(membership?.role)) {
      return NextResponse.json({ ok: false, reason: "forbidden_role" }, { status: 403 });
    }
    requireSatisfiedMfa(session);
    const snapshot = await getLicenceSnapshot(
      orgId,
      campaignId,
      programme.can_issue_licences
    );
    return NextResponse.json({ ok: true, ...snapshot });
  } catch (error) {
    if (error instanceof LicenceError) {
      return NextResponse.json({ ok: false, reason: error.reason }, { status: error.status });
    }
    const mapped = jsonError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      org_id?: string;
      campaign_id?: string;
      email?: string;
      confirm_email?: string;
    };
    const { orgId, campaignId } = idsFrom(request, body);
    if (!orgId || !campaignId) {
      return NextResponse.json({ ok: false, reason: "missing_ids" }, { status: 400 });
    }

    const { session, programme } = await requireProgrammeAccess(orgId, campaignId);
    const membership = session.memberships.find((item) => item.org_id === orgId);
    if (!canManageLicences(membership?.role)) {
      return NextResponse.json({ ok: false, reason: "forbidden_role" }, { status: 403 });
    }
    requireSatisfiedMfa(session);
    if (!programme.can_issue_licences) {
      return NextResponse.json({ ok: false, reason: "archived_programme" }, { status: 403 });
    }

    const snapshot = await issueLicence({
      orgId,
      campaignId,
      email: body.email ?? "",
      confirmEmail: body.confirm_email ?? "",
      invitedBy: session.userId,
      request,
    });
    return NextResponse.json({
      ok: true,
      message: "Invitation sent successfully",
      ...snapshot,
    });
  } catch (error) {
    if (error instanceof LicenceError) {
      return NextResponse.json({ ok: false, reason: error.reason }, { status: error.status });
    }
    const mapped = jsonError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
