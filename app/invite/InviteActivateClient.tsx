"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

type InviteResponse =
  | {
      ok: true;
      status: string;
      open: boolean;
      campaign_id: string;
      programme_name: string;
      trust_name: string | null;
      invited_email: string;
      expires_at: string;
      ask_consent: boolean;
      first_name: string;
      last_name: string;
    }
  | { ok: false; reason: string };

const APP_STORE_URL = "https://apps.apple.com/gb/app/wobble-strength-balance/id6749583215";
const GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.wobblebalance.app";

export default function InviteActivateClient({
  token,
  fontClassName,
}: {
  token: string;
  fontClassName: string;
}) {
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteResponse | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [consentChoice, setConsentChoice] = useState<"" | "yes" | "no">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [appAccess, setAppAccess] = useState<"granted" | "pending" | null>(null);

  useEffect(() => {
    async function run() {
      try {
        const response = await fetch(`/api/invite/${encodeURIComponent(token)}`);
        const body = (await response.json()) as InviteResponse;
        setInvite(body);
        if (body.ok) {
          setFirstName(body.first_name);
          setLastName(body.last_name);
        }
      } catch {
        setInvite({ ok: false, reason: "network_error" });
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [token]);

  async function handleContinue() {
    if (!invite || invite.ok !== true || !invite.open) return;
    if (password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Please make sure both passwords match.");
      return;
    }
    if (invite.ask_consent && consentChoice === "") {
      setError("Please choose whether your organisation can see you by name.");
      return;
    }
    const nameRequired = !invite.ask_consent || consentChoice === "yes";
    if (nameRequired && (!firstName.trim() || !lastName.trim())) {
      setError("Please enter your first and last name.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invite.invited_email,
        password,
      });
      if (signInError) {
        const signUp = await supabase.auth.signUp({
          email: invite.invited_email,
          password,
        });
        if (signUp.error) throw new Error(signUp.error.message);
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setError(
          "Signed in, but you may need to confirm your email before this place can be activated."
        );
        return;
      }

      const response = await fetch("/api/invite/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          access_token: accessToken,
          first_name: firstName,
          last_name: lastName,
          consented: invite.ask_consent ? consentChoice === "yes" : undefined,
        }),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        reason?: string;
        app_access?: "granted" | "pending";
      };
      if (!response.ok || !body.ok) {
        if (body.reason === "email_mismatch") {
          setError("This invitation can only be activated with the invited email address.");
          return;
        }
        if (body.reason === "invite_expired") {
          setError("This invitation has expired. Ask your organisation to send a new pack.");
          return;
        }
        if (body.reason === "missing_name") {
          setError("Please enter your first and last name.");
          return;
        }
        if (body.reason === "consent_required") {
          setError("Please choose whether your organisation can see you by name.");
          return;
        }
        setError("We could not activate this place. Please try again.");
        return;
      }
      setAppAccess(body.app_access === "pending" ? "pending" : "granted");
      setSuccess(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={[fontClassName, "min-h-screen bg-[#A6D5CE] text-[#25303B]"].join(" ")}>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-7 flex items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F9F5EF]/70 px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-black/5">
              <span className="h-2 w-2 rounded-full bg-[#E58B66]" />
              Wobble invitation
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Activate your place
            </h1>
            <p className="mt-2 text-sm text-[#25303B]/80">
              This link only works for the invited email address.
            </p>
          </div>
          <div className="inline-flex rounded-2xl bg-white/30 p-2 ring-1 ring-black/10">
            <Image
              src="/wobble-logo.svg"
              alt="Wobble"
              width={88}
              height={88}
              priority
              className="rounded-xl opacity-85"
            />
          </div>
        </header>

        <section className="rounded-2xl bg-[#F9F5EF] p-6 shadow-xl ring-1 ring-black/5 sm:p-8">
          {loading && <p className="text-sm font-semibold">Checking your invitation…</p>}

          {!loading && invite?.ok === false && (
            <div className="rounded-xl border border-[#E58B66]/40 bg-[#E58B66]/10 p-4 text-sm">
              This invitation link cannot be used. Ask your organisation to send
              a new information pack.
            </div>
          )}

          {!loading && invite?.ok === true && !invite.open && (
            <div className="rounded-xl border border-[#E58B66]/40 bg-[#E58B66]/10 p-4 text-sm">
              {invite.status === "activated"
                ? "This invitation has already been used."
                : "This invitation has expired. Ask your organisation to send a new pack."}
            </div>
          )}

          {!loading && invite?.ok === true && invite.open && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-black/10 bg-white/50 p-4">
                  <div className="text-xs font-semibold text-[#25303B]/70">Programme</div>
                  <div className="mt-1 text-sm font-bold">{invite.programme_name}</div>
                </div>
                <div className="rounded-xl border border-black/10 bg-white/50 p-4">
                  <div className="text-xs font-semibold text-[#25303B]/70">Invited email</div>
                  <div className="mt-1 text-sm font-bold">{invite.invited_email}</div>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-[#E58B66]/40 bg-[#E58B66]/10 p-4 text-sm">
                  {error}
                </div>
              )}

              {success ? (
                <div className="rounded-xl border border-[#E7B450]/50 bg-[#E7B450]/15 p-4">
                  <div className="text-sm font-extrabold">
                    {appAccess === "pending"
                      ? "Your place is reserved"
                      : "Account activated — you now have access to Wobble."}
                  </div>
                  <p className="mt-2 text-sm text-[#25303B]/80">
                    {appAccess === "pending"
                      ? "Download the app and sign in with this email shortly. App access is being finished."
                      : `Download the app and sign in with ${invite.invited_email}.`}
                  </p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <a
                      href={APP_STORE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-xl bg-[#25303B] px-4 py-2 text-sm font-extrabold text-[#F9F5EF]"
                    >
                      Download on the App Store
                    </a>
                    <a
                      href={GOOGLE_PLAY_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white/60 px-4 py-2 text-sm font-extrabold"
                    >
                      Get it on Google Play
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-semibold">First name</span>
                      <input
                        type="text"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        disabled={submitting}
                        className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm outline-none ring-[#A6D5CE] focus:ring-2"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold">Last name</span>
                      <input
                        type="text"
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        disabled={submitting}
                        className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm outline-none ring-[#A6D5CE] focus:ring-2"
                      />
                    </label>
                  </div>
                  {invite.ask_consent && consentChoice === "no" && (
                    <div className="rounded-xl border border-black/10 bg-white/70 p-4 text-sm text-[#25303B]/80">
                      You can leave the name boxes blank. You do not need to
                      share your name if you do not want your organisation to
                      see you by name.
                    </div>
                  )}

                  {invite.ask_consent && (
                    <fieldset className="space-y-3">
                      <legend className="text-sm font-semibold">
                        Named reporting
                      </legend>
                      <p className="text-sm text-[#25303B]/80">
                        Your organisation can always see anonymised group
                        results for this programme. If you agree, authorised
                        staff can also see your name and activity. This is
                        optional. You still get Wobble if you say no.
                      </p>
                      <label className="flex items-start gap-3 rounded-xl border border-black/10 bg-white/70 p-3 text-sm">
                        <input
                          type="radio"
                          name="reporting-consent"
                          checked={consentChoice === "yes"}
                          onChange={() => setConsentChoice("yes")}
                          disabled={submitting}
                          className="mt-1"
                        />
                        <span>
                          Yes — show my name and activity to my organisation
                        </span>
                      </label>
                      <label className="flex items-start gap-3 rounded-xl border border-black/10 bg-white/70 p-3 text-sm">
                        <input
                          type="radio"
                          name="reporting-consent"
                          checked={consentChoice === "no"}
                          onChange={() => setConsentChoice("no")}
                          disabled={submitting}
                          className="mt-1"
                        />
                        <span>
                          No — include me in group totals only
                        </span>
                      </label>
                    </fieldset>
                  )}

                  <label className="block">
                    <span className="text-sm font-semibold">Password</span>
                    <input
                      type="password"
                      minLength={8}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={submitting}
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm outline-none ring-[#A6D5CE] focus:ring-2"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold">Re-enter password</span>
                    <input
                      type="password"
                      minLength={8}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      disabled={submitting}
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm outline-none ring-[#A6D5CE] focus:ring-2"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={submitting}
                    className="rounded-xl bg-[#25303B] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {submitting ? "Activating…" : "Activate with this email"}
                  </button>
                  <p className="text-xs text-[#25303B]/70">
                    The existing campaign activation links are unchanged. This
                    invitation only works for {invite.invited_email}.
                  </p>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
