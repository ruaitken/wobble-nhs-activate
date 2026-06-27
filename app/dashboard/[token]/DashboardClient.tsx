"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

type Slice = { label: string; n: number; pct: number };

export type Stats =
  | { found: false; campaign_id?: string }
  | {
      found: true;
      suppressed: true;
      campaign_id?: string;
      trust_name: string | null;
      service_name: string | null;
      enrolled: number;
    }
  | {
      found: true;
      suppressed: false;
      campaign_id?: string;
      trust_name: string | null;
      service_name: string | null;
      enrolled: number;
      seat_limit: number;
      seats_remaining: number;
      active_users: number;
      engagement_rate_pct: number;
      active_last_7d: number;
      total_minutes: number;
      total_workouts: number;
      best_streak: number;
      top_member_minutes: number;
      highest_weekly_minutes: number;
      avg_active_member_minutes: number;
      avg_minutes_per_active_week: number;
      avg_sessions_per_active_week: number;
      age: Slice[];
      sex: Slice[];
      outcomes: Outcomes;
    };

type OutcomeMetric = { uplift_pct: number | null; maintained_pct: number | null };
type FallsMetric = { change_pct: number | null; reduced_pct: number | null };

type Outcomes =
  | { suppressed: true; paired_members: number }
  | {
      suppressed: false;
      paired_members: number;
      sit_to_stand: OutcomeMetric;
      balance: OutcomeMetric;
      confidence: OutcomeMetric;
      falls?: FallsMetric;
    };

type ApiResponse = { ok: true; stats: Stats } | { ok: false; reason: string };

const PIE_COLORS = ["#25303B", "#A6D5CE", "#E58B66", "#E7B450", "#7FA8A0", "#C9C2B6"];

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-GB").format(n);
}

// A demographic breakdown is "ready" once there's meaningful known (non-Unknown) data.
function hasKnownData(slices: Slice[]) {
  const known = slices
    .filter((s) => s.label.toLowerCase() !== "unknown")
    .reduce((sum, s) => sum + s.n, 0);
  return known >= 5;
}

export default function DashboardClient({
  token,
  fontClassName,
}: {
  token: string;
  fontClassName: string;
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch(`/api/dashboard?token=${encodeURIComponent(token)}`);
        const json = (await res.json()) as ApiResponse;
        setData(json);
      } catch {
        setData({ ok: false, reason: "network_error" });
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [token]);

  return (
    <main className={[fontClassName, "min-h-screen bg-[#A6D5CE] text-[#25303B]"].join(" ")}>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-7 flex items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F9F5EF]/70 px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-black/5">
              <span className="h-2 w-2 rounded-full bg-[#E58B66]" />
              Wobble impact dashboard
            </div>
            {data?.ok && data.stats.found ? (
              <>
                <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {data.stats.trust_name ?? "Your programme"}
                </h1>
                <p className="mt-2 text-sm text-[#25303B]/80 sm:text-base">
                  {data.stats.service_name ?? ""}
                </p>
              </>
            ) : (
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Impact dashboard
              </h1>
            )}
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

        {loading && (
          <div className="rounded-2xl border border-black/10 bg-white/40 p-6">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 animate-pulse rounded-full bg-[#25303B]/50" />
              <div className="text-sm font-semibold">Loading your data…</div>
            </div>
          </div>
        )}

        {!loading && data?.ok === false && (
          <div className="rounded-2xl border border-[#E58B66]/40 bg-[#E58B66]/10 p-6">
            <div className="text-sm font-bold">This dashboard link can’t be opened</div>
            <div className="mt-1 text-sm text-[#25303B]/80">
              Please check the link is correct, or contact your Wobble team.
            </div>
          </div>
        )}

        {!loading && data?.ok && !data.stats.found && (
          <div className="rounded-2xl border border-[#E58B66]/40 bg-[#E58B66]/10 p-6">
            <div className="text-sm font-bold">Campaign not found</div>
            <div className="mt-1 text-sm text-[#25303B]/80">
              This link doesn’t match an active campaign.
            </div>
          </div>
        )}

        {!loading && data?.ok && data.stats.found && data.stats.suppressed && (
          <div className="rounded-2xl border border-black/10 bg-[#F9F5EF] p-6 shadow-xl ring-1 ring-black/5">
            <div className="text-sm font-extrabold">Not enough members yet</div>
            <div className="mt-1 text-sm text-[#25303B]/80">
              To protect individual privacy, we only show cohort statistics once at least
              5 members have enrolled. Currently enrolled: {data.stats.enrolled}.
            </div>
          </div>
        )}

        {!loading && data?.ok && data.stats.found && !data.stats.suppressed && (
          <Dashboard stats={data.stats} />
        )}

        <footer className="mt-6 text-xs text-[#25303B]/70">
          Figures are aggregated and anonymised. Updated automatically.
        </footer>
      </div>
    </main>
  );
}

