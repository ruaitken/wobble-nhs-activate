import { redirect } from "next/navigation";
import { getPortalSession } from "@/lib/portal/session";
import { hasOrgAccess } from "@/lib/portal/membership";
import { getOrgProgrammes, pickDefaultCampaignId } from "@/lib/portal/programmes";
import {
  PORTAL_ADMIN_PATH,
  PORTAL_HOME_PATH,
  PORTAL_LOGIN_PATH,
  programmePath,
  type PortalTab,
} from "@/lib/portal/paths";
import { hasWobbleAdminAccess } from "@/lib/portal/roles";
import type { PortalMembership } from "@/lib/portal/membership";
import type { PortalSession } from "@/lib/portal/session";
import type { ProgrammeView } from "@/lib/portal/programmeStatus";

export type { PortalTab };

export type PortalContext = {
  session: PortalSession;
  membership: PortalMembership;
  programmes: ProgrammeView[];
  selected: ProgrammeView;
};

export async function defaultPortalPath(session: PortalSession) {
  const membership = session.memberships[0];
  if (!membership) return PORTAL_HOME_PATH;
  const programmes = await getOrgProgrammes(membership.org_id);
  const campaignId = pickDefaultCampaignId(programmes);
  if (!campaignId) {
    return hasWobbleAdminAccess(session.memberships)
      ? PORTAL_ADMIN_PATH
      : PORTAL_HOME_PATH;
  }
  return programmePath(membership.org_id, campaignId);
}

export async function loadPortalContext(
  orgId: string,
  campaignId: string,
  tab: PortalTab = "overview"
): Promise<PortalContext & { tab: PortalTab }> {
  const session = await getPortalSession();
  if (!session) redirect(PORTAL_LOGIN_PATH);
  if (!hasOrgAccess(session.memberships, orgId)) redirect(PORTAL_HOME_PATH);

  const programmes = await getOrgProgrammes(orgId);
  const selected = programmes.find((programme) => programme.campaign_id === campaignId);
  if (!selected) {
    const fallback = pickDefaultCampaignId(programmes);
    if (fallback) redirect(programmePath(orgId, fallback, tab));
    redirect(PORTAL_HOME_PATH);
  }

  if (tab === "participants" && !selected.show_participants) {
    redirect(programmePath(orgId, selected.campaign_id, "overview"));
  }

  const membership = session.memberships.find((item) => item.org_id === orgId);
  if (!membership) redirect(PORTAL_HOME_PATH);

  return { session, membership, programmes, selected, tab };
}
