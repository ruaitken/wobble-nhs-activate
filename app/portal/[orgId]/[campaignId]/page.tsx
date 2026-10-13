export const dynamic = "force-dynamic";
export const revalidate = 0;

import { loadPortalContext } from "@/lib/portal/context";
import { getPortalCampaignStats, getPortalOrgStats } from "@/lib/portal/overview";
import { OVERALL_PROGRAMME_ID } from "@/lib/portal/paths";
import PortalOverview from "@/app/portal/PortalOverview";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ orgId: string; campaignId: string }>;
}) {
  const { orgId, campaignId } = await params;
  await loadPortalContext(orgId, campaignId, "overview");
  const stats =
    campaignId === OVERALL_PROGRAMME_ID
      ? await getPortalOrgStats(orgId)
      : await getPortalCampaignStats(campaignId);

  return <PortalOverview stats={stats} />;
}
