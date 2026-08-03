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
import { SURREY_GEO, boroughTotal, regionTotal, grandTotal, findRegion } from "@/lib/surreyDemo";

const PIE_COLORS = ["#25303B", "#A6D5CE", "#E58B66", "#E7B450", "#7FA8A0", "#C9C2B6"];

const TOTAL_MEMBERS = grandTotal();

// Privacy threshold (mirrors the production dashboard): below this many members
// in a slice we suppress cohort stats to protect individuals.
const MIN_MEMBERS = 5;

// Per-member ratios derived from a realistic county-wide baseline. Every metric
// below is scaled from the number of members in the currently selected area, so
// drilling down narrows the whole dashboard and stepping back widens it.
const AVG_ACTIVE_MEMBER_MINUTES = 216;
const ACTIVE_RATE = 101 / 130;
const ACTIVE_7D_RATE = 74 / 130;
const WORKOUTS_PER_ENROLLED = 1180 / 130;
const PAIRED_RATE = 46 / 130;
const SEAT_RATIO = 150 / 130;

const AGE_DIST = [
  { label: "65-74", pct: 38 },
  { label: "50-64", pct: 28 },
  { label: "75+", pct: 22 },
  { label: "Under 50", pct: 12 },
];
const SEX_DIST = [
  { label: "Female", pct: 62 },
  { label: "Male", pct: 33 },
  { label: "Unknown", pct: 5 },
];

type Level =
  | { view: "overview" }
  | { view: "region"; region: string }
  | { view: "borough"; region: string; borough: string }
  | { view: "town"; region: string; borough: string; town: string };

type Scope = { members: number; label: string; path: string[] };

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 1000) / 10 : 0;
}

function getScope(level: Level): Scope {
  if (level.view === "overview") {
    return { members: TOTAL_MEMBERS, label: "Surrey County Council", path: [] };
  }
  const region = findRegion(level.region);
  if (level.view === "region") {
    return { members: region ? regionTotal(region) : 0, label: level.region, path: [level.region] };
  }
  const borough = region?.boroughs.find((b) => b.borough === level.borough);
  if (level.view === "borough") {
    return {
      members: borough ? boroughTotal(borough) : 0,
      label: level.borough,
      path: [level.region, level.borough],
    };
  }
  const town = borough?.towns.find((t) => t.town === level.town);
  return {
    members: town ? town.n : 0,
    label: level.town,
    path: [level.region, level.borough, level.town],
  };
}

function buildStats(scope: Scope): Extract<Stats, { found: true; suppressed: false }> {
  const enrolled = scope.members;
  const active_users = Math.round(enrolled * ACTIVE_RATE);
  const active_last_7d = Math.round(enrolled * ACTIVE_7D_RATE);
  const total_minutes = active_users * AVG_ACTIVE_MEMBER_MINUTES;
  const total_workouts = Math.round(enrolled * WORKOUTS_PER_ENROLLED);
  const engagement_rate_pct = enrolled > 0 ? Math.round((active_users / enrolled) * 100) : 0;
  const seat_limit = Math.max(enrolled, Math.round(enrolled * SEAT_RATIO));
  const paired = Math.round(enrolled * PAIRED_RATE);

  return {
    found: true,
    suppressed: false,
    campaign_id: "DEMO_SURREY_FALLS_2026",
    trust_name: scope.label,
    service_name: "Falls Prevention Programme",
    enrolled,
    seat_limit,
    seats_remaining: seat_limit - enrolled,
    active_users,
    engagement_rate_pct,
    active_last_7d,
    total_minutes,
    total_workouts,
    best_streak: Math.min(31, Math.max(4, Math.round(31 * (0.55 + 0.45 * (enrolled / TOTAL_MEMBERS))))),
    top_member_minutes: Math.min(712, total_minutes),
    highest_weekly_minutes: Math.min(158, total_minutes),
    avg_active_member_minutes: AVG_ACTIVE_MEMBER_MINUTES,
    avg_minutes_per_active_week: 47,
    avg_sessions_per_active_week: 4,
    age: AGE_DIST.map((a) => ({ label: a.label, pct: a.pct, n: Math.round((a.pct / 100) * enrolled) })),
    sex: SEX_DIST.map((s) => ({ label: s.label, pct: s.pct, n: Math.round((s.pct / 100) * enrolled) })),
    outcomes:
      paired >= MIN_MEMBERS
        ? {
            suppressed: false,
            paired_members: paired,
            sit_to_stand: { uplift_pct: 42, maintained_pct: 88 },
            balance: { uplift_pct: 24, maintained_pct: 82 },
            confidence: { uplift_pct: 18, maintained_pct: 90 },
            falls: { change_pct: -32, reduced_pct: 80 },
          }
        : { suppressed: true, paired_members: paired },
  };
}

