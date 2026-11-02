export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Choose a new password",
};

import Image from "next/image";
import { Montserrat } from "next/font/google";
import { isRecoveryTokenHash, isResetEmail } from "@/lib/auth/resetPassword";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const fieldClass =
  "mt-2 w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-base shadow-sm placeholder:text-[#25303B]/40 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#A6D5CE]";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    token_hash?: string;
    error?: string;
    saved?: string;
    email?: string;
  }>;
}) {
  const params = await searchParams;
  const tokenHash = params.token_hash?.trim() ?? "";
  const hasToken = isRecoveryTokenHash(tokenHash);
  const saved = params.saved === "1";
  const email = params.email?.trim() ?? "";
  const savedEmail = isResetEmail(email) ? email : "";
  const error = saved ? "" : (params.error ?? "");

  return (
    <main className={[montserrat.className, "min-h-screen bg-[#A6D5CE] text-[#25303B]"].join(" ")}>
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-7">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F9F5EF]/70 px-3 py-1 text-sm font-semibold tracking-wide ring-1 ring-black/5">
                <span className="h-2 w-2 rounded-full bg-[#E58B66]" />
                Wobble app
              </div>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
                Choose a new password
              </h1>
              <p className="mt-2 max-w-prose text-base text-[#25303B]/80 sm:text-lg">
                {saved
                  ? "Your password is updated."
                  : "Opening this page does not change your password."}
              </p>
            </div>
            <div className="justify-self-start sm:justify-self-end">
              <div className="inline-flex rounded-2xl bg-white/30 p-2 ring-1 ring-black/10">
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

        <section className="rounded-2xl bg-[#F9F5EF] p-6 shadow-xl ring-1 ring-black/5 sm:p-8">
          {saved ? (
            <div className="space-y-3 text-base text-[#25303B]/80" role="status">
              <p>Open the Wobble app and tap Log in.</p>
              <p>
                {savedEmail
                  ? `Sign in with ${savedEmail} and the password you just chose.`
                  : "Sign in with the same email and the password you just chose."}
              </p>
            </div>
          ) : hasToken ? (
            <form method="post" action="/api/auth/reset-password" className="space-y-5">
              <input type="hidden" name="token_hash" value={tokenHash} />
              {error === "short" || error === "mismatch" ? (
                <div className="rounded-xl border border-[#E58B66]/40 bg-[#E58B66]/10 p-4 text-sm">
                  {error === "short"
                    ? "Your password must be at least 8 characters."
                    : "Please make sure both passwords match."}
                </div>
              ) : null}
              <div>
                <label className="text-sm font-semibold" htmlFor="password">
                  New password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  placeholder="New password"
                  className={fieldClass}
                />
                <div className="mt-2 text-xs text-[#25303B]/70">At least 8 characters.</div>
              </div>
              <div>
                <label className="text-sm font-semibold" htmlFor="confirm_password">
                  Re-enter password
                </label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  placeholder="Re-enter password"
                  className={fieldClass}
                />
              </div>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#25303B] px-5 py-3 text-sm font-extrabold text-[#F9F5EF] shadow-sm"
              >
                Save password
              </button>
            </form>
          ) : (
            <div className="rounded-xl border border-[#E58B66]/40 bg-[#E58B66]/10 p-4 text-sm">
              {error === "invalid" || error === "failed"
                ? "This reset link has already been used or has run out. Open the Wobble app and ask for a new reset email."
                : "This reset link did not open properly. Open the Wobble app and ask for a new reset email."}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
