export const dynamic = "force-dynamic";
export const revalidate = 0;

import { loadPortalContext } from "@/lib/portal/context";
import PortalShell from "@/app/portal/PortalShell";

export default async function ProgrammeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string; campaignId: string }>;
}) {
  const { orgId, campaignId } = await params;
  const context = await loadPortalContext(orgId, campaignId, "overview");
  return <PortalShell context={context}>{children}</PortalShell>;
}