export function Dashboard({
  stats,
}: {
  stats: Extract<Stats, { found: true; suppressed: false }>;
}) {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="rounded-2xl bg-[#25303B] p-6 text-[#F9F5EF] shadow-xl sm:p-8">
        <div className="text-xs font-semibold uppercase tracking-wide text-[#A6D5CE]">
          Total exercise delivered
        </div>
        <div className="mt-2 text-4xl font-extrabold sm:text-5xl">
          {formatNumber(stats.total_minutes)} minutes
        </div>
        <p className="mt-3 max-w-prose text-pretty text-sm text-[#F9F5EF]/85">
          {stats.trust_name ?? "This programme"} has delivered{" "}
          {formatNumber(stats.total_minutes)} minutes of strength &amp; balance
          exercise through Wobble — helping members build better balance, strength
          and confidence, one session at a time.
        </p>
      </section>

      {/* Record holders */}
      <Section title="🏅 Record holders">
        <Kpi label="Most active member" value={`${formatNumber(stats.top_member_minutes)} min`} accent />
        <Kpi label="Longest streak" value={`${stats.best_streak} days`} accent />
        <Kpi
          label="Highest weekly minutes"
          value={`${formatNumber(stats.highest_weekly_minutes)} min`}
          accent
        />
      </Section>

      {/* Cohort collective stats */}
      <Section title="👥 Cohort collective stats">
        <Kpi label="Total workouts" value={formatNumber(stats.total_workouts)} />
        <Kpi label="Avg minutes / week" value={formatNumber(stats.avg_minutes_per_active_week)} />
        <Kpi label="Avg sessions / week" value={formatNumber(stats.avg_sessions_per_active_week)} />
        <Kpi
          label="Avg per active member"
          value={`${formatNumber(stats.avg_active_member_minutes)} min`}
        />
      </Section>

      {/* Cohort engagement & usage */}
      <Section title="📈 Cohort engagement & usage">
        <Kpi label="Members enrolled" value={formatNumber(stats.enrolled)} />
        <Kpi label="Seats remaining" value={formatNumber(stats.seats_remaining)} />
        <Kpi label="Engagement rate" value={`${stats.engagement_rate_pct}%`} />
      </Section>

      {/* Outcomes */}
      <OutcomesSection outcomes={stats.outcomes} />

      {/* Who's taking part */}
      <div>
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-[#25303B]/70">
          🧑‍🤝‍🧑 Who&apos;s taking part
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <DemographicCard title="Age of members" slices={stats.age} />
          <DemographicCard title="Sex of members" slices={stats.sex} />
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-[#25303B]/70">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {children}
      </div>
    </section>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl p-4 shadow-sm ring-1",
        accent
          ? "bg-[#E7B450]/40 ring-[#E7B450]/60 shadow-md"
          : "bg-[#F9F5EF] ring-black/5",
      ].join(" ")}
    >
      <div className="text-xs font-semibold text-[#25303B]/70">{label}</div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
    </div>
  );
}

