// Vercel can try to prerender App Router pages at build time.
// This route is user-specific (query params + auth) and should not be precomputed.
//
// IMPORTANT: These exports must live in a *server* module.
// If you export them from a `"use client"` page, Next may treat them as client exports,
// and the build worker will fail while attempting to read the value during prerender.
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";
import { Montserrat } from "next/font/google";
import ActivateClient from "./ActivateClient";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

function ActivateFallback({ fontClassName }: { fontClassName: string }) {
  return (
    <main className={[fontClassName, "min-h-screen bg-[#A6D5CE] text-[#25303B]"].join(" ")}>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <section className="rounded-2xl bg-[#F9F5EF] shadow-xl ring-1 ring-black/5">
          <div className="p-6 sm:p-8">
            <div className="rounded-xl border border-black/10 bg-white/40 p-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 animate-pulse rounded-full bg-[#25303B]/50" />
                <div className="text-sm font-semibold">Checking your link…</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ActivatePage() {
  // We render the entire UI as a Client Component (interactivity + Supabase Auth),
  // but keep the page module itself server-side so Next can safely read the
  // `dynamic`/`revalidate` exports without crashing during Vercel builds.
  // useSearchParams() must sit inside Suspense or the check can hang forever.
  return (
    <Suspense fallback={<ActivateFallback fontClassName={montserrat.className} />}>
      <ActivateClient fontClassName={montserrat.className} />
    </Suspense>
  );
}
