import { NextResponse } from "next/server";
import { destinationAfterSignIn } from "@/lib/portal/finishSignIn";
import { generateSignInTokenHash, portalOtpType } from "@/lib/portal/magicLink";
import { PORTAL_LOGIN_PATH, safePortalPath } from "@/lib/portal/paths";
import { redeemStaffInvite } from "@/lib/portal/staffInvite";
import { createPortalRouteClient, requestOrigin } from "@/lib/supabase/route";

export async function POST(request: Request) {
  const origin = requestOrigin(request);
  const form = await request.formData();
  const invite = String(form.get("invite") ?? "").trim();
  const next = safePortalPath(String(form.get("next") ?? ""));
  let tokenHash = String(form.get("token_hash") ?? "").trim();
  let type = portalOtpType(String(form.get("type") ?? ""));

  if (invite) {
    const redeemed = await redeemStaffInvite(invite);
    if (!redeemed) {
      return NextResponse.redirect(`${origin}${PORTAL_LOGIN_PATH}?error=invite_expired`, 303);
    }
    try {
      tokenHash = await generateSignInTokenHash(origin, redeemed.email);
      type = "magiclink";
    } catch {
      return NextResponse.redirect(`${origin}${PORTAL_LOGIN_PATH}?error=invite_expired`, 303);
    }
  }

  if (!tokenHash) {
    return NextResponse.redirect(`${origin}${PORTAL_LOGIN_PATH}?error=missing_code`, 303);
  }

  const { supabase, applyCookies } = await createPortalRouteClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });
  if (error) {
    return applyCookies(
      NextResponse.redirect(`${origin}${PORTAL_LOGIN_PATH}?error=invalid_link`, 303)
    );
  }

  const { data: userData } = await supabase.auth.getUser();
  const destination = await destinationAfterSignIn(userData.user?.id, next);
  return applyCookies(NextResponse.redirect(`${origin}${destination}`, 303));
}
