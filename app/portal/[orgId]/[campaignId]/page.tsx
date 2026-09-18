export const dynamic = "force-dynamic";
export const revalidate = 0;

import { loadPortalContext } from "@/lib/portal/context";
import { getPortalCampaignStats } from "@/lib/portal/overview";
import PortalOverview from "@/app/portal/PortalOverview";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ orgId: string; campaignId: string }>;
}) {
  const { orgId, campaignId } = await params;
  await loadPortalContext(orgId, campaignId, "overview");
  const stats = await getPortalCampaignStats(campaignId);

  return <PortalOverview stats={stats} />;
}
