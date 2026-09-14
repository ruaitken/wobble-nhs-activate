"use client";

import { useState } from "react";
import type { LicenceSnapshot } from "@/lib/portal/licenceMath";

const ERRORS: Record<string, string> = {
  emails_do_not_match: "The two email addresses must match.",
  already_pending: "An information pack has already been sent to this email.",
  already_activated: "This email already has a licence for this programme.",
  already_enrolled: "This email is already enrolled on this programme.",
  no_seats_remaining: "There are no licences remaining in this period.",
  archived_programme: "Licences cannot be issued for a historical programme.",
  forbidden_role: "Only administrators can send information packs.",
  invite_email_failed: "We could not send that email just now. Please try again.",
};

function statusLabel(status: string) {
  if (status === "pending") return "Pending";
  if (status === "activated") return "Activated";
  if (status === "expired") return "Expired";
  if (status === "cancelled") return "Cancelled";
  return status;
}

function formatDate(value: string) {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(time);
}

export default function LicenceManager({
  orgId,
  campaignId,
  archived,
  canIssue,
  initial,
}: {
  orgId: string;
  campaignId: string;
  archived: boolean;
  canIssue: boolean;
  initial: LicenceSnapshot;
}) {
  const [snapshot, setSnapshot] = useState(initial);
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/portal/licences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          campaign_id: campaignId,
          email,
          confirm_email: confirmEmail,
        }),
      });
      const body = (await response.json()) as LicenceSnapshot & {
        ok?: boolean;
        reason?: string;
        message?: string;
      };
      if (!response.ok || !body.ok) {
        setError(ERRORS[body.reason ?? ""] ?? "We could not send that information pack.");
        return;
      }
      setSnapshot(body);
      setEmail("");
      setConfirmEmail("");
      setMessage(
        `Invitation sent successfully. ${body.issued} of ${body.seat_limit} licences issued.`
      );
    } catch {
      setError("We could not send that information pack.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold">Licences</h3>
        <p className="mt-2 text-sm text-[#25303B]/80">
          {snapshot.issued} of {snapshot.seat_limit} issued
        </p>
        <p className="text-sm text-[#25303B]/80">{snapshot.remaining} remaining</p>
      </div>

      {archived ? (
        <p className="text-sm text-[#25303B]/80">
          This programme period is historical. You can still look at it, but new
          licences cannot be issued. Unused seats do not carry over.
        </p>
      ) : canIssue ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-[#E58B66]/40 bg-[#E58B66]/10 p-4 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-xl border border-black/10 bg-white/70 p-4 text-sm">
              {message}
            </div>
          )}
          <label className="block">
            <span className="text-sm font-semibold">Email address</span>
            <input
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm outline-none ring-[#A6D5CE] focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Confirm email address</span>
            <input
              type="email"
              required
              autoComplete="off"
              value={confirmEmail}
              onChange={(event) => setConfirmEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm outline-none ring-[#A6D5CE] focus:ring-2"
            />
          </label>
          <button
            type="submit"
            disabled={submitting || snapshot.remaining <= 0}
            className="rounded-xl bg-[#25303B] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Send Wobble information pack"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-[#25303B]/80">
          Only administrators can send information packs. You can still see
          licence totals and invitation status.
        </p>
      )}

      <div>
        <h4 className="text-sm font-extrabold uppercase tracking-wide text-[#25303B]/70">
          Invitations
        </h4>
        {snapshot.invitations.length === 0 ? (
          <p className="mt-2 text-sm text-[#25303B]/80">
            No information packs have been sent for this period yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-black/10">
            {snapshot.invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex items-center justify-between gap-4 py-3 text-sm"
              >
                <div>
                  <div className="font-semibold">{invitation.invited_email}</div>
                  <div className="text-xs text-[#25303B]/70">
                    Sent {formatDate(invitation.sent_at)}
                    {invitation.status === "pending"
                      ? ` · expires ${formatDate(invitation.expires_at)}`
                      : ""}
                  </div>
                </div>
                <div className="shrink-0 text-xs font-semibold">
                  {statusLabel(invitation.status)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
