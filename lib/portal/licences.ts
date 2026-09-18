import { getSupabaseServer } from "@/lib/supabaseServer";
import { hashInviteToken, newInviteToken } from "@/lib/portal/inviteToken";
import {
  emailsMatch,
  isOpenReservation,
  licenceTotals,
  normalizeEmail,
  type InvitationStatus,
  type LicenceInvitation,
  type LicenceSnapshot,
} from "@/lib/portal/licenceMath";
import { canSendInviteEmail, sendInviteEmail } from "@/lib/portal/inviteEmail";
import {
  loadProfileNamesByEmail,
  namesAreValid,
  parseConsentChoice,
  saveProfileNames,
  saveReportingConsent,
} from "@/lib/portal/inviteProfile";
import { getProgrammeForOrg } from "@/lib/portal/programmes";
import { grantAppAccess } from "@/lib/portal/appAccess";

export type { LicenceInvitation, LicenceSnapshot };

export class LicenceError extends Error {
  constructor(
    public status: number,
    public reason: string
  ) {
    super(reason);
  }
}

type InvitationRow = {
  id: string;
  campaign_id: string;
  invited_email: string;
  token_hash: string;
  status: InvitationStatus;
  sent_at: string;
  expires_at: string;
  activated_at: string | null;
  activated_user_id: string | null;
};

function isStatus(value: string): value is InvitationStatus {
  return (
    value === "pending" ||
    value === "activated" ||
    value === "expired" ||
    value === "cancelled"
  );
}

async function expireOpenInvitations(campaignId: string) {
  const admin = getSupabaseServer();
  await admin
    .from("portal_participant_invitations")
    .update({ status: "expired" })
    .eq("campaign_id", campaignId)
    .eq("status", "pending")
    .lte("expires_at", new Date().toISOString());
}

async function claimedCount(campaignId: string) {
  const admin = getSupabaseServer();
  const { count, error } = await admin
    .from("nhs_claims")
    .select("user_id", { count: "exact", head: true })
    .eq("campaign_id", campaignId);
  if (error) throw error;
  return count ?? 0;
}

async function listInvitations(campaignId: string): Promise<LicenceInvitation[]> {
  const admin = getSupabaseServer();
  const { data, error } = await admin
    .from("portal_participant_invitations")
    .select("id, invited_email, status, sent_at, expires_at, activated_at")
    .eq("campaign_id", campaignId)
    .order("sent_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).flatMap((row) => {
    if (!isStatus(row.status)) return [];
    return [
      {
        id: row.id,
        invited_email: row.invited_email,
        status: row.status,
        sent_at: row.sent_at,
        expires_at: row.expires_at,
        activated_at: row.activated_at,
      },
    ];
  });
}

async function findAuthUserIdByEmail(email: string) {
  const admin = getSupabaseServer();
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (error) return null;
  return (
    data.users.find((user) => user.email?.toLowerCase() === email)?.id ?? null
  );
}

