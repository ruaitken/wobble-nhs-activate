import { getPortalMemberships } from "@/lib/portal/membership";
import { mfaPagePath, sessionNeedsMfa } from "@/lib/portal/mfa";
import { safePortalPath } from "@/lib/portal/paths";

export async function destinationAfterSignIn(userId: string | undefined, next: string) {
  const destination = safePortalPath(next);
  if (!userId) return destination;
  const memberships = await getPortalMemberships(userId);
  if (sessionNeedsMfa(memberships)) return mfaPagePath(destination);
  return destination;
}
