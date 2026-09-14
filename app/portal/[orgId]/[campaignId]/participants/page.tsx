export const dynamic = "force-dynamic";
export const revalidate = 0;

import { loadPortalContext } from "@/lib/portal/context";
import { getPortalParticipants } from "@/lib/portal/participants";
import ParticipantList from "@/app/portal/ParticipantList";

export default async function ParticipantsPage({
  params,
}: {
  params: Promise<{ orgId: string; campaignId: string }>;
}) {
  const { orgId, campaignId } = await params;
  await loadPortalContext(orgId, campaignId, "participants");
  const snapshot = await getPortalParticipants(campaignId);

  return <ParticipantList snapshot={snapshot} />;
}
