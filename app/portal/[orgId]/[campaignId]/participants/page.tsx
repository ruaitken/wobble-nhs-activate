export const dynamic = "force-dynamic";
export const revalidate = 0;

import { loadPortalContext } from "@/lib/portal/context";
import {
  getPortalOrgParticipants,
  getPortalParticipants,
  recordParticipantsViewed,
} from "@/lib/portal/participants";
import { OVERALL_PROGRAMME_ID } from "@/lib/portal/paths";
import ParticipantList from "@/app/portal/ParticipantList";

export default async function ParticipantsPage({
  params,
}: {
  params: Promise<{ orgId: string; campaignId: string }>;
}) {
  const { orgId, campaignId } = await params;
  const { session } = await loadPortalContext(orgId, campaignId, "participants");
  const overall = campaignId === OVERALL_PROGRAMME_ID;
  await recordParticipantsViewed({
    actorUserId: session.userId,
    orgId,
    campaignId: overall ? null : campaignId,
  });
  const snapshot = overall
    ? await getPortalOrgParticipants(orgId)
    : await getPortalParticipants(campaignId);

  return <ParticipantList snapshot={snapshot} />;
}
