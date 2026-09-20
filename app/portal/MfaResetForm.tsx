"use client";

import { useState } from "react";

const ERRORS: Record<string, string> = {
  invalid_email: "Enter a valid email address.",
  unknown_user: "No Auth user was found for that email.",
  mfa_required: "Complete your own authenticator check first.",
  forbidden_role: "Only Wobble administrators can reset authenticators.",
};

export default function MfaResetForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/portal/admin/mfa-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        reason?: string;
        message?: string;
      };
      if (!response.ok || !body.ok) {
        setError(ERRORS[body.reason ?? ""] ?? "We could not reset that authenticator.");
        return;
      }
      setMessage(body.message ?? "Authenticator reset.");
      setEmail("");
    } catch {
      setError("We could not reset that authenticator.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4 border-t border-black/10 pt-6">
      <h2 className="text-lg font-extrabold">Reset authenticator</h2>
      <p className="text-sm text-[#25303B]/80">
        Use this if an administrator loses their authenticator app. They sign
        in with the email link again and set up a new one.
      </p>
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
        <span className="text-sm font-semibold">Staff email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm outline-none ring-[#A6D5CE] focus:ring-2"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-[#25303B] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {submitting ? "Resetting…" : "Reset authenticator"}
      </button>
    </form>
  );
}
