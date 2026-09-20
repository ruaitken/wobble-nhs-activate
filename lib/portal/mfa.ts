import { getSupabaseServer } from "@/lib/supabaseServer";
import { canViewOrgOperations } from "@/lib/portal/roles";
import { PORTAL_MFA_PATH } from "@/lib/portal/paths";
import type { PortalMembership } from "@/lib/portal/membership";

export { PORTAL_MFA_PATH };

export function sessionNeedsMfa(memberships: Array<{ role: PortalMembership["role"] }>) {
  return memberships.some((membership) => canViewOrgOperations(membership.role));
}

export function parseAal(value: unknown): "aal1" | "aal2" {
  return value === "aal2" ? "aal2" : "aal1";
}

export function mfaSatisfied({
  needsMfa,
  aal,
}: {
  needsMfa: boolean;
  aal: "aal1" | "aal2";
}) {
  return !needsMfa || aal === "aal2";
}

export function mfaPagePath(next: string) {
  return `${PORTAL_MFA_PATH}?next=${encodeURIComponent(next)}`;
}

export async function resetMfaForEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    throw new MfaResetError(400, "invalid_email");
  }

  const admin = getSupabaseServer();
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (error) throw error;

  const user = data.users.find((item) => item.email?.toLowerCase() === normalized);
  if (!user) throw new MfaResetError(404, "unknown_user");

  const { data: factors, error: listError } = await admin.auth.admin.mfa.listFactors({
    userId: user.id,
  });
  if (listError) throw listError;

  const all = [...(factors?.factors ?? [])];
  for (const factor of all) {
    const { error: deleteError } = await admin.auth.admin.mfa.deleteFactor({
      id: factor.id,
      userId: user.id,
    });
    if (deleteError) throw deleteError;
  }

  return { userId: user.id, removed: all.length };
}

export class MfaResetError extends Error {
  constructor(
    public status: number,
    public reason: string
  ) {
    super(reason);
  }
}
