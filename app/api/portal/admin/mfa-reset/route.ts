import { NextResponse } from "next/server";
import { jsonError, requireWobbleAdmin } from "@/lib/portal/access";
import { MfaResetError, resetMfaForEmail } from "@/lib/portal/mfa";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  try {
    const session = await requireWobbleAdmin();
    const body = (await request.json()) as { email?: string };
    const result = await resetMfaForEmail(body.email ?? "");

    const admin = getSupabaseServer();
    await admin.from("portal_audit_events").insert({
      actor_user_id: session.userId,
      org_id: session.memberships[0]?.org_id ?? null,
      action: "portal.mfa_reset",
      details: { target_user_id: result.userId, removed: result.removed },
    });

    return NextResponse.json({
      ok: true,
      removed: result.removed,
      message:
        "Authenticator reset. Ask them to sign in again and set up a new app.",
    });
  } catch (error) {
    if (error instanceof MfaResetError) {
      return NextResponse.json({ ok: false, reason: error.reason }, { status: error.status });
    }
    const mapped = jsonError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
