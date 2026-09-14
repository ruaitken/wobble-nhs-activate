import { getPortalSession } from "@/lib/portal/session";
import { hasOrgAccess } from "@/lib/portal/membership";
import { getProgrammeForOrg } from "@/lib/portal/programmes";
import type { PortalSession } from "@/lib/portal/session";
import type { ProgrammeView } from "@/lib/portal/programmeStatus";

export class PortalAccessError extends Error {
  constructor(
    public status: number,
    public reason: string
  ) {
    super(reason);
  }
}

export async function requirePortalSession(): Promise<PortalSession> {
  const session = await getPortalSession();
  if (!session) throw new PortalAccessError(401, "unauthenticated");
  return session;
}

export async function requireOrgAccess(orgId: string): Promise<PortalSession> {
  const session = await requirePortalSession();
  if (!hasOrgAccess(session.memberships, orgId)) {
    throw new PortalAccessError(403, "forbidden_org");
  }
  return session;
}

export async function requireProgrammeAccess(
  orgId: string,
  campaignId: string
): Promise<{ session: PortalSession; programme: ProgrammeView }> {
  const session = await requireOrgAccess(orgId);
  const programme = await getProgrammeForOrg(orgId, campaignId);
  if (!programme) throw new PortalAccessError(404, "unknown_programme");
  return { session, programme };
}

export function jsonError(error: unknown) {
  if (error instanceof PortalAccessError) {
    return { status: error.status, body: { ok: false as const, reason: error.reason } };
  }
  throw error;
}
