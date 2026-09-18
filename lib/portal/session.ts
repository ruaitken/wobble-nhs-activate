import { createPortalServerClient } from "@/lib/supabase/server";
import { getPortalMemberships, type PortalMembership } from "@/lib/portal/membership";

export type PortalSession = {
  userId: string;
  email: string | null;
  memberships: PortalMembership[];
};

export async function getPortalSession(): Promise<PortalSession | null> {
  const supabase = await createPortalServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;

  const userId = typeof data.claims.sub === "string" ? data.claims.sub : null;
  if (!userId) return null;

  const email =
    typeof data.claims.email === "string" ? data.claims.email : null;

  return {
    userId,
    email,
    memberships: await getPortalMemberships(userId),
  };
}
