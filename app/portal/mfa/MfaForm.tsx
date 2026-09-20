"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortalBrowserClient } from "@/lib/supabase/browser";

type Mode = "loading" | "enroll" | "challenge";

export default function PortalMfaForm({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("loading");
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      const supabase = createPortalBrowserClient();
      const factors = await supabase.auth.mfa.listFactors();
      if (cancelled) return;
      if (factors.error) {
        setError("We could not check your authenticator status. Please try again.");
        setMode("challenge");
        return;
      }

      const verified = (factors.data.totp ?? [])[0];
      if (verified) {
        setFactorId(verified.id);
        setMode("challenge");
        return;
      }

      for (const leftover of factors.data.all ?? []) {
        if (leftover.factor_type === "totp" && leftover.status === "unverified") {
          await supabase.auth.mfa.unenroll({ factorId: leftover.id });
        }
      }

      const enrolled = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Wobble portal",
      });
      if (cancelled) return;
      if (enrolled.error || !enrolled.data) {
        setError("We could not start authenticator setup. Please try again.");
        setMode("enroll");
        return;
      }

      setFactorId(enrolled.data.id);
      setQr(enrolled.data.totp.qr_code);
      setSecret(enrolled.data.totp.secret);
      setMode("enroll");
    }

    void prepare();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!factorId || code.trim().length < 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const supabase = createPortalBrowserClient();
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error || !challenge.data) {
        throw new Error(challenge.error?.message ?? "challenge_failed");
      }
      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: code.trim(),
      });
      if (verify.error) {
        throw new Error(verify.error.message);
      }
      await fetch("/api/portal/mfa/complete", { method: "POST" });
      router.replace(next);
      router.refresh();
    } catch {
      setError("That code was not accepted. Check the app and try the latest code.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-[#E58B66]/40 bg-[#E58B66]/10 p-4 text-sm">
          {error}
        </div>
      )}

      {mode === "loading" && (
        <p className="text-sm font-semibold">Checking authenticator setup…</p>
      )}

      {mode === "enroll" && (
        <>
          <p className="text-sm text-[#25303B]/80">
            Scan this QR code with an authenticator app such as 1Password,
            Google Authenticator, or Authy. Then type the 6-digit code.
          </p>
          {qr ? (
            <div className="flex justify-center rounded-xl border border-black/10 bg-white p-4">
              {/* QR is an SVG data URL from Supabase Auth */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="Authenticator QR code" className="h-48 w-48" />
            </div>
          ) : null}
          {secret ? (
            <p className="break-all text-xs text-[#25303B]/70">
              If you cannot scan, enter this key instead: {secret}
            </p>
          ) : null}
        </>
      )}

      {mode === "challenge" && (
        <p className="text-sm text-[#25303B]/80">
          Enter the 6-digit code from your authenticator app to open named
          lists and admin tools.
        </p>
      )}

      {mode !== "loading" && (
        <>
          <label className="block">
            <span className="text-sm font-semibold">Authenticator code</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm outline-none ring-[#A6D5CE] focus:ring-2"
              placeholder="123456"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#25303B] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Checking…" : "Continue"}
          </button>
          <p className="text-xs text-[#25303B]/70">
            Lost your authenticator? Email enquiries@wobblebalance.com and a
            Wobble administrator can reset it.
          </p>
        </>
      )}
    </form>
  );
}
