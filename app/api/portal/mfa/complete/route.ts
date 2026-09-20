import { NextResponse } from "next/server";
import { jsonError, requirePortalSession } from "@/lib/portal/access";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function POST() {
  try {
    const session = await requirePortalSession();
    if (!session.needsMfa) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const admin = getSupabaseServer();
    await admin.from("portal_audit_events").insert({
      actor_user_id: session.userId,
      org_id: session.memberships[0]?.org_id ?? null,
      action: "portal.mfa_completed",
      details: { aal: session.aal },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const mapped = jsonError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
