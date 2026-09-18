export const dynamic = "force-dynamic";
export const revalidate = 0;

import Image from "next/image";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const APP_STORE_URL = "https://apps.apple.com/gb/app/wobble-strength-balance/id6749583215";
const GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.wobblebalance.app";

export default function InformationPackPage() {
  return (
    <main className={[montserrat.className, "min-h-screen bg-[#A6D5CE] text-[#25303B]"].join(" ")}>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-7 flex items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F9F5EF]/70 px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-black/5">
              <span className="h-2 w-2 rounded-full bg-[#E58B66]" />
              Wobble information pack
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Your place on Wobble
            </h1>
            <p className="mt-2 max-w-prose text-sm text-[#25303B]/80 sm:text-base">
              This page is the hosted information pack. Nothing is attached as a
              file. Use the activation link in your email to claim your place.
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

        <section className="space-y-5 rounded-2xl bg-[#F9F5EF] p-6 shadow-xl ring-1 ring-black/5 sm:p-8">
          <div>
            <h2 className="text-sm font-extrabold">1. Open your invitation email</h2>
            <p className="mt-2 text-sm text-[#25303B]/80">
              Activate using the same email address the pack was sent to. The
              link expires after 14 days.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-extrabold">2. Download the Wobble app</h2>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
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
          <div>
            <h2 className="text-sm font-extrabold">3. Sign in and complete your assessment</h2>
            <p className="mt-2 text-sm text-[#25303B]/80">
              Use the same email and password you created on the activation
              page, then finish onboarding in the app.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