function OutcomesSection({ outcomes }: { outcomes: Outcomes }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-[#25303B]/70">
        📊 Outcomes — improvement since starting
      </h2>
      {outcomes.suppressed ? (
        <div className="flex min-h-[120px] flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 bg-[#F9F5EF]/70 p-6 text-center shadow-sm ring-1 ring-black/5">
          <div className="text-sm font-semibold">We’re collecting this data</div>
          <div className="mt-1 max-w-prose text-xs text-[#25303B]/70">
            Outcome improvements appear once at least 5 members have completed a
            retake assessment. ({outcomes.paired_members} so far.)
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <OutcomeCard title="Sit-to-stands" metric={outcomes.sit_to_stand} />
          <OutcomeCard title="Balance" metric={outcomes.balance} />
          <OutcomeCard title="Confidence" metric={outcomes.confidence} />
          <FallsCard metric={outcomes.falls} />
        </div>
      )}
    </section>
  );
}

function OutcomeCard({ title, metric }: { title: string; metric: OutcomeMetric }) {
  const uplift = metric.uplift_pct;
  const upliftLabel =
    uplift === null ? "—" : `${uplift > 0 ? "+" : ""}${uplift}%`;
  const positive = uplift !== null && uplift > 0;

  return (
    <div className="rounded-2xl bg-[#F9F5EF] p-4 shadow-sm ring-1 ring-black/5">
      <div className="text-xs font-semibold text-[#25303B]/70">{title}</div>
      <div
        className={[
          "mt-1 text-2xl font-extrabold",
          positive ? "text-[#1FAF7A]" : "text-[#25303B]",
        ].join(" ")}
      >
        {upliftLabel}
      </div>
      <div className="mt-1 text-xs text-[#25303B]/70">
        {metric.maintained_pct === null
          ? "average change"
          : `${metric.maintained_pct}% maintained or improved`}
      </div>
    </div>
  );
}

function FallsCard({ metric }: { metric?: FallsMetric }) {
  const change = metric?.change_pct ?? null;

  // No data yet (e.g. everyone's baseline falls are 0 / not collected).
  if (change === null) {
    return (
      <div className="flex flex-col justify-center rounded-2xl border border-dashed border-black/15 bg-[#F9F5EF]/70 p-4 text-center shadow-sm ring-1 ring-black/5">
        <div className="text-sm font-extrabold">Falls</div>
        <div className="mt-1 text-xs text-[#25303B]/70">
          We’re collecting this data
        </div>
      </div>
    );
  }

  // For falls, a reduction (negative change) is the good outcome.
  const improved = change < 0;
  const changeLabel = `${change > 0 ? "+" : ""}${change}%`;

  return (
    <div className="rounded-2xl bg-[#F9F5EF] p-4 shadow-sm ring-1 ring-black/5">
      <div className="text-xs font-semibold text-[#25303B]/70">Falls</div>
      <div
        className={[
          "mt-1 text-2xl font-extrabold",
          improved ? "text-[#1FAF7A]" : "text-[#B4533A]",
        ].join(" ")}
      >
        {changeLabel}
      </div>
      <div className="mt-1 text-xs text-[#25303B]/70">
        {metric?.reduced_pct == null
          ? "average change"
          : `${metric.reduced_pct}% maintained or reduced`}
      </div>
    </div>
  );
}

function DemographicCard({ title, slices }: { title: string; slices: Slice[] }) {
  const ready = hasKnownData(slices);

  return (
    <div className="rounded-2xl bg-[#F9F5EF] p-6 shadow-xl ring-1 ring-black/5">
      <div className="text-sm font-extrabold">{title}</div>
      {ready ? (
        <div className="mt-2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="pct"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => {
                  const s = entry as unknown as Slice;
                  return `${s.label}: ${s.pct}%`;
                }}
              >
                {slices.map((s, i) => (
                  <Cell key={s.label} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-4 flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-black/15 bg-white/40 p-6 text-center">
          <div className="text-sm font-semibold">We’re collecting this data</div>
          <div className="mt-1 text-xs text-[#25303B]/70">
            This chart will appear once enough members have shared it.
          </div>
        </div>
      )}
    </div>
  );
}
