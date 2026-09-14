"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AccountMember } from "@/lib/portal/account";
import { PORTAL_LOGIN_PATH } from "@/lib/portal/paths";

const ERRORS: Record<string, string> = {
  invalid_email: "Enter a valid email address.",
  emails_do_not_match: "The two email addresses must match.",
  invalid_role: "Choose Administrator or Viewer.",
  already_member: "That person already has access to this organisation.",
  last_admin: "The last administrator cannot be removed.",
  forbidden_role: "Only administrators can invite or remove people.",
  unknown_member: "That person is no longer on this organisation.",
};

function roleLabel(role: string) {
  if (role === "customer_admin") return "Administrator";
  if (role === "wobble_admin") return "Wobble";
  if (role === "viewer") return "Viewer";
  return role;
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

export default function AccountManager({
  orgId,
  canManage,
  currentUserId,
  initialMembers,
}: {
  orgId: string;
  canManage: boolean;
  currentUserId: string;
  initialMembers: AccountMember[];
}) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [role, setRole] = useState<"customer_admin" | "viewer">("viewer");
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/portal/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          email,
          confirm_email: confirmEmail,
          role,
        }),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        reason?: string;
        message?: string;
        members?: AccountMember[];
      };
      if (!response.ok || !body.ok) {
        setError(ERRORS[body.reason ?? ""] ?? "We could not invite that person.");
        return;
      }
      setMembers(body.members ?? []);
      setEmail("");
      setConfirmEmail("");
      setRole("viewer");
      setMessage(body.message ?? "Invitation sent.");
    } catch {
      setError("We could not invite that person.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(userId: string) {
    setRemovingId(userId);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/portal/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, user_id: userId }),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        reason?: string;
        members?: AccountMember[];
      };
      if (!response.ok || !body.ok) {
        setError(ERRORS[body.reason ?? ""] ?? "We could not remove that person.");
        return;
      }
      if (userId === currentUserId) {
        await fetch("/api/portal/logout", { method: "POST" });
        router.replace(PORTAL_LOGIN_PATH);
        router.refresh();
        return;
      }
      setMembers(body.members ?? []);
      setMessage("Access removed.");
    } catch {
      setError("We could not remove that person.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold">People</h3>
        <p className="mt-2 text-sm text-[#25303B]/80">
          Administrators can invite colleagues and choose whether they can
          manage the organisation or only view it.
        </p>
      </div>

      {canManage ? (
        <form onSubmit={handleInvite} className="space-y-4">
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
          <label className="block">
            <span className="text-sm font-semibold">Role</span>
            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value as "customer_admin" | "viewer")
              }
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm outline-none ring-[#A6D5CE] focus:ring-2"
            >
              <option value="viewer">Viewer</option>
              <option value="customer_admin">Administrator</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-[#25303B] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Send invitation"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-[#25303B]/80">
          Only administrators can invite or remove people. You can still see
          who has access.
        </p>
      )}

      {!canManage && (error || message) ? (
        <div
          className={
            error
              ? "rounded-xl border border-[#E58B66]/40 bg-[#E58B66]/10 p-4 text-sm"
              : "rounded-xl border border-black/10 bg-white/70 p-4 text-sm"
          }
        >
          {error ?? message}
        </div>
      ) : null}

      <div>
        <h4 className="text-sm font-extrabold uppercase tracking-wide text-[#25303B]/70">
          Organisation access
        </h4>
        {members.length === 0 ? (
          <p className="mt-2 text-sm text-[#25303B]/80">
            Nobody has been invited to this organisation yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-black/10">
            {members.map((member) => (
              <li
                key={member.user_id}
                className="flex items-center justify-between gap-4 py-3 text-sm"
              >
                <div>
                  <div className="font-semibold">
                    {member.email}
                    {member.user_id === currentUserId ? " (you)" : ""}
                  </div>
                  <div className="text-xs text-[#25303B]/70">
                    {roleLabel(member.role)} · added {formatDate(member.created_at)}
                  </div>
                </div>
                {canManage ? (
                  member.can_remove ? (
                    <button
                      type="button"
                      onClick={() => handleRemove(member.user_id)}
                      disabled={removingId === member.user_id}
                      className="shrink-0 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                    >
                      {removingId === member.user_id ? "Removing…" : "Remove"}
                    </button>
                  ) : (
                    <div className="shrink-0 text-xs text-[#25303B]/60">
                      Last administrator
                    </div>
                  )
                ) : (
                  <div className="shrink-0 text-xs font-semibold">
                    {roleLabel(member.role)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
