"use client";

import { useState } from "react";
import Image from "next/image";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Dashboard, formatNumber, type Stats } from "../[token]/DashboardClient";
import {
  SURREY_GEO,
  regionTotal,
  grandTotal,
  findRegion,
  townsForRegion,
  townsForBorough,
  allTowns,
  type TownStat,
} from "@/lib/surreyDemo";

const PIE_COLORS = ["#25303B", "#A6D5CE", "#E58B66", "#E7B450", "#7FA8A0", "#C9C2B6"];

const TOTAL_MEMBERS = grandTotal();

// Privacy threshold (mirrors the production dashboard): below this many members
// in a slice we suppress cohort stats to protect individuals.
const MIN_MEMBERS = 5;

const AGE_BASE = [
  { label: "65-74", pct: 38 },
  { label: "50-64", pct: 28 },
  { label: "75+", pct: 22 },
  { label: "Under 50", pct: 12 },
];
const SEX_BASE = [
  { label: "Female", pct: 62 },
  { label: "Male", pct: 33 },
  { label: "Unknown", pct: 5 },
];

// -----------------------------------------------------------------------------
// Deterministic per-area profiles
//
// Each town gets its own metric profile, seeded from its name, so every area
// looks different (records, outcomes, engagement, seat fill) while staying
// positive and stable across clicks. Scope-level figures are AGGREGATED from
// the towns in scope, so numbers roll up correctly: county = Σ regions =
// Σ boroughs = Σ towns.
// -----------------------------------------------------------------------------

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;
function inRange(rng: Rng, min: number, max: number) {
  return min + (max - min) * rng();
}

function jitterDist(rng: Rng, base: { label: string; pct: number }[], amp: number) {
  const raw = base.map((b) => ({ label: b.label, v: Math.max(1, b.pct + (rng() * 2 - 1) * amp) }));
  const sum = raw.reduce((s, r) => s + r.v, 0);
  return raw.map((r) => ({ label: r.label, pct: (r.v / sum) * 100 }));
}

type TownProfile = {
  enrolled: number;
  allocated: number;
  activeUsers: number;
  active7d: number;
  totalMinutes: number;
  totalWorkouts: number;
  paired: number;
  bestStreak: number;
  topMemberMinutes: number;
  highestWeeklyMinutes: number;
  ageCounts: { label: string; n: number }[];
  sexCounts: { label: string; n: number }[];
  sitToStand: { uplift: number; maintained: number };
  balance: { uplift: number; maintained: number };
  confidence: { uplift: number; maintained: number };
  falls: { change: number; reduced: number };
};

const profileCache = new Map<string, TownProfile>();

function townProfile(town: string, enrolled: number): TownProfile {
  const cached = profileCache.get(town);
  if (cached) return cached;

  const rng = mulberry32(hashString(town));

  const fill = inRange(rng, 0.7, 0.93);
  const allocated = Math.max(enrolled + 1, Math.round(enrolled / fill));

  const activeRate = inRange(rng, 0.66, 0.86);
  const activeUsers = Math.max(1, Math.round(enrolled * activeRate));
  const active7d = Math.round(activeUsers * inRange(rng, 0.62, 0.82));

  const avgMemberMinutes = inRange(rng, 175, 255);
  const totalMinutes = Math.round(activeUsers * avgMemberMinutes);
  const totalWorkouts = Math.round(enrolled * inRange(rng, 7.5, 10.5));
  const paired = Math.round(enrolled * inRange(rng, 0.28, 0.44));

  const age = jitterDist(rng, AGE_BASE, 7);
  const sex = jitterDist(rng, SEX_BASE, 4);

  const profile: TownProfile = {
    enrolled,
    allocated,
    activeUsers,
    active7d,
    totalMinutes,
    totalWorkouts,
    paired,
    bestStreak: Math.round(inRange(rng, 18, 46)),
    topMemberMinutes: Math.round(inRange(rng, 520, 900)),
    highestWeeklyMinutes: Math.round(inRange(rng, 120, 205)),
    ageCounts: age.map((a) => ({ label: a.label, n: Math.round((a.pct / 100) * enrolled) })),
    sexCounts: sex.map((s) => ({ label: s.label, n: Math.round((s.pct / 100) * enrolled) })),
    sitToStand: { uplift: Math.round(inRange(rng, 30, 52)), maintained: Math.round(inRange(rng, 80, 94)) },
    balance: { uplift: Math.round(inRange(rng, 16, 32)), maintained: Math.round(inRange(rng, 78, 92)) },
    confidence: { uplift: Math.round(inRange(rng, 12, 26)), maintained: Math.round(inRange(rng, 82, 95)) },
    falls: { change: -Math.round(inRange(rng, 22, 40)), reduced: Math.round(inRange(rng, 74, 90)) },
  };

  profileCache.set(town, profile);
  return profile;
}

