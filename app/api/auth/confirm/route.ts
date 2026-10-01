import { NextResponse } from "next/server";
import { destinationAfterSignIn } from "@/lib/portal/finishSignIn";
import { portalOtpType } from "@/lib/portal/magicLink";
import { PORTAL_LOGIN_PATH, safePortalPath } from "@/lib/portal/paths";
import { createPortalRouteClient, requestOrigin } from "@/lib/supabase/route";

export async function POST(request: Request) {
  const origin = requestOrigin(request);
  const form = await request.formData();
  const tokenHash = String(form.get("token_hash") ?? "").trim();
  const next = safePortalPath(String(form.get("next") ?? ""));
  const type = portalOtpType(String(form.get("type") ?? ""));

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
