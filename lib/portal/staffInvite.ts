import { createHash, randomBytes } from "node:crypto";
import { sendTransactionalEmail } from "@/lib/portal/inviteEmail";
import {
  canSendPortalEmail,
  escapeHtml,
  portalEmailHtml,
  portalLoginUrl,
} from "@/lib/portal/magicLink";
import { requestOrigin } from "@/lib/supabase/route";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const STAFF_INVITE_HOURS = 24;

export function hashStaffInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function staffInviteUrl(origin: string, token: string) {
  const url = new URL("/auth/confirm", origin);
  url.searchParams.set("invite", token);
  return url.toString();
}

export function buildStaffInviteEmail({
  orgName,
  inviteUrl,
}: {
  orgName: string;
  inviteUrl: string;
}) {
  const loginUrl = portalLoginUrl(inviteUrl);
  const subject = "You have been added to the Wobble customer portal";
  const text = [
    `${orgName} has added you to the Wobble customer portal.`,
    "",
    "Open this link, then press Sign in on the page that opens. Opening the email is not enough.",
    `This invitation lasts ${STAFF_INVITE_HOURS} hours and can be used once.`,
    "After signing in you will set up an authenticator app on your phone, such as Microsoft Authenticator.",
    "",
    inviteUrl,
    "",
    "If the link has run out, go to the portal login page and enter your email to get a new one:",
    loginUrl,
    "",
    "If you were not expecting this, you can ignore this email.",
  ].join("\n");
  const html = portalEmailHtml({
    heading: "You have been added",
    introHtml: `<strong>${escapeHtml(orgName)}</strong> has added you to the Wobble customer portal. Press <strong>Continue to sign in</strong>, then press <strong>Sign in</strong> on the page that opens. Opening the email is not enough.`,
    detail: `This invitation lasts ${STAFF_INVITE_HOURS} hours and can be used once. After signing in you will set up an authenticator app on your phone, such as Microsoft Authenticator.`,
    url: inviteUrl,
    loginUrl,
  });
  return { subject, text, html };
}

export async function sendStaffInvite({
  request,
  orgId,
  userId,
  email,
  createdBy,
}: {
  request: Request;
  orgId: string;
  userId: string;
  email: string;
  createdBy: string;
}) {
  if (!canSendPortalEmail()) throw new Error("email_unavailable");

  const admin = getSupabaseServer();
  const token = randomBytes(32).toString("base64url");
  const { error } = await admin.from("portal_staff_invitations").insert({
    org_id: orgId,
    user_id: userId,
    token_hash: hashStaffInviteToken(token),
    created_by: createdBy,
    expires_at: new Date(Date.now() + STAFF_INVITE_HOURS * 60 * 60 * 1000).toISOString(),
  });
  if (error) throw error;

  const { data: org } = await admin
    .from("dashboard_orgs")
    .select("org_name")
    .eq("org_id", orgId)
    .maybeSingle();

  const inviteUrl = staffInviteUrl(requestOrigin(request), token);
  const message = buildStaffInviteEmail({
    orgName: org?.org_name ?? "Your organisation",
    inviteUrl,
  });
  await sendTransactionalEmail({ to: email, ...message });
  return { inviteUrl };
}

export async function redeemStaffInvite(token: string) {
  if (!token) return null;
  const admin = getSupabaseServer();
  const { data: invite, error } = await admin
    .from("portal_staff_invitations")
    .update({ used_at: new Date().toISOString() })
    .eq("token_hash", hashStaffInviteToken(token))
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("org_id, user_id")
    .maybeSingle();
  if (error || !invite) return null;

  const { data: member } = await admin
    .from("portal_org_members")
    .select("user_id")
    .eq("org_id", invite.org_id)
    .eq("user_id", invite.user_id)
    .maybeSingle();
  if (!member) return null;

  const { data: user } = await admin.auth.admin.getUserById(invite.user_id);
  const email = user.user?.email;
  if (!email) return null;

  await admin.from("portal_audit_events").insert({
    actor_user_id: invite.user_id,
    org_id: invite.org_id,
    action: "portal.staff_invite_used",
    details: {},
  });
  return { email, orgId: invite.org_id, userId: invite.user_id };
}