type Aggregate = {
  enrolled: number;
  allocated: number;
  activeUsers: number;
  active7d: number;
  totalMinutes: number;
  totalWorkouts: number;
  paired: number;
  bestStreak: number;
  topMemberMinutes: number;
  highestWeeklyMinutes: number;
  age: { label: string; n: number }[];
  sex: { label: string; n: number }[];
  sitToStand: { uplift: number; maintained: number };
  balance: { uplift: number; maintained: number };
  confidence: { uplift: number; maintained: number };
  falls: { change: number; reduced: number };
};

function sumCounts(profiles: TownProfile[], pick: (p: TownProfile) => { label: string; n: number }[]) {
  const map = new Map<string, number>();
  for (const p of profiles) {
    for (const c of pick(p)) map.set(c.label, (map.get(c.label) ?? 0) + c.n);
  }
  return Array.from(map.entries()).map(([label, n]) => ({ label, n }));
}

function aggregate(towns: TownStat[]): Aggregate {
  const profiles = towns.map((t) => townProfile(t.town, t.n));
  const sum = (pick: (p: TownProfile) => number) => profiles.reduce((s, p) => s + pick(p), 0);
  const max = (pick: (p: TownProfile) => number) => profiles.reduce((s, p) => Math.max(s, pick(p)), 0);

  const paired = sum((p) => p.paired);
  // Outcome percentages are averaged across areas, weighted by how many members
  // completed a retake — so they vary by area but stay grounded and positive.
  const wavg = (pick: (p: TownProfile) => number) => {
    if (paired <= 0) return 0;
    return profiles.reduce((s, p) => s + pick(p) * p.paired, 0) / paired;
  };

  return {
    enrolled: sum((p) => p.enrolled),
    allocated: sum((p) => p.allocated),
    activeUsers: sum((p) => p.activeUsers),
    active7d: sum((p) => p.active7d),
    totalMinutes: sum((p) => p.totalMinutes),
    totalWorkouts: sum((p) => p.totalWorkouts),
    paired,
    bestStreak: max((p) => p.bestStreak),
    topMemberMinutes: max((p) => p.topMemberMinutes),
    highestWeeklyMinutes: max((p) => p.highestWeeklyMinutes),
    age: sumCounts(profiles, (p) => p.ageCounts),
    sex: sumCounts(profiles, (p) => p.sexCounts),
    sitToStand: { uplift: Math.round(wavg((p) => p.sitToStand.uplift)), maintained: Math.round(wavg((p) => p.sitToStand.maintained)) },
    balance: { uplift: Math.round(wavg((p) => p.balance.uplift)), maintained: Math.round(wavg((p) => p.balance.maintained)) },
    confidence: { uplift: Math.round(wavg((p) => p.confidence.uplift)), maintained: Math.round(wavg((p) => p.confidence.maintained)) },
    falls: { change: Math.round(wavg((p) => p.falls.change)), reduced: Math.round(wavg((p) => p.falls.reduced)) },
  };
}

type Level =
  | { view: "overview" }
  | { view: "region"; region: string }
  | { view: "borough"; region: string; borough: string }
  | { view: "town"; region: string; borough: string; town: string };

type Scope = { label: string; path: string[]; towns: TownStat[] };

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 1000) / 10 : 0;
}

function getScope(level: Level): Scope {
  if (level.view === "overview") {
    return { label: "Surrey County Council", path: [], towns: allTowns() };
  }
  if (level.view === "region") {
    return { label: level.region, path: [level.region], towns: townsForRegion(level.region) };
  }
  if (level.view === "borough") {
    return {
      label: level.borough,
      path: [level.region, level.borough],
      towns: townsForBorough(level.region, level.borough),
    };
  }
  const town = townsForBorough(level.region, level.borough).find((t) => t.town === level.town);
  return {
    label: level.town,
    path: [level.region, level.borough, level.town],
    towns: town ? [town] : [],
  };
}

function scopeMembers(scope: Scope) {
  return scope.towns.reduce((s, t) => s + t.n, 0);
}

