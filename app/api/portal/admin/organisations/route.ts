import { NextResponse } from "next/server";
import { jsonError, requireWobbleAdmin } from "@/lib/portal/access";
import { DEFAULT_DURATION_WEEKS } from "@/lib/portal/programmeDuration";
import {
  WobbleAdminError,
  createWobbleOrganisation,
  listWobbleOrganisations,
} from "@/lib/portal/wobbleAdmin";

export async function GET() {
  try {
    await requireWobbleAdmin();
    const organisations = await listWobbleOrganisations();
    return NextResponse.json({ ok: true, organisations });
  } catch (error) {
    if (error instanceof WobbleAdminError) {
      return NextResponse.json({ ok: false, reason: error.reason }, { status: error.status });
    }
    const mapped = jsonError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireWobbleAdmin();
    const body = (await request.json()) as {
      org_name?: string;
      programme_name?: string;
      seat_limit?: number;
      dashboard_tier?: string;
      programme_weeks?: number;
      access_weeks?: number;
      email?: string;
      confirm_email?: string;
    };
    const result = await createWobbleOrganisation({
      orgName: body.org_name ?? "",
      programmeName: body.programme_name ?? "",
      seatLimit: Number(body.seat_limit),
      dashboardTier: body.dashboard_tier ?? "premium",
      programmeWeeks: Number(body.programme_weeks ?? DEFAULT_DURATION_WEEKS),
      accessWeeks: Number(body.access_weeks ?? DEFAULT_DURATION_WEEKS),
      adminEmail: body.email ?? "",
      confirmEmail: body.confirm_email ?? "",
      createdBy: session.userId,
      createdByEmail: session.email,
      request,
    });
    return NextResponse.json({
      ok: true,
      ...result,
      message: result.email_sent
        ? "Organisation created. We have emailed the first administrator a sign-in link."
        : "Organisation created. Ask the first administrator to request a sign-in link from the login page.",
    });
  } catch (error) {
    if (error instanceof WobbleAdminError) {
      return NextResponse.json({ ok: false, reason: error.reason }, { status: error.status });
    }
    const mapped = jsonError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
