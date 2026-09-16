import { NextResponse } from "next/server";
import { jsonError, requireWobbleAdmin } from "@/lib/portal/access";
import { DEFAULT_DURATION_WEEKS } from "@/lib/portal/programmeDuration";
import { WobbleAdminError, addWobbleProgramme } from "@/lib/portal/wobbleAdmin";

export async function POST(request: Request) {
  try {
    const session = await requireWobbleAdmin();
    const body = (await request.json()) as {
      org_id?: string;
      programme_name?: string;
      seat_limit?: number;
      dashboard_tier?: string;
      programme_weeks?: number;
      access_weeks?: number;
    };
    const result = await addWobbleProgramme({
      orgId: body.org_id ?? "",
      programmeName: body.programme_name ?? "",
      seatLimit: Number(body.seat_limit),
      dashboardTier: body.dashboard_tier ?? "premium",
      programmeWeeks: Number(body.programme_weeks ?? DEFAULT_DURATION_WEEKS),
      accessWeeks: Number(body.access_weeks ?? DEFAULT_DURATION_WEEKS),
      createdBy: session.userId,
    });
    return NextResponse.json({
      ok: true,
      ...result,
      message: "Programme added. Open it from the organisation list or the programme menu.",
    });
  } catch (error) {
    if (error instanceof WobbleAdminError) {
      return NextResponse.json({ ok: false, reason: error.reason }, { status: error.status });
    }
    const mapped = jsonError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
