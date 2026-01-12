// Vercel can try to prerender App Router pages at build time.
// This route is user-specific (query params + auth) and should not be precomputed.
//
// IMPORTANT: These exports must live in a *server* module.
// If you export them from a `"use client"` page, Next may treat them as client exports,
// and the build worker will fail while attempting to read the value during prerender.
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Montserrat } from "next/font/google";
import ActivateClient from "./ActivateClient";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function ActivatePage() {
  // We render the entire UI as a Client Component (interactivity + Supabase Auth),
  // but keep the page module itself server-side so Next can safely read the
  // `dynamic`/`revalidate` exports without crashing during Vercel builds.
  return <ActivateClient fontClassName={montserrat.className} />;
}