function statsForScope(scope: Scope): Extract<Stats, { found: true; suppressed: false }> {
  const agg = aggregate(scope.towns);
  const enrolled = agg.enrolled;
  const avgActive = agg.activeUsers > 0 ? Math.round(agg.totalMinutes / agg.activeUsers) : 0;
  const perWeek = Math.round(avgActive / 4.6);
  const sessions = Math.max(2, Math.round(perWeek / 11.75));

  return {
    found: true,
    suppressed: false,
    campaign_id: "DEMO_SURREY_FALLS_2026",
    trust_name: scope.label,
    service_name: "Falls Prevention Programme",
    enrolled,
    seat_limit: agg.allocated,
    seats_remaining: Math.max(0, agg.allocated - enrolled),
    active_users: agg.activeUsers,
    engagement_rate_pct: enrolled > 0 ? Math.round((agg.activeUsers / enrolled) * 100) : 0,
    active_last_7d: agg.active7d,
    total_minutes: agg.totalMinutes,
    total_workouts: agg.totalWorkouts,
    best_streak: agg.bestStreak,
    top_member_minutes: agg.topMemberMinutes,
    highest_weekly_minutes: agg.highestWeeklyMinutes,
    avg_active_member_minutes: avgActive,
    avg_minutes_per_active_week: perWeek,
    avg_sessions_per_active_week: sessions,
    age: agg.age.map((a) => ({ label: a.label, n: a.n, pct: enrolled > 0 ? Math.round((a.n / enrolled) * 100) : 0 })),
    sex: agg.sex.map((s) => ({ label: s.label, n: s.n, pct: enrolled > 0 ? Math.round((s.n / enrolled) * 100) : 0 })),
    outcomes:
      agg.paired >= MIN_MEMBERS
        ? {
            suppressed: false,
            paired_members: agg.paired,
            sit_to_stand: { uplift_pct: agg.sitToStand.uplift, maintained_pct: agg.sitToStand.maintained },
            balance: { uplift_pct: agg.balance.uplift, maintained_pct: agg.balance.maintained },
            confidence: { uplift_pct: agg.confidence.uplift, maintained_pct: agg.confidence.maintained },
            falls: { change_pct: agg.falls.change, reduced_pct: agg.falls.reduced },
          }
        : { suppressed: true, paired_members: agg.paired },
  };
}

export default function SurreyDashboardClient({ fontClassName }: { fontClassName: string }) {
  const [level, setLevel] = useState<Level>({ view: "overview" });
  const scope = getScope(level);
  const members = scopeMembers(scope);
  const stats = statsForScope(scope);

  return (
    <main className={[fontClassName, "min-h-screen bg-[#A6D5CE] text-[#25303B]"].join(" ")}>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-7 flex items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F9F5EF]/70 px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-black/5">
              <span className="h-2 w-2 rounded-full bg-[#E58B66]" />
              Wobble impact dashboard
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Surrey County Council
            </h1>
            <p className="mt-2 text-sm text-[#25303B]/80 sm:text-base">Falls Prevention Programme</p>
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

        <div className="space-y-6">
          <LocationExplorer level={level} scopeLabel={scope.label} members={members} onNavigate={setLevel} />

          {members < MIN_MEMBERS ? (
            <div className="rounded-2xl border border-black/10 bg-[#F9F5EF] p-6 shadow-xl ring-1 ring-black/5">
              <div className="text-sm font-extrabold">Not enough members to show this area</div>
              <div className="mt-1 text-sm text-[#25303B]/80">
                To protect individual privacy, cohort statistics only appear once at least{" "}
                {MIN_MEMBERS} members are enrolled in the selected area. {scope.label} currently has{" "}
                {members}. Step back up a level to widen the filter.
              </div>
            </div>
          ) : (
            <Dashboard stats={stats} />
          )}
        </div>

        <footer className="mt-6 text-xs text-[#25303B]/70">
          All information displayed within this dashboard is aggregated and anonymised. Location and
          outcome measures are only shown where sufficient participant numbers exist to protect
          individual privacy. No personally identifiable information is displayed.
        </footer>
      </div>
    </main>
  );
}

