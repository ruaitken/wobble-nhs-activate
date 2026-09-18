export const dynamic = "force-dynamic";
export const revalidate = 0;

import Image from "next/image";
import { Suspense } from "react";
import PortalLoginForm from "./LoginForm";

export default function PortalLoginPage() {
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
              We will email you a one-time link. Existing customer dashboard
              links are unchanged and do not need this login.
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
          <Suspense>
            <PortalLoginForm />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
