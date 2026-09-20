import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createPortalRouteClient, requestOrigin } from "@/lib/supabase/route";
import { getPortalMemberships } from "@/lib/portal/membership";
import { mfaPagePath, sessionNeedsMfa } from "@/lib/portal/mfa";
import { PORTAL_HOME_PATH, PORTAL_LOGIN_PATH, safePortalPath } from "@/lib/portal/paths";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = requestOrigin(request);
  const next = safePortalPath(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const otpType = url.searchParams.get("type");

  const { supabase, applyCookies } = await createPortalRouteClient();

  let errorMessage: string | null = null;

  if (tokenHash) {
    const type: EmailOtpType =
      otpType === "signup" ||
      otpType === "invite" ||
      otpType === "magiclink" ||
      otpType === "recovery" ||
      otpType === "email_change" ||
      otpType === "email"
        ? otpType
        : "email";
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    errorMessage = error?.message ?? null;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    errorMessage = error?.message ?? null;
  } else {
    return NextResponse.redirect(`${origin}${PORTAL_LOGIN_PATH}?error=missing_code`);
  }

  if (errorMessage) {
    return applyCookies(
      NextResponse.redirect(`${origin}${PORTAL_LOGIN_PATH}?error=invalid_link`)
    );
  }

  const destination = next || PORTAL_HOME_PATH;
  const { data: userData } = await supabase.auth.getUser();
  if (userData.user) {
    const memberships = await getPortalMemberships(userData.user.id);
    if (sessionNeedsMfa(memberships)) {
      return applyCookies(
        NextResponse.redirect(`${origin}${mfaPagePath(destination)}`)
      );
    }
  }

  return applyCookies(NextResponse.redirect(`${origin}${destination}`));
}
