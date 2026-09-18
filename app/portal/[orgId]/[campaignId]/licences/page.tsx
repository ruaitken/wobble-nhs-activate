export const dynamic = "force-dynamic";
export const revalidate = 0;

import { loadPortalContext } from "@/lib/portal/context";
import { getLicenceSnapshot } from "@/lib/portal/licences";
import { canManageLicences } from "@/lib/portal/roles";
import LicenceManager from "@/app/portal/LicenceManager";

export default async function LicencesPage({
  params,
}: {
  params: Promise<{ orgId: string; campaignId: string }>;
}) {
  const { orgId, campaignId } = await params;
  const { selected, membership } = await loadPortalContext(
    orgId,
    campaignId,
    "licences"
  );
  const snapshot = await getLicenceSnapshot(
    orgId,
    campaignId,
    canManageLicences(membership.role) && selected.can_issue_licences
  );

  return (
    <LicenceManager
      orgId={orgId}
      campaignId={campaignId}
      archived={!selected.can_issue_licences}
      canIssue={snapshot.can_issue}
      initial={snapshot}
    />
  );
}
