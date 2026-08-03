"use client";

import { useMemo, useState } from "react";
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
import { SURREY_GEO, boroughTotal, regionTotal, grandTotal } from "@/lib/surreyDemo";

const PIE_COLORS = ["#25303B", "#A6D5CE", "#E58B66", "#E7B450", "#7FA8A0", "#C9C2B6"];

const TOTAL_MEMBERS = grandTotal();

const DEMO_STATS: Extract<Stats, { found: true; suppressed: false }> = {
  found: true,
  suppressed: false,
  campaign_id: "DEMO_SURREY_FALLS_2026",
  trust_name: "Surrey County Council",
  service_name: "Falls Prevention Programme",
  enrolled: TOTAL_MEMBERS,
  seat_limit: 150,
  seats_remaining: 150 - TOTAL_MEMBERS,
  active_users: 101,
  engagement_rate_pct: 78,
  active_last_7d: 74,
  total_minutes: 21850,
  total_workouts: 1180,
  best_streak: 31,
  top_member_minutes: 712,
  highest_weekly_minutes: 158,
  avg_active_member_minutes: 216,
  avg_minutes_per_active_week: 47,
  avg_sessions_per_active_week: 4,
  age: [
    { label: "65-74", n: 50, pct: 38 },
    { label: "50-64", n: 37, pct: 28 },
    { label: "75+", n: 28, pct: 22 },
    { label: "Under 50", n: 15, pct: 12 },
  ],
  sex: [
    { label: "Female", n: 81, pct: 62 },
    { label: "Male", n: 43, pct: 33 },
    { label: "Unknown", n: 6, pct: 5 },
  ],
  outcomes: {
    suppressed: false,
    paired_members: 46,
    sit_to_stand: { uplift_pct: 42, maintained_pct: 88 },
    balance: { uplift_pct: 24, maintained_pct: 82 },
    confidence: { uplift_pct: 18, maintained_pct: 90 },
    falls: { change_pct: -32, reduced_pct: 80 },
  },
};

type Level =
  | { view: "overview" }
  | { view: "region"; region: string }
  | { view: "borough"; region: string; borough: string };

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 1000) / 10 : 0;
}

export default function SurreyDashboardClient({ fontClassName }: { fontClassName: string }) {
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
          <LocationExplorer />
          <Dashboard stats={DEMO_STATS} />
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

function LocationExplorer() {
  const [level, setLevel] = useState<Level>({ view: "overview" });

  const overviewData = useMemo(
    () =>
      SURREY_GEO.map((r) => {
        const n = regionTotal(r);
        return { label: r.region, n, pct: pct(n, TOTAL_MEMBERS) };
      }),
    []
  );

  return (
    <section className="rounded-2xl bg-[#F9F5EF] p-6 shadow-xl ring-1 ring-black/5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-extrabold">📍 Where members are based</div>
          <Breadcrumbs level={level} onNavigate={setLevel} />
        </div>
        <div className="text-xs font-semibold text-[#25303B]/60">
          {formatNumber(TOTAL_MEMBERS)} members across Surrey
        </div>
      </div>

      <div className="mt-4">
        {level.view === "overview" && (
          <OverviewView
            data={overviewData}
            onSelect={(region) => setLevel({ view: "region", region })}
          />
        )}

        {level.view === "region" && (
          <RegionView
            region={level.region}
            onSelect={(borough) => setLevel({ view: "borough", region: level.region, borough })}
          />
        )}

        {level.view === "borough" && (
          <BoroughView region={level.region} borough={level.borough} />
        )}
      </div>
    </section>
  );
}

function Breadcrumbs({
  level,
  onNavigate,
}: {
  level: Level;
  onNavigate: (l: Level) => void;
}) {
  const crumbClass = "text-xs font-semibold text-[#25303B]/70 transition hover:text-[#25303B]";
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-[#25303B]/50">
      <button className={crumbClass} onClick={() => onNavigate({ view: "overview" })}>
        Surrey overview
      </button>
      {level.view !== "overview" && (
        <>
          <span>/</span>
          <button
            className={crumbClass}
            onClick={() => onNavigate({ view: "region", region: level.region })}
          >
            {level.region}
          </button>
        </>
      )}
      {level.view === "borough" && (
        <>
          <span>/</span>
          <span className="text-xs font-bold text-[#25303B]">{level.borough}</span>
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
            className="flex items-center justify-between gap-6 rounded-xl border border-black/10 bg-white/60 px-4 py-3 text-left shadow-sm transition hover:bg-white"
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
  const regionData = SURREY_GEO.find((r) => r.region === region);
  const total = regionData ? regionTotal(regionData) : 0;
  const bars = (regionData?.boroughs ?? [])
    .map((b) => ({ name: b.borough, n: boroughTotal(b) }))
    .sort((a, b) => b.n - a.n);

  return (
    <div>
      <p className="mb-3 text-xs text-[#25303B]/70">
        {formatNumber(total)} members in {region}. Select a district to drill into its towns.
      </p>
      <DrillBar bars={bars} total={total} onSelect={onSelect} />
    </div>
  );
}

function BoroughView({ region, borough }: { region: string; borough: string }) {
  const regionData = SURREY_GEO.find((r) => r.region === region);
  const boroughData = regionData?.boroughs.find((b) => b.borough === borough);
  const total = boroughData ? boroughTotal(boroughData) : 0;
  const bars = (boroughData?.towns ?? [])
    .map((t) => ({ name: t.town, n: t.n }))
    .sort((a, b) => b.n - a.n);

  return (
    <div>
      <p className="mb-3 text-xs text-[#25303B]/70">
        {formatNumber(total)} members in {borough}, by town.
      </p>
      <DrillBar bars={bars} total={total} />
    </div>
  );
}

function DrillBar({
  bars,
  total,
  onSelect,
}: {
  bars: { name: string; n: number }[];
  total: number;
  onSelect?: (name: string) => void;
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
            onClick={(entry) =>
              onSelect?.((entry as unknown as { name: string }).name)
            }
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
          Tip: click a bar to drill into its towns
        </div>
      )}
    </div>
  );
}
