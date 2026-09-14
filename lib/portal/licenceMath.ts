export type InvitationStatus = "pending" | "activated" | "expired" | "cancelled";

export type InvitationRecord = {
  invited_email: string;
  status: InvitationStatus;
  expires_at: string;
};

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function emailsMatch(email: string, confirmEmail: string) {
  const left = normalizeEmail(email);
  const right = normalizeEmail(confirmEmail);
  return Boolean(left && left.includes("@") && left === right);
}

export function isOpenReservation(
  invitation: InvitationRecord,
  now = Date.now()
) {
  if (invitation.status !== "pending") return false;
  const expiresAt = Date.parse(invitation.expires_at);
  return !Number.isNaN(expiresAt) && expiresAt > now;
}

export type LicenceInvitation = {
  id: string;
  invited_email: string;
  status: InvitationStatus;
  sent_at: string;
  expires_at: string;
  activated_at: string | null;
};

export type LicenceSnapshot = {
  seat_limit: number;
  claimed: number;
  pending: number;
  issued: number;
  remaining: number;
  can_issue: boolean;
  invitations: LicenceInvitation[];
};

export function licenceTotals({
  seatLimit,
  claimed,
  pendingReserved,
}: {
  seatLimit: number;
  claimed: number;
  pendingReserved: number;
}) {
  const issued = claimed + pendingReserved;
  return {
    seat_limit: seatLimit,
    claimed,
    pending: pendingReserved,
    issued,
    remaining: Math.max(0, seatLimit - issued),
  };
}
