export const dynamic = "force-dynamic";
export const revalidate = 0;

import Image from "next/image";
import Link from "next/link";
import { portalOtpType } from "@/lib/portal/magicLink";
import { PORTAL_LOGIN_PATH, safePortalPath } from "@/lib/portal/paths";

export default async function ConfirmSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
}) {
  const params = await searchParams;
  const tokenHash = params.token_hash?.trim() ?? "";
  const next = safePortalPath(params.next);
  const type = portalOtpType(params.type);

  return (
    <main className="min-h-screen bg-[#A6D5CE] text-[#25303B]">
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-7 flex items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F9F5EF]/70 px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-black/5">
              <span className="h-2 w-2 rounded-full bg-[#E58B66]" />
              Customer portal
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Sign in
            </h1>
            <p className="mt-2 max-w-prose text-sm text-[#25303B]/80 sm:text-base">
              Press Sign in to open the customer portal. Opening this page does
              not sign you in.
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
          {tokenHash ? (
            <form method="post" action="/api/auth/confirm" className="space-y-5">
              <input type="hidden" name="token_hash" value={tokenHash} />
              <input type="hidden" name="type" value={type} />
              <input type="hidden" name="next" value={next} />
              <button
                type="submit"
                className="w-full rounded-xl bg-[#25303B] px-4 py-3 text-sm font-semibold text-white"
              >
                Sign in
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E58B66]/40 bg-[#E58B66]/10 p-4 text-sm">
                That sign-in link is missing information. Please request a new one.
              </div>
              <Link
                href={PORTAL_LOGIN_PATH}
                className="block w-full rounded-xl bg-[#25303B] px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Request a new link
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
