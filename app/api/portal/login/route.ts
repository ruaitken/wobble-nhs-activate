import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getPortalMemberships } from "@/lib/portal/membership";
import { canSendPortalEmail, sendPortalMagicLink } from "@/lib/portal/magicLink";
import { PORTAL_HOME_PATH, safePortalPath } from "@/lib/portal/paths";

const GENERIC_SENT_MESSAGE =
  "If this email is registered for the customer portal, we have sent a sign-in link.";

export async function POST(request: Request) {
  let email = "";
  let next = PORTAL_HOME_PATH;

  try {
    const body = (await request.json()) as { email?: string; next?: string };
    email = (body.email ?? "").trim().toLowerCase();
    next = safePortalPath(body.next);
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_body" }, { status: 400 });
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, reason: "invalid_email" }, { status: 400 });
  }

  const admin = getSupabaseServer();
  const { data: usersPage, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (listError) {
    return NextResponse.json({ ok: true, message: GENERIC_SENT_MESSAGE });
  }

  const authUser = usersPage.users.find((user) => user.email?.toLowerCase() === email);
  if (!authUser) {
    return NextResponse.json({ ok: true, message: GENERIC_SENT_MESSAGE });
  }

  let memberships;
  try {
    memberships = await getPortalMemberships(authUser.id);
  } catch {
    return NextResponse.json({ ok: true, message: GENERIC_SENT_MESSAGE });
  }

  if (memberships.length === 0) {
    return NextResponse.json({ ok: true, message: GENERIC_SENT_MESSAGE });
  }

  if (!canSendPortalEmail()) {
    return NextResponse.json({ ok: true, message: GENERIC_SENT_MESSAGE });
  }

  let applyCookies: ((response: NextResponse) => NextResponse) | null = null;
  try {
    ({ applyCookies } = await sendPortalMagicLink({ request, email, next }));
  } catch {
    return NextResponse.json({ ok: true, message: GENERIC_SENT_MESSAGE });
  }

  await admin.from("portal_audit_events").insert({
    actor_user_id: authUser.id,
    org_id: memberships[0]?.org_id ?? null,
    action: "portal.magic_link_sent",
    details: { email },
  });

  return (applyCookies ?? ((response: NextResponse) => response))(
    NextResponse.json({ ok: true, message: GENERIC_SENT_MESSAGE })
  );
}
