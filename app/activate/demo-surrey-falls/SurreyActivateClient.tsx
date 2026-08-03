"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { SURREY_GEO, findRegion } from "@/lib/surreyDemo";

const APP_STORE_URL = "https://apps.apple.com/gb/app/wobble-strength-balance/id6749583215";
const GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.wobblebalance.app";

type Status = "idle" | "error" | "success";
type Result = { title: string; message: string } | null;

export default function SurreyActivateClient({ fontClassName }: { fontClassName: string }) {
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // Cascading location capture: Region (unitary council) → Borough → Town.
  const [region, setRegion] = useState("");
  const [borough, setBorough] = useState("");
  const [town, setTown] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Result>(null);

  const boroughs = useMemo(() => findRegion(region)?.boroughs ?? [], [region]);
  const towns = useMemo(
    () => boroughs.find((b) => b.borough === borough)?.towns ?? [],
    [boroughs, borough]
  );

  const isSuccess = status === "success";

  function handleRegionChange(value: string) {
    setRegion(value);
    setBorough("");
    setTown("");
  }

  function handleBoroughChange(value: string) {
    setBorough(value);
    setTown("");
  }

  function handleContinue() {
    const trimmedEmail = email.trim();
    const trimmedConfirmEmail = confirmEmail.trim();

    if (!region || !borough || !town) {
      setStatus("error");
      setResult({
        title: "Tell us where you're based",
        message: "Please choose your council area, district and town so Surrey can plan services.",
      });
      return;
    }

    if (!trimmedEmail || !trimmedConfirmEmail || !password || !confirmPassword) {
      setStatus("error");
      setResult({
        title: "Check your details",
        message: "Please enter your email, re-enter your email, password, and re-enter your password.",
      });
      return;
    }

    if (trimmedEmail.toLowerCase() !== trimmedConfirmEmail.toLowerCase()) {
      setStatus("error");
      setResult({ title: "Emails do not match", message: "Please make sure both email fields match." });
      return;
    }

    if (password.length < 8) {
      setStatus("error");
      setResult({ title: "Password too short", message: "Your password must be at least 8 characters." });
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setResult({ title: "Passwords do not match", message: "Please make sure both password fields match." });
      return;
    }

    // Front-end-only: simulate activation. No network call, no Supabase.
    setSubmitting(true);
    setStatus("idle");
    setResult(null);

    setTimeout(() => {
      setPassword("");
      setConfirmPassword("");
      setSubmitting(false);
      setStatus("success");
      setResult({
        title: "Account activated — you now have access to Wobble.",
        message:
          "Please download the app and complete onboarding and the assessment. Your journey to building better balance and strength begins now.",
      });
    }, 600);
  }

  return (
    <main className={[fontClassName, "min-h-screen bg-[#A6D5CE] text-[#25303B]"].join(" ")}>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-7">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F9F5EF]/70 px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-black/5">
                <span className="h-2 w-2 rounded-full bg-[#E58B66]" />
                Surrey County Council · Falls Prevention
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Activate your free Wobble access
              </h1>
              <p className="mt-2 max-w-prose text-sm text-[#25303B]/80 sm:text-base">
                Surrey County Council has partnered with Wobble to help residents build strength,
                balance and confidence, and reduce the risk of falls.
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

        <div className="mb-6 rounded-2xl border border-[#E7B450]/50 bg-[#E7B450]/20 p-4 text-sm shadow-sm ring-1 ring-black/5">
          <div className="font-extrabold">Demo only</div>
          <div className="mt-1 text-[#25303B]/75">
            Illustrative mock-up for Surrey County Council. No data is stored and no account is created.
          </div>
        </div>

        <section className="rounded-2xl bg-[#F9F5EF] shadow-xl ring-1 ring-black/5">
          <div className="p-6 sm:p-8">
            <div className="space-y-7">
              <div>
                <div className="text-sm font-extrabold">Link verified</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="h-full min-h-[92px] rounded-xl border border-black/10 bg-white/50 p-4">
                    <div className="text-xs font-semibold text-[#25303B]/70">Council</div>
                    <div className="mt-1 text-sm font-bold">Surrey County Council</div>
                  </div>
                  <div className="h-full min-h-[92px] rounded-xl border border-black/10 bg-white/50 p-4">
                    <div className="text-xs font-semibold text-[#25303B]/70">Service</div>
                    <div className="mt-1 text-sm font-bold">Falls Prevention Programme</div>
                  </div>
                  <div className="h-full min-h-[92px] rounded-xl border border-black/10 bg-white/50 p-4">
                    <div className="text-xs font-semibold text-[#25303B]/70">Access duration</div>
                    <div className="mt-1 text-sm font-bold">365 days</div>
                  </div>
                </div>
              </div>

              {/* Location capture (council links only) */}
              <div>
                <div className="text-sm font-extrabold">Where are you based?</div>
                <p className="mt-1 text-xs text-[#25303B]/70">
                  This helps Surrey understand uptake across the county. From April 2027 Surrey moves to
                  two councils — East Surrey and West Surrey.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-sm font-semibold">Council area</label>
                    <select
                      value={region}
                      onChange={(e) => handleRegionChange(e.target.value)}
                      disabled={submitting || isSuccess}
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-base shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A6D5CE]"
                    >
                      <option value="">Select…</option>
                      {SURREY_GEO.map((r) => (
                        <option key={r.region} value={r.region}>
                          {r.region}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold">District / borough</label>
                    <select
                      value={borough}
                      onChange={(e) => handleBoroughChange(e.target.value)}
                      disabled={submitting || isSuccess || !region}
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-base shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A6D5CE] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">{region ? "Select…" : "Choose council area first"}</option>
                      {boroughs.map((b) => (
                        <option key={b.borough} value={b.borough}>
                          {b.borough}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Town</label>
                    <select
                      value={town}
                      onChange={(e) => setTown(e.target.value)}
                      disabled={submitting || isSuccess || !borough}
                      className="mt-2 w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-base shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A6D5CE] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">{borough ? "Select…" : "Choose district first"}</option>
                      {towns.map((t) => (
                        <option key={t.town} value={t.town}>
                          {t.town}
                        </option>
                      ))}
                    </select>
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
                    placeholder="example@email.com"
                    disabled={submitting || isSuccess}
                    className="mt-2 w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-base shadow-sm placeholder:text-[#25303B]/40 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A6D5CE]"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Re-enter email</label>
                  <input
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="example@email.com"
                    disabled={submitting || isSuccess}
                    className="mt-2 w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-base shadow-sm placeholder:text-[#25303B]/40 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A6D5CE]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">Password</label>
                  <div className="relative mt-2">
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPasswords ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Password"
                      disabled={submitting || isSuccess}
                      minLength={8}
                      className="w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 pr-16 text-base shadow-sm placeholder:text-[#25303B]/40 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A6D5CE]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((prev) => !prev)}
                      disabled={submitting || isSuccess}
                      aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#25303B]/70 transition hover:text-[#25303B] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {showPasswords ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-[#25303B]/70">At least 8 characters.</div>
                </div>
                <div>
                  <label className="text-sm font-semibold">Re-enter password</label>
                  <div className="relative mt-2">
                    <input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      type={showPasswords ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      disabled={submitting || isSuccess}
                      minLength={8}
                      className="w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 pr-16 text-base shadow-sm placeholder:text-[#25303B]/40 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A6D5CE]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((prev) => !prev)}
                      disabled={submitting || isSuccess}
                      aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#25303B]/70 transition hover:text-[#25303B] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {showPasswords ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-[#25303B]/70">At least 8 characters.</div>
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
                    status === "success"
                      ? "border-[#E7B450]/50 bg-[#E7B450]/15"
                      : "border-[#E58B66]/40 bg-[#E58B66]/10",
                  ].join(" ")}
                  role="status"
                  aria-live="polite"
                >
                  <div className="text-sm font-extrabold">{result.title}</div>
                  <div className="mt-1 text-sm text-[#25303B]/80">{result.message}</div>

                  {status === "success" && (
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
          </div>
        </section>

        <footer className="mt-5 text-xs text-[#25303B]/70">
          Trouble signing in? Double-check your email and password, or contact your Surrey falls
          prevention team.
        </footer>
      </div>
    </main>
  );
}