function LocationExplorer({
  level,
  scopeLabel,
  members,
  onNavigate,
}: {
  level: Level;
  scopeLabel: string;
  members: number;
  onNavigate: (l: Level) => void;
}) {
  const overviewData = SURREY_GEO.map((r) => {
    const n = regionTotal(r);
    return { label: r.region, n, pct: pct(n, TOTAL_MEMBERS) };
  });

  return (
    <section className="rounded-2xl bg-[#F9F5EF] p-6 shadow-xl ring-1 ring-black/5">
      <div className="flex flex-col gap-1">
        <div className="text-sm font-extrabold">📍 Where members are based — filter the dashboard</div>
        <p className="text-xs text-[#25303B]/70">
          Click a segment to <span className="font-bold">narrow</span> everything below to that area,
          all the way down to a single town. Use the breadcrumbs or <span className="font-bold">Back</span>{" "}
          to <span className="font-bold">widen</span> again.
        </p>
        <Breadcrumbs level={level} onNavigate={onNavigate} />
      </div>

      {/* Active-filter banner */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#25303B]/15 bg-[#25303B]/[0.04] px-4 py-3">
        <div className="text-sm">
          <span className="font-semibold text-[#25303B]/70">Filtering dashboard by: </span>
          <span className="font-extrabold">{scopeLabel}</span>
          <span className="ml-2 rounded-full bg-[#25303B] px-2 py-0.5 text-xs font-bold text-[#F9F5EF]">
            {formatNumber(members)} members
          </span>
        </div>
        {level.view !== "overview" && (
          <button
            onClick={() => onNavigate({ view: "overview" })}
            className="text-xs font-bold text-[#25303B]/70 underline underline-offset-2 transition hover:text-[#25303B]"
          >
            Clear filter (show all Surrey)
          </button>
        )}
      </div>

      {level.view !== "overview" && (
        <button
          onClick={() => onNavigate(parentLevel(level))}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-bold text-[#25303B] shadow-sm transition hover:bg-white"
        >
          <span aria-hidden>←</span>
          {backLabel(level)}
        </button>
      )}

      <div className="mt-4">
        {level.view === "overview" && (
          <OverviewView
            data={overviewData}
            onSelect={(region) => onNavigate({ view: "region", region })}
          />
        )}

        {level.view === "region" && (
          <RegionView
            region={level.region}
            onSelect={(borough) => onNavigate({ view: "borough", region: level.region, borough })}
          />
        )}

        {level.view === "borough" && (
          <BoroughView
            region={level.region}
            borough={level.borough}
            onSelect={(town) =>
              onNavigate({ view: "town", region: level.region, borough: level.borough, town })
            }
          />
        )}

        {level.view === "town" && <TownView town={level.town} borough={level.borough} />}
      </div>
    </section>
  );
}

function parentLevel(level: Level): Level {
  if (level.view === "town") return { view: "borough", region: level.region, borough: level.borough };
  if (level.view === "borough") return { view: "region", region: level.region };
  return { view: "overview" };
}

function backLabel(level: Level): string {
  if (level.view === "town") return `Back to ${level.borough}`;
  if (level.view === "borough") return `Back to ${level.region}`;
  return "Back to Surrey overview";
}

function Breadcrumbs({
  level,
  onNavigate,
}: {
  level: Level;
  onNavigate: (l: Level) => void;
}) {
  const crumbClass =
    "text-xs font-semibold text-[#25303B]/80 underline decoration-[#25303B]/30 underline-offset-2 transition hover:text-[#25303B] hover:decoration-[#25303B]";
  const region = level.view !== "overview" ? level.region : null;
  const borough = level.view === "borough" || level.view === "town" ? level.borough : null;
  const town = level.view === "town" ? level.town : null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-[#25303B]/40">
      {level.view === "overview" ? (
        <span className="text-xs font-bold text-[#25303B]">Surrey overview</span>
      ) : (
        <button className={crumbClass} onClick={() => onNavigate({ view: "overview" })}>
          Surrey overview
        </button>
      )}

      {region && (
        <>
          <span>›</span>
          {level.view === "region" ? (
            <span className="text-xs font-bold text-[#25303B]">{region}</span>
          ) : (
            <button className={crumbClass} onClick={() => onNavigate({ view: "region", region })}>
              {region}
            </button>
          )}
        </>
      )}

      {borough && (
        <>
          <span>›</span>
          {level.view === "borough" ? (
            <span className="text-xs font-bold text-[#25303B]">{borough}</span>
          ) : (
            <button
              className={crumbClass}
              onClick={() => onNavigate({ view: "borough", region: region as string, borough })}
            >
              {borough}
            </button>
          )}
        </>
      )}

      {town && (
        <>
          <span>›</span>
          <span className="text-xs font-bold text-[#25303B]">{town}</span>
        </>
      )}
    </div>
  );
}

function OverviewView({
  data,
  onSelect,
}: {
  data: { label: string; n: number; pct: number }[];
  onSelect: (region: string) => void;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="pct"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={80}
              onClick={(entry) => onSelect((entry as unknown as { label: string }).label)}
              label={(entry) => {
                const s = entry as unknown as { label: string; pct: number };
                return `${s.label}: ${s.pct}%`;
              }}
            >
              {data.map((s, i) => (
                <Cell
                  key={s.label}
                  fill={PIE_COLORS[i % PIE_COLORS.length]}
                  className="cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-3">
        {data.map((r, i) => (
          <button
            key={r.label}
            onClick={() => onSelect(r.label)}
            className="flex items-center justify-between gap-6 rounded-xl border border-black/10 bg-white/60 px-4 py-3 text-left shadow-sm transition hover:border-[#25303B]/30 hover:bg-white"
          >
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="text-sm font-bold">{r.label}</span>
            </span>
            <span className="text-sm font-extrabold">
              {formatNumber(r.n)}{" "}
              <span className="text-xs font-semibold text-[#25303B]/60">members →</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RegionView({
  region,
  onSelect,
}: {
  region: string;
  onSelect: (borough: string) => void;
}) {
  const regionData = findRegion(region);
  const bars = (regionData?.boroughs ?? [])
    .map((b) => {
      const agg = aggregate(b.towns);
      return { name: b.borough, minutes: agg.totalMinutes, members: agg.enrolled };
    })
    .sort((a, b) => b.minutes - a.minutes);

  return (
    <div>
      <p className="mb-3 text-xs text-[#25303B]/70">
        Exercise minutes delivered by district in <span className="font-bold">{region}</span> — click a
        bar to filter the dashboard to that district.
      </p>
      <DrillBar bars={bars} onSelect={onSelect} nextLevel="towns" />
    </div>
  );
}

function BoroughView({
  region,
  borough,
  onSelect,
}: {
  region: string;
  borough: string;
  onSelect: (town: string) => void;
}) {
  const bars = townsForBorough(region, borough)
    .map((t) => {
      const agg = aggregate([t]);
      return { name: t.town, minutes: agg.totalMinutes, members: agg.enrolled };
    })
    .sort((a, b) => b.minutes - a.minutes);

  return (
    <div>
      <p className="mb-3 text-xs text-[#25303B]/70">
        Exercise minutes delivered by town in <span className="font-bold">{borough}</span> — click a bar
        to filter the dashboard to that town.
      </p>
      <DrillBar bars={bars} onSelect={onSelect} nextLevel="town" />
    </div>
  );
}

function TownView({ town, borough }: { town: string; borough: string }) {
  return (
    <div className="rounded-xl border border-dashed border-black/15 bg-white/50 p-5 text-center">
      <div className="text-sm font-extrabold">{town}</div>
      <div className="mt-1 text-xs text-[#25303B]/70">
        Most detailed level. The dashboard below is now filtered to {town} ({borough}). Use{" "}
        <span className="font-bold">Back</span> or the breadcrumbs to widen the filter.
      </div>
    </div>
  );
}

function DrillBar({
  bars,
  onSelect,
  nextLevel,
}: {
  bars: { name: string; minutes: number; members: number }[];
  onSelect?: (name: string) => void;
  nextLevel?: string;
}) {
  const height = Math.max(200, bars.length * 46);
  return (
    <div style={{ height: height + 26 }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={bars} layout="vertical" margin={{ left: 24, right: 40, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#25303B14" />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => formatNumber(Number(v))}
            label={{
              value: "Exercise minutes delivered",
              position: "insideBottom",
              offset: -2,
              style: { fontSize: 11, fontWeight: 700, fill: "#25303B99" },
            }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fontSize: 12, fontWeight: 600 }}
          />
          <Tooltip
            formatter={(value, _name, item) => {
              const mins = Number(value);
              const members = (item?.payload as { members?: number })?.members ?? 0;
              return [`${formatNumber(mins)} mins · ${formatNumber(members)} members`, "Delivered"];
            }}
            cursor={{ fill: "#25303B0a" }}
          />
          <Bar
            dataKey="minutes"
            radius={[0, 6, 6, 0]}
            onClick={(entry) => onSelect?.((entry as unknown as { name: string }).name)}
          >
            {bars.map((b, i) => (
              <Cell
                key={b.name}
                fill={PIE_COLORS[i % PIE_COLORS.length]}
                className={onSelect ? "cursor-pointer" : undefined}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {onSelect && (
        <div className="mt-1 text-center text-[11px] font-semibold text-[#25303B]/50">
          Click a bar to filter to that {nextLevel === "town" ? "town" : "district"}
        </div>
      )}
    </div>
  );
}
