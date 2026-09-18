import { NextResponse } from "next/server";
import { createPortalServerClient } from "@/lib/supabase/server";
import { getPortalSession } from "@/lib/portal/session";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function POST() {
  const session = await getPortalSession();
  const supabase = await createPortalServerClient();
  await supabase.auth.signOut();

  if (session) {
    const admin = getSupabaseServer();
    await admin.from("portal_audit_events").insert({
      actor_user_id: session.userId,
      org_id: session.memberships[0]?.org_id ?? null,
      action: "portal.sign_out",
      details: {},
    });
  }

  return NextResponse.json({ ok: true });
}
