import { getSupabaseServer } from "@/lib/supabaseServer";
import { canRemoveMember } from "@/lib/portal/adminGuards";
import { canSendPortalEmail, sendPortalMagicLink } from "@/lib/portal/magicLink";
import { emailsMatch, normalizeEmail } from "@/lib/portal/licenceMath";
import type { PortalRole } from "@/lib/portal/membership";
import { PORTAL_HOME_PATH } from "@/lib/portal/paths";

export class AccountError extends Error {
  constructor(
    public status: number,
    public reason: string
  ) {
    super(reason);
  }
}

export type AccountMember = {
  user_id: string;
  email: string;
  role: PortalRole;
  created_at: string;
  can_remove: boolean;
};

const INVITE_ROLES = new Set<PortalRole>(["customer_admin", "viewer"]);

function isPortalRole(value: string): value is PortalRole {
  return value === "wobble_admin" || value === "customer_admin" || value === "viewer";
}

async function usersById() {
  const admin = getSupabaseServer();
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (error) throw error;
  return new Map(
    (data.users ?? []).map((user) => [user.id, user.email?.toLowerCase() ?? ""])
  );
}

async function findUserIdByEmail(email: string) {
  const admin = getSupabaseServer();
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (error) throw error;
  return data.users.find((user) => user.email?.toLowerCase() === email)?.id ?? null;
}

export async function listAccountMembers(orgId: string): Promise<AccountMember[]> {
  const admin = getSupabaseServer();
  const { data, error } = await admin
    .from("portal_org_members")
    .select("user_id, role, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const emails = await usersById();
  const rows = (data ?? []).flatMap((row) => {
    if (!isPortalRole(row.role)) return [];
    return [
      {
        user_id: row.user_id,
        email: emails.get(row.user_id) || "Unknown",
        role: row.role,
        created_at: row.created_at,
      },
    ];
  });

  return rows.map((row) => ({
    ...row,
    can_remove: canRemoveMember(rows, row.user_id),
  }));
}

export async function inviteAccountMember({
  orgId,
  email,
  confirmEmail,
  role,
  invitedBy,
  request,
}: {
  orgId: string;
  email: string;
  confirmEmail: string;
  role: string;
  invitedBy: string;
  request: Request;
}) {
  const invitedEmail = normalizeEmail(email);
  if (!invitedEmail.includes("@")) throw new AccountError(400, "invalid_email");
  if (!emailsMatch(email, confirmEmail)) {
    throw new AccountError(400, "emails_do_not_match");
  }
  if (!INVITE_ROLES.has(role as PortalRole)) {
    throw new AccountError(400, "invalid_role");
  }

  const members = await listAccountMembers(orgId);
  if (members.some((member) => member.email === invitedEmail)) {
    throw new AccountError(409, "already_member");
  }

  const admin = getSupabaseServer();
  let userId = await findUserIdByEmail(invitedEmail);
  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: invitedEmail,
      email_confirm: true,
    });
    if (error || !data.user) throw new AccountError(500, "invite_failed");
    userId = data.user.id;
  }

  const { error: memberError } = await admin.from("portal_org_members").insert({
    org_id: orgId,
    user_id: userId,
    role,
    created_by: invitedBy,
  });
  if (memberError) {
    if (memberError.code === "23505") throw new AccountError(409, "already_member");
    throw memberError;
  }

  let emailSent = false;
  if (canSendPortalEmail()) {
    try {
      await sendPortalMagicLink({
        request,
        email: invitedEmail,
        next: PORTAL_HOME_PATH,
      });
      emailSent = true;
    } catch {
      emailSent = false;
    }
  }

  await admin.from("portal_audit_events").insert({
    actor_user_id: invitedBy,
    org_id: orgId,
    action: "portal.member_invited",
    details: { invited_email: invitedEmail, role, email_sent: emailSent },
  });

  return { members: await listAccountMembers(orgId), email_sent: emailSent };
}

export async function removeAccountMember({
  orgId,
  userId,
  actorUserId,
}: {
  orgId: string;
  userId: string;
  actorUserId: string;
}) {
  const members = await listAccountMembers(orgId);
  if (!members.some((member) => member.user_id === userId)) {
    throw new AccountError(404, "unknown_member");
  }
  if (!canRemoveMember(members, userId)) {
    throw new AccountError(409, "last_admin");
  }

  const admin = getSupabaseServer();
  const { error } = await admin
    .from("portal_org_members")
    .delete()
    .eq("org_id", orgId)
    .eq("user_id", userId);
  if (error) throw error;

  await admin.from("portal_audit_events").insert({
    actor_user_id: actorUserId,
    org_id: orgId,
    action: "portal.member_removed",
    details: { user_id: userId },
  });

  return listAccountMembers(orgId);
}
