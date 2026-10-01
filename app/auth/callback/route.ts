import { NextResponse } from "next/server";
import { createPortalRouteClient, requestOrigin } from "@/lib/supabase/route";
import { destinationAfterSignIn } from "@/lib/portal/finishSignIn";
import { PORTAL_LOGIN_PATH, safePortalPath } from "@/lib/portal/paths";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = requestOrigin(request);
  const next = safePortalPath(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const otpType = url.searchParams.get("type");

  if (tokenHash) {
    const confirm = new URL("/auth/confirm", origin);
    confirm.searchParams.set("token_hash", tokenHash);
    confirm.searchParams.set("type", otpType ?? "magiclink");
    confirm.searchParams.set("next", next);
    return NextResponse.redirect(confirm);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}${PORTAL_LOGIN_PATH}?error=missing_code`);
  }

  const { supabase, applyCookies } = await createPortalRouteClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return applyCookies(
      NextResponse.redirect(`${origin}${PORTAL_LOGIN_PATH}?error=invalid_link`)
    );
  }

  const { data: userData } = await supabase.auth.getUser();
  const destination = await destinationAfterSignIn(userData.user?.id, next);
  return applyCookies(NextResponse.redirect(`${origin}${destination}`));
}