export default function SurreyDashboardClient({ fontClassName }: { fontClassName: string }) {
  const [level, setLevel] = useState<Level>({ view: "overview" });
  const scope = getScope(level);
  const stats = buildStats(scope);

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
          <LocationExplorer level={level} scope={scope} onNavigate={setLevel} />

          {scope.members < MIN_MEMBERS ? (
            <div className="rounded-2xl border border-black/10 bg-[#F9F5EF] p-6 shadow-xl ring-1 ring-black/5">
              <div className="text-sm font-extrabold">Not enough members to show this area</div>
              <div className="mt-1 text-sm text-[#25303B]/80">
                To protect individual privacy, cohort statistics only appear once at least{" "}
                {MIN_MEMBERS} members are enrolled in the selected area. {scope.label} currently has{" "}
                {scope.members}. Step back up a level to widen the filter.
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
  scope,
  onNavigate,
}: {
  level: Level;
  scope: Scope;
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
          <span className="font-extrabold">{scope.label}</span>
          <span className="ml-2 rounded-full bg-[#25303B] px-2 py-0.5 text-xs font-bold text-[#F9F5EF]">
            {formatNumber(scope.members)} members
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
  const total = regionData ? regionTotal(regionData) : 0;
  const bars = (regionData?.boroughs ?? [])
    .map((b) => ({ name: b.borough, n: boroughTotal(b) }))
    .sort((a, b) => b.n - a.n);

  return (
    <div>
      <p className="mb-3 text-xs text-[#25303B]/70">
        Districts within <span className="font-bold">{region}</span> — click one to filter the dashboard
        to that district.
      </p>
      <DrillBar bars={bars} total={total} onSelect={onSelect} nextLevel="towns" />
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
  const regionData = findRegion(region);
  const boroughData = regionData?.boroughs.find((b) => b.borough === borough);
  const total = boroughData ? boroughTotal(boroughData) : 0;
  const bars = (boroughData?.towns ?? [])
    .map((t) => ({ name: t.town, n: t.n }))
    .sort((a, b) => b.n - a.n);

  return (
    <div>
      <p className="mb-3 text-xs text-[#25303B]/70">
        Towns within <span className="font-bold">{borough}</span> — click one to filter the dashboard
        to that town.
      </p>
      <DrillBar bars={bars} total={total} onSelect={onSelect} nextLevel="town" />
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
  total,
  onSelect,
  nextLevel,
}: {
  bars: { name: string; n: number }[];
  total: number;
  onSelect?: (name: string) => void;
  nextLevel?: string;
}) {
  const height = Math.max(200, bars.length * 46);
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bars} layout="vertical" margin={{ left: 24, right: 32 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#25303B14" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fontSize: 12, fontWeight: 600 }}
          />
          <Tooltip
            formatter={(value) => {
              const n = Number(value);
              return [`${n} members (${pct(n, total)}%)`, "Members"];
            }}
            cursor={{ fill: "#25303B0a" }}
          />
          <Bar
            dataKey="n"
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
