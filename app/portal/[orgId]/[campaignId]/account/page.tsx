export const dynamic = "force-dynamic";
export const revalidate = 0;

import AccountManager from "@/app/portal/AccountManager";
import { listAccountMembers } from "@/lib/portal/account";
import { loadPortalContext } from "@/lib/portal/context";
import { canManageUsers } from "@/lib/portal/roles";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ orgId: string; campaignId: string }>;
}) {
  const { orgId, campaignId } = await params;
  const { session, membership } = await loadPortalContext(orgId, campaignId, "account");
  const members = await listAccountMembers(orgId);

  return (
    <AccountManager
      orgId={orgId}
      canManage={canManageUsers(membership.role)}
      currentUserId={session.userId}
      initialMembers={members}
    />
  );
}
