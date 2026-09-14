import { getSupabaseServer } from "@/lib/supabaseServer";

export type PortalRole = "wobble_admin" | "customer_admin" | "viewer";

export type PortalMembership = {
  org_id: string;
  org_name: string;
  role: PortalRole;
};

function isPortalRole(value: string): value is PortalRole {
  return value === "wobble_admin" || value === "customer_admin" || value === "viewer";
}

export async function getPortalMemberships(userId: string): Promise<PortalMembership[]> {
  const admin = getSupabaseServer();
  const { data: members, error: memberError } = await admin
    .from("portal_org_members")
    .select("org_id, role")
    .eq("user_id", userId);

  if (memberError) {
    if (memberError.code === "42P01") return [];
    throw memberError;
  }

  if (!members?.length) return [];

  const orgIds = members.map((member) => member.org_id);
  const { data: orgs, error: orgError } = await admin
    .from("dashboard_orgs")
    .select("org_id, org_name")
    .in("org_id", orgIds);

  if (orgError) throw orgError;

  const orgNames = new Map((orgs ?? []).map((org) => [org.org_id, org.org_name]));

  return members.flatMap((member) => {
    if (!isPortalRole(member.role)) return [];
    return [
      {
        org_id: member.org_id,
        org_name: orgNames.get(member.org_id) ?? member.org_id,
        role: member.role,
      },
    ];
  });
}

export function hasOrgAccess(memberships: PortalMembership[], orgId: string) {
  return memberships.some((membership) => membership.org_id === orgId);
}
