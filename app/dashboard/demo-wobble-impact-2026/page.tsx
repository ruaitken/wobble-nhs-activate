import { Montserrat } from "next/font/google";
import Image from "next/image";
import { Dashboard, type Stats } from "../[token]/DashboardClient";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const DEMO_STATS: Extract<Stats, { found: true; suppressed: false }> = {
  found: true,
  suppressed: false,
  campaign_id: "DEMO_WOBBLE_IMPACT_2026",
  trust_name: "Wobble Demo Service",
  service_name: "Community Strength & Balance Programme",
  enrolled: 42,
  seat_limit: 50,
  seats_remaining: 8,
  active_users: 33,
  engagement_rate_pct: 79,
  active_last_7d: 24,
  total_minutes: 7123,
  total_workouts: 386,
  best_streak: 28,
  top_member_minutes: 684,
  highest_weekly_minutes: 142,
  avg_active_member_minutes: 216,
  avg_minutes_per_active_week: 46,
  avg_sessions_per_active_week: 4,
  age: [
    { label: "65-74", n: 16, pct: 38 },
    { label: "50-64", n: 12, pct: 29 },
    { label: "75+", n: 9, pct: 21 },
    { label: "Under 50", n: 5, pct: 12 },
  ],
  sex: [
    { label: "Female", n: 26, pct: 62 },
    { label: "Male", n: 14, pct: 33 },
    { label: "Unknown", n: 2, pct: 5 },
  ],
  outcomes: {
    suppressed: false,
    paired_members: 18,
    sit_to_stand: { uplift_pct: 42, maintained_pct: 88 },
    balance: { uplift_pct: 24, maintained_pct: 82 },
    confidence: { uplift_pct: 18, maintained_pct: 90 },
    falls: { change_pct: -32, reduced_pct: 80 },
  },
};

export default function DemoDashboardPage() {
  return (
    <main className={[montserrat.className, "min-h-screen bg-[#A6D5CE] text-[#25303B]"].join(" ")}>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-7 flex items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F9F5EF]/70 px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-black/5">
              <span className="h-2 w-2 rounded-full bg-[#E58B66]" />
              Demo dashboard
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Wobble impact dashboard
            </h1>
            <p className="mt-2 max-w-prose text-sm text-[#25303B]/80 sm:text-base">
              Sample anonymised data for demonstration only.
            </p>
          </div>
          <div className="inline-flex rounded-2xl bg-white/30 p-2 ring-1 ring-black/10 backdrop-blur-sm">
            <Image
              src="/wobble-logo.svg"
              alt="Wobble"
              width={84}
              height={84}
              priority
              className="rounded-xl opacity-85"
            />
          </div>
        </header>

        <div className="mb-6 rounded-2xl border border-[#E7B450]/50 bg-[#E7B450]/20 p-4 text-sm shadow-sm ring-1 ring-black/5">
          <div className="font-extrabold">Demo data only</div>
          <div className="mt-1 text-[#25303B]/75">
            This page uses mock data and does not connect to Supabase or any real participant records.
          </div>
        </div>

        <Dashboard stats={DEMO_STATS} />

        <footer className="mt-6 text-xs text-[#25303B]/70">
          All information displayed within this dashboard is aggregated and
          anonymised. Outcome measures are only shown where sufficient
          participant numbers exist to protect individual privacy. No personally
          identifiable information is displayed.
        </footer>
      </div>
    </main>
  );
}