async function getClaim(campaignId: string, userId: string) {
  const admin = getSupabaseServer();
  const { data, error } = await admin
    .from("nhs_claims")
    .select("user_id, status, expires_at")
    .eq("campaign_id", campaignId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getLicenceSnapshot(
  orgId: string,
  campaignId: string,
  canIssueRole: boolean
): Promise<LicenceSnapshot> {
  await expireOpenInvitations(campaignId);
  const admin = getSupabaseServer();
  const { data: campaign, error } = await admin
    .from("nhs_campaigns")
    .select("seat_limit")
    .eq("id", campaignId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (error) throw error;
  if (!campaign) throw new LicenceError(404, "unknown_programme");

  const programme = await getProgrammeForOrg(orgId, campaignId);
  if (!programme) throw new LicenceError(404, "unknown_programme");

  const invitations = await listInvitations(campaignId);
  const claimed = await claimedCount(campaignId);
  const pending = invitations.filter((invitation) =>
    isOpenReservation(invitation)
  ).length;
  const totals = licenceTotals({
    seatLimit: campaign.seat_limit,
    claimed,
    pendingReserved: pending,
  });

  return {
    ...totals,
    can_issue: canIssueRole && programme.can_issue_licences,
    invitations,
  };
}

export async function issueLicence({
  orgId,
  campaignId,
  email,
  confirmEmail,
  invitedBy,
  request,
}: {
  orgId: string;
  campaignId: string;
  email: string;
  confirmEmail: string;
  invitedBy: string;
  request: Request;
}) {
  if (!emailsMatch(email, confirmEmail)) {
    throw new LicenceError(400, "emails_do_not_match");
  }
  if (!canSendInviteEmail()) {
    throw new LicenceError(503, "invite_email_unavailable");
  }

  const invitedEmail = normalizeEmail(email);
  const programme = await getProgrammeForOrg(orgId, campaignId);
  if (!programme) throw new LicenceError(404, "unknown_programme");
  if (!programme.can_issue_licences) {
    throw new LicenceError(403, "archived_programme");
  }

  await expireOpenInvitations(campaignId);

  const existingUserId = await findAuthUserIdByEmail(invitedEmail);
  if (existingUserId && (await getClaim(campaignId, existingUserId))) {
    throw new LicenceError(409, "already_enrolled");
  }

  const invitations = await listInvitations(campaignId);
  if (
    invitations.some(
      (invitation) =>
        invitation.invited_email === invitedEmail &&
        invitation.status === "activated"
    )
  ) {
    throw new LicenceError(409, "already_activated");
  }
  if (
    invitations.some(
      (invitation) =>
        invitation.invited_email === invitedEmail &&
        isOpenReservation(invitation)
    )
  ) {
    throw new LicenceError(409, "already_pending");
  }

  const snapshot = await getLicenceSnapshot(orgId, campaignId, true);
  if (snapshot.remaining <= 0) {
    throw new LicenceError(409, "no_seats_remaining");
  }

  const token = newInviteToken();
  const admin = getSupabaseServer();
  const { data: inserted, error } = await admin
    .from("portal_participant_invitations")
    .insert({
      campaign_id: campaignId,
      invited_email: invitedEmail,
      token_hash: hashInviteToken(token),
      status: "pending",
      invited_by: invitedBy,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    if (error?.code === "23505") throw new LicenceError(409, "already_pending");
    throw error ?? new LicenceError(500, "invite_failed");
  }

  try {
    await sendInviteEmail({
      request,
      to: invitedEmail,
      programmeName: programme.label,
      token,
    });
  } catch {
    await admin
      .from("portal_participant_invitations")
      .update({ status: "cancelled" })
      .eq("id", inserted.id);
    throw new LicenceError(503, "invite_email_failed");
  }

  await admin.from("portal_audit_events").insert({
    actor_user_id: invitedBy,
    org_id: orgId,
    campaign_id: campaignId,
    action: "portal.licence_invited",
    details: { invited_email: invitedEmail },
  });

  return getLicenceSnapshot(orgId, campaignId, true);
}

export async function getInvitationByToken(token: string) {
  const hash = hashInviteToken(token);
  await expireInvitationHash(hash);
  const admin = getSupabaseServer();
  const { data, error } = await admin
    .from("portal_participant_invitations")
    .select(
      "id, campaign_id, invited_email, token_hash, status, sent_at, expires_at, activated_at, activated_user_id"
    )
    .eq("token_hash", hash)
    .maybeSingle();
  if (error) throw error;
  if (!data || !isStatus(data.status)) return null;
  return data as InvitationRow;
}

async function expireInvitationHash(tokenHash: string) {
  const admin = getSupabaseServer();
  await admin
    .from("portal_participant_invitations")
    .update({ status: "expired" })
    .eq("token_hash", tokenHash)
    .eq("status", "pending")
    .lte("expires_at", new Date().toISOString());
}

export async function invitationPublicDetails(token: string) {
  const invitation = await getInvitationByToken(token);
  if (!invitation) return null;

  const admin = getSupabaseServer();
  const { data: campaign } = await admin
    .from("nhs_campaigns")
    .select("service_name, trust_name, org_id")
    .eq("id", invitation.campaign_id)
    .maybeSingle();

  const programme = campaign?.org_id
    ? await getProgrammeForOrg(campaign.org_id, invitation.campaign_id)
    : null;
  const names = await loadProfileNamesByEmail(invitation.invited_email);

  return {
    status: invitation.status,
    open: isOpenReservation(invitation),
    campaign_id: invitation.campaign_id,
    programme_name: campaign?.service_name ?? invitation.campaign_id,
    trust_name: campaign?.trust_name ?? null,
    invited_email: invitation.invited_email,
    expires_at: invitation.expires_at,
    ask_consent: programme?.dashboard_tier === "premium",
    first_name: names.first_name,
    last_name: names.last_name,
  };
}

export async function completeInvitation({
  token,
  accessToken,
  firstName,
  lastName,
  consented,
}: {
  token: string;
  accessToken: string;
  firstName: string;
  lastName: string;
  consented?: unknown;
}) {
  const invitation = await getInvitationByToken(token);
  if (!invitation) throw new LicenceError(404, "invalid_invite");
  if (invitation.status === "expired") throw new LicenceError(410, "invite_expired");
  if (invitation.status === "activated") {
    throw new LicenceError(409, "already_activated");
  }
  if (invitation.status !== "pending") {
    throw new LicenceError(410, "invite_unavailable");
  }
  if (!isOpenReservation(invitation)) {
    throw new LicenceError(410, "invite_expired");
  }

  const admin = getSupabaseServer();
  const { data: auth, error: authError } = await admin.auth.getUser(accessToken);
  if (authError || !auth.user?.email) {
    throw new LicenceError(401, "unauthenticated");
  }
  if (auth.user.email.toLowerCase() !== invitation.invited_email) {
    throw new LicenceError(403, "email_mismatch");
  }

  const { data: campaign, error: campaignError } = await admin
    .from("nhs_campaigns")
    .select("id, org_id, claim_duration_days, is_active")
    .eq("id", invitation.campaign_id)
    .maybeSingle();
  if (campaignError) throw campaignError;
  if (!campaign?.org_id) throw new LicenceError(404, "unknown_programme");

  const programme = await getProgrammeForOrg(campaign.org_id, invitation.campaign_id);
  if (!programme?.can_issue_licences) {
    throw new LicenceError(403, "archived_programme");
  }

  if (!namesAreValid(firstName, lastName)) {
    throw new LicenceError(400, "missing_name");
  }

  const askConsent = programme.dashboard_tier === "premium";
  const consentChoice = parseConsentChoice(consented);
  if (askConsent && consentChoice === null) {
    throw new LicenceError(400, "consent_required");
  }

  await saveProfileNames({
    userId: auth.user.id,
    firstName,
    lastName,
  });

  const existingClaim = await getClaim(invitation.campaign_id, auth.user.id);
  const expiresAt = existingClaim?.expires_at
    ? new Date(existingClaim.expires_at)
    : campaign.claim_duration_days
      ? new Date(
          Date.now() + campaign.claim_duration_days * 24 * 60 * 60 * 1000
        )
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  if (!existingClaim) {
    const { error: claimError } = await admin.from("nhs_claims").insert({
      campaign_id: invitation.campaign_id,
      user_id: auth.user.id,
      status: "pending_grant",
      expires_at: expiresAt.toISOString(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
    });
    if (claimError) throw claimError;

    const { data: seats } = await admin
      .from("nhs_campaigns")
      .select("seats_used")
      .eq("id", invitation.campaign_id)
      .maybeSingle();
    await admin
      .from("nhs_campaigns")
      .update({ seats_used: (seats?.seats_used ?? 0) + 1 })
      .eq("id", invitation.campaign_id);
  } else {
    await admin
      .from("nhs_claims")
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      })
      .eq("campaign_id", invitation.campaign_id)
      .eq("user_id", auth.user.id);
  }

  const appAccess = await grantAppAccess({
    userId: auth.user.id,
    campaignId: invitation.campaign_id,
    expiresAt,
  });
  if (appAccess.status === "granted") {
    await admin
      .from("nhs_claims")
      .update({ status: "active" })
      .eq("campaign_id", invitation.campaign_id)
      .eq("user_id", auth.user.id);
  }

  if (askConsent && consentChoice !== null) {
    await saveReportingConsent({
      userId: auth.user.id,
      campaignId: invitation.campaign_id,
      consented: consentChoice,
    });
  }

  const { error: updateError } = await admin
    .from("portal_participant_invitations")
    .update({
      status: "activated",
      activated_at: new Date().toISOString(),
      activated_user_id: auth.user.id,
    })
    .eq("id", invitation.id)
    .eq("status", "pending");
  if (updateError) throw updateError;

  await admin.from("portal_audit_events").insert({
    actor_user_id: auth.user.id,
    org_id: campaign.org_id,
    campaign_id: invitation.campaign_id,
    action: "portal.licence_activated",
    details: {
      invited_email: invitation.invited_email,
      consented: askConsent ? consentChoice : null,
      app_access: appAccess.status,
    },
  });

  return {
    campaign_id: invitation.campaign_id,
    programme_name: programme.label,
    invited_email: invitation.invited_email,
    app_access: appAccess.status,
  };
}
