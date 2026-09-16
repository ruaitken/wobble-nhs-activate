export const PORTAL_HOME_PATH = "/portal";
export const PORTAL_LOGIN_PATH = "/portal/login";
export const PORTAL_ADMIN_PATH = "/portal/admin";

export type PortalTab = "overview" | "participants" | "licences" | "account";

export function programmePath(
  orgId: string,
  campaignId: string,
  tab: PortalTab = "overview"
) {
  const base = `${PORTAL_HOME_PATH}/${orgId}/${campaignId}`;
  if (tab === "overview") return base;
  return `${base}/${tab}`;
}

export function tabFromPath(pathname: string): PortalTab {
  if (pathname.endsWith("/participants")) return "participants";
  if (pathname.endsWith("/licences")) return "licences";
  if (pathname.endsWith("/account")) return "account";
  return "overview";
}

export function isPublicPortalPath(pathname: string) {
  return (
    pathname === PORTAL_LOGIN_PATH ||
    pathname.startsWith(`${PORTAL_LOGIN_PATH}/`) ||
    pathname === "/api/portal/login"
  );
}

export function isPortalApiPath(pathname: string) {
  return pathname === "/api/portal" || pathname.startsWith("/api/portal/");
}

export function safePortalPath(value: string | null | undefined) {
  if (!value) return PORTAL_HOME_PATH;
  if (!value.startsWith(PORTAL_HOME_PATH)) return PORTAL_HOME_PATH;
  if (value.startsWith("//") || value.includes("://")) return PORTAL_HOME_PATH;
  return value;
}
