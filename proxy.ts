import { type NextRequest, NextResponse } from "next/server";
import { copyCookies, updatePortalSession } from "@/lib/supabase/proxy";
import {
  isPortalApiPath,
  isPublicPortalPath,
  PORTAL_HOME_PATH,
  PORTAL_LOGIN_PATH,
  safePortalPath,
} from "@/lib/portal/paths";

export async function proxy(request: NextRequest) {
  const { response, isAuthenticated } = await updatePortalSession(request);
  const { pathname } = request.nextUrl;
  const isPublic = isPublicPortalPath(pathname);

  if (!isAuthenticated && !isPublic) {
    if (isPortalApiPath(pathname)) {
      const unauthorized = NextResponse.json(
        { ok: false, reason: "unauthenticated" },
        { status: 401 }
      );
      return copyCookies(response, unauthorized);
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = PORTAL_LOGIN_PATH;
    loginUrl.search = "";
    loginUrl.searchParams.set("next", safePortalPath(`${pathname}${request.nextUrl.search}`));
    return copyCookies(response, NextResponse.redirect(loginUrl));
  }

  if (isAuthenticated && pathname === PORTAL_LOGIN_PATH) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = PORTAL_HOME_PATH;
    homeUrl.search = "";
    return copyCookies(response, NextResponse.redirect(homeUrl));
  }

  return response;
}

export const config = {
  matcher: ["/portal", "/portal/:path*", "/api/portal/:path*"],
};
