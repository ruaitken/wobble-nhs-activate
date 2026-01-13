"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import Image from "next/image";

type ApiResponse =
  | {
      ok: true;
      campaign: {
        id: string;
        trust_name: string | null;
        service_name: string | null;
        seat_limit: number | string | null;
        seats_used: number | string | null;
        is_active: boolean;
        starts_at: string | null;
        claim_deadline_at: string | null;
        claim_duration_days: number | string | null;
      };
    }
  | { ok: false; reason: string; error?: string };

const APP_STORE_URL = "https://apps.apple.com/gb/app/wobble-strength-balance/id6749583215";
const GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.wobblebalance.app";

type ActivationStatus = "idle" | "error" | "success";
type ActivationResult = { title: string; message: string } | null;

export default function ActivateClient({ fontClassName }: { fontClassName: string }) {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("campaign_id");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [activationStatus, setActivationStatus] = useState<ActivationStatus>("idle");
  const [result, setResult] = useState<ActivationResult>(null);

  // -----------------------------
  // 1) Validate campaign link
  // -----------------------------
  useEffect(() => {
    async function run() {
      if (!campaignId) {
        setData({ ok: false, reason: "missing_campaign_id" });
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/nhs/validate?campaign_id=${encodeURIComponent(campaignId)}`
        );
        const json = (await res.json()) as ApiResponse;
        setData(json);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        setData({ ok: false, reason: "network_error", error: message });
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [campaignId]);

  // -----------------------------
  // 2) Handle submit
  // -----------------------------
  async function handleContinue() {
    if (!campaignId || !data || data.ok !== true) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setActivationStatus("error");
      setResult({ title: "Check your details", message: "Please enter your email and password." });
      return;
    }

    // IMPORTANT: Create Supabase lazily and only in the browser.
    // Even though this is a Client Component, Next can still evaluate modules during
    // build/prerender. Avoiding a module-level Supabase singleton prevents Vercel build crashes.
    const supabase = getSupabaseBrowserClient();

    setSubmitting(true);
    setActivationStatus("idle");
    setResult(null);

    try {
      // A) Try sign in
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      // B) If fails, try sign up instead
      if (error) {
        const signUp = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });

        if (signUp.error) {
          throw new Error(signUp.error.message);
        }
      }

      // C) Get session (this is critical)
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setActivationStatus("error");
        setResult({
          title: "Signed in, but you need to confirm email",
          message:
            "No session token was found. If email confirmation is enabled, please confirm your email then try again.",
        });
        return;
      }

      // D) Call backend → which calls Edge Function
      const res = await fetch("/api/nhs/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          access_token: accessToken,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setActivationStatus("error");
        setResult({
          title: "Activation failed",
          message: String(json.error || json.reason || "Unknown error"),
        });
        return;
      }

      setPassword("");
      setActivationStatus("success");
      setResult({
        title: "Account activated — you now have access to Wobble.",
        message:
          "Please download the app and complete onboarding and the assessment. Your journey to building better balance and strength begins now.",
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setActivationStatus("error");
      setResult({ title: "Something went wrong", message: msg });
    } finally {
      setSubmitting(false);
    }
  }

  const isSuccess = activationStatus === "success";

  return (
    <main className={[fontClassName, "min-h-screen bg-[#A6D5CE] text-[#25303B]"].join(" ")}>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-7">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F9F5EF]/70 px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-black/5">
                <span className="h-2 w-2 rounded-full bg-[#E58B66]" />
                Wobble NHS access
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                NHS Activation
              </h1>
              <p className="mt-2 max-w-prose text-sm text-[#25303B]/80 sm:text-base">
                We’ll verify your link, sign you up, and activate access.
              </p>
            </div>

            <div className="justify-self-start sm:justify-self-end">
              <div className="inline-flex rounded-2xl bg-white/30 p-2 ring-1 ring-black/10 backdrop-blur-sm">
                <Image
                  src="/wobble-logo.svg"
                  alt="Wobble"
                  width={108}
                  height={108}
                  priority
                  className="rounded-xl opacity-85"
                />
              </div>
            </div>
          </div>
        </header>

        <section className="rounded-2xl bg-[#F9F5EF] shadow-xl ring-1 ring-black/5">
          <div className="p-6 sm:p-8">
            {!campaignId && (
              <div className="rounded-xl border border-[#E58B66]/40 bg-[#E58B66]/10 p-4">
                <div className="text-sm font-bold">Missing campaign id</div>
                <div className="mt-1 text-sm text-[#25303B]/80">
                  Please scan the QR code again.
                </div>
              </div>
            )}

            {campaignId && loading && (
              <div className="rounded-xl border border-black/10 bg-white/40 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-[#25303B]/50" />
                  <div className="text-sm font-semibold">Checking your link…</div>
                </div>
              </div>
            )}

            {campaignId && !loading && data?.ok === false && (
              <div className="rounded-xl border border-[#E58B66]/40 bg-[#E58B66]/10 p-4">
                <div className="text-sm font-bold">Sorry — this link can’t be used</div>
                <div className="mt-1 text-sm text-[#25303B]/80">Reason: {data.reason}</div>
                {data.error && (
                  <div className="mt-2 text-xs text-[#25303B]/70">
                    Details: {data.error}
                  </div>
                )}
              </div>
            )}

            {campaignId && !loading && data?.ok === true && (
              <div className="space-y-7">
                <div>
                  <div className="text-sm font-extrabold">Link verified</div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="h-full min-h-[92px] rounded-xl border border-black/10 bg-white/50 p-4">
                      <div className="text-xs font-semibold text-[#25303B]/70">Trust</div>
                      <div className="mt-1 text-sm font-bold">
                        {data.campaign.trust_name ?? "NHS Trust"}
                      </div>
                    </div>
                    <div className="h-full min-h-[92px] rounded-xl border border-black/10 bg-white/50 p-4">
                      <div className="text-xs font-semibold text-[#25303B]/70">Service</div>
                      <div className="mt-1 text-sm font-bold">
                        {data.campaign.service_name ?? "—"}
                      </div>
                    </div>
                    <div className="h-full min-h-[92px] rounded-xl border border-black/10 bg-white/50 p-4">
                      <div className="text-xs font-semibold text-[#25303B]/70">
                        Access duration
                      </div>
                      <div className="mt-1 text-sm font-bold">
                        {data.campaign.claim_duration_days != null
                          ? `${data.campaign.claim_duration_days} days`
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold">Email</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@nhs.uk"
                      disabled={submitting || isSuccess}
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-base shadow-sm placeholder:text-[#25303B]/40 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A6D5CE]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Password</label>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      autoComplete="current-password"
                      placeholder="Password"
                      disabled={submitting || isSuccess}
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-base shadow-sm placeholder:text-[#25303B]/40 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A6D5CE]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    onClick={handleContinue}
                    disabled={submitting || isSuccess}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-[#25303B] px-5 py-3 text-sm font-extrabold text-[#F9F5EF] shadow-sm transition hover:bg-[#25303B]/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {submitting ? "Activating…" : "Continue"}
                  </button>
                  <div className="text-xs text-[#25303B]/70 sm:text-right">
                    By continuing, you’ll create or sign in to your Wobble account.
                  </div>
                </div>

                {result && (
                  <div
                    className={[
                      "rounded-xl border p-4",
                      activationStatus === "success"
                        ? "border-[#E7B450]/50 bg-[#E7B450]/15"
                        : "border-[#E58B66]/40 bg-[#E58B66]/10",
                    ].join(" ")}
                    role="status"
                    aria-live="polite"
                  >
                    <div className="text-sm font-extrabold">{result.title}</div>
                    <div className="mt-1 text-sm text-[#25303B]/80">{result.message}</div>

                    {activationStatus === "success" && (
                      <div className="mt-4">
                        <ol className="list-decimal space-y-3 pl-5 text-sm text-[#25303B]/85">
                          <li>
                            <div className="font-semibold text-[#25303B]">Download Wobble</div>
                            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                              <a
                                href={APP_STORE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center rounded-xl bg-[#25303B] px-4 py-2 text-sm font-extrabold text-[#F9F5EF] shadow-sm transition hover:bg-[#25303B]/90"
                              >
                                Download on the App Store
                              </a>
                              <a
                                href={GOOGLE_PLAY_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white/60 px-4 py-2 text-sm font-extrabold text-[#25303B] shadow-sm transition hover:bg-white/80"
                              >
                                Get it on Google Play
                              </a>
                            </div>
                          </li>
                          <li>
                            <div className="font-semibold text-[#25303B]">Sign in</div>
                            <div className="mt-1">Use the same email and password you entered here.</div>
                          </li>
                          <li>
                            <div className="font-semibold text-[#25303B]">Complete onboarding &amp; assessment</div>
                          </li>
                        </ol>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <footer className="mt-5 text-xs text-[#25303B]/70">
          Trouble signing in? Double-check your email and password, or contact your NHS
          service team.
        </footer>
      </div>
    </main>
  );
}

