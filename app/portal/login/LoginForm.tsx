"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { safePortalPath } from "@/lib/portal/paths";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "That sign-in link is missing information. Please request a new one.",
  invalid_link: "That sign-in link is invalid or has already been used. Please request a new one.",
};

export default function PortalLoginForm() {
  const searchParams = useSearchParams();
  const next = safePortalPath(searchParams.get("next"));
  const errorCode = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(
    errorCode ? ERROR_MESSAGES[errorCode] ?? "Sign-in did not complete. Please try again." : null
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setSent(false);

    try {
      const response = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, next }),
      });
      const body = (await response.json()) as { ok?: boolean; reason?: string; message?: string };
      if (!response.ok || !body.ok) {
        throw new Error(body.reason ?? "Could not send sign-in link");
      }
      setSent(true);
    } catch {
      setFormError("We could not send a sign-in link just now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <div className="rounded-xl border border-[#E58B66]/40 bg-[#E58B66]/10 p-4 text-sm">
          {formError}
        </div>
      )}
      {sent && (
        <div className="rounded-xl border border-black/10 bg-white/70 p-4 text-sm">
          If this email is registered for the customer portal, we have sent a
          sign-in link. It can be used once and expires after an hour.
        </div>
      )}
      <label className="block">
        <span className="text-sm font-semibold">Work email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm outline-none ring-[#A6D5CE] focus:ring-2"
          placeholder="you@organisation.nhs.uk"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-[#25303B] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
