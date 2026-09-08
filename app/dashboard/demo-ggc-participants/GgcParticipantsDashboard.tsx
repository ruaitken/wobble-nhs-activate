"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Dashboard, type Stats } from "../[token]/DashboardClient";

type Tab = "overview" | "participants";
type Direction = "higher" | "lower";

type Assessment = {
  label: string;
  unit: string;
  direction: Direction;
  baseline: number;
  previous: number;
  current: number;
  currentDate: string;
};

type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  minutesThisWeek: number;
  totalMinutes: number;
  averageWeeklyMinutes: number;
  averageSessionsPerWeek: number;
  lastSession: string;
  assessments: Assessment[];
};

const PARTICIPANTS_PER_PAGE = 10;

const DEMO_STATS: Extract<Stats, { found: true; suppressed: false }> = {
  found: true,
  suppressed: false,
  campaign_id: "DEMO_PARTICIPANT_INSIGHTS",
  trust_name: "Example Impact Dashboard",
  service_name: "Falls Prevention Programme",
  enrolled: 64,
  seat_limit: 75,
  seats_remaining: 11,
  active_users: 53,
  engagement_rate_pct: 83,
  active_last_7d: 41,
  total_minutes: 18460,
  total_workouts: 1012,
  best_streak: 31,
  top_member_minutes: 1124,
  highest_weekly_minutes: 158,
  avg_active_member_minutes: 348,
  avg_minutes_per_active_week: 47,
  avg_sessions_per_active_week: 3,
  age: [
    { label: "65-74", n: 25, pct: 39 },
    { label: "75+", n: 20, pct: 31 },
    { label: "50-64", n: 13, pct: 20 },
    { label: "Under 50", n: 6, pct: 10 },
  ],
  sex: [
    { label: "Female", n: 39, pct: 61 },
    { label: "Male", n: 23, pct: 36 },
    { label: "Unknown", n: 2, pct: 3 },
  ],
  outcomes: {
    suppressed: false,
    paired_members: 39,
    sit_to_stand: { uplift_pct: 38, maintained_pct: 90 },
    balance: { uplift_pct: 27, maintained_pct: 86 },
    confidence: { uplift_pct: 21, maintained_pct: 90 },
    falls: { change_pct: -29, reduced_pct: 81 },
  },
};

const PARTICIPANTS: Participant[] = [
  {
    id: "DEMO-104",
    firstName: "Anne",
    lastName: "MacDonald",
    minutesThisWeek: 46,
    totalMinutes: 622,
    averageWeeklyMinutes: 42,
    averageSessionsPerWeek: 2.8,
    lastSession: "2 Sep 2026",
    assessments: [
      { label: "Sit-to-stands", unit: "reps", direction: "higher", baseline: 8, previous: 10, current: 12, currentDate: "28 Aug 2026" },
      { label: "Balance", unit: "seconds", direction: "higher", baseline: 18, previous: 22, current: 25, currentDate: "28 Aug 2026" },
      { label: "Confidence", unit: "/ 10", direction: "higher", baseline: 5, previous: 6, current: 8, currentDate: "28 Aug 2026" },
      { label: "Falls", unit: "in 12 months", direction: "lower", baseline: 4, previous: 3, current: 2, currentDate: "28 Aug 2026" },
    ],
  },
  {
    id: "DEMO-117",
    firstName: "Robert",
    lastName: "Campbell",
    minutesThisWeek: 32,
    totalMinutes: 488,
    averageWeeklyMinutes: 35,
    averageSessionsPerWeek: 2.2,
    lastSession: "1 Sep 2026",
    assessments: [
      { label: "Sit-to-stands", unit: "reps", direction: "higher", baseline: 9, previous: 11, current: 11, currentDate: "30 Aug 2026" },
      { label: "Balance", unit: "seconds", direction: "higher", baseline: 14, previous: 17, current: 19, currentDate: "30 Aug 2026" },
      { label: "Confidence", unit: "/ 10", direction: "higher", baseline: 4, previous: 6, current: 6, currentDate: "30 Aug 2026" },
      { label: "Falls", unit: "in 12 months", direction: "lower", baseline: 3, previous: 2, current: 1, currentDate: "30 Aug 2026" },
    ],
  },
  {
    id: "DEMO-123",
    firstName: "Margaret",
    lastName: "Stewart",
    minutesThisWeek: 0,
    totalMinutes: 214,
    averageWeeklyMinutes: 18,
    averageSessionsPerWeek: 1.2,
    lastSession: "19 Aug 2026",
    assessments: [
      { label: "Sit-to-stands", unit: "reps", direction: "higher", baseline: 7, previous: 7, current: 8, currentDate: "18 Aug 2026" },
      { label: "Balance", unit: "seconds", direction: "higher", baseline: 16, previous: 18, current: 15, currentDate: "18 Aug 2026" },
      { label: "Confidence", unit: "/ 10", direction: "higher", baseline: 5, previous: 6, current: 5, currentDate: "18 Aug 2026" },
      { label: "Falls", unit: "in 12 months", direction: "lower", baseline: 2, previous: 2, current: 3, currentDate: "18 Aug 2026" },
    ],
  },
  {
    id: "DEMO-131",
    firstName: "James",
    lastName: "Wilson",
    minutesThisWeek: 58,
    totalMinutes: 705,
    averageWeeklyMinutes: 49,
    averageSessionsPerWeek: 3.1,
    lastSession: "3 Sep 2026",
    assessments: [
      { label: "Sit-to-stands", unit: "reps", direction: "higher", baseline: 10, previous: 13, current: 15, currentDate: "1 Sep 2026" },
      { label: "Balance", unit: "seconds", direction: "higher", baseline: 20, previous: 25, current: 29, currentDate: "1 Sep 2026" },
      { label: "Confidence", unit: "/ 10", direction: "higher", baseline: 6, previous: 7, current: 9, currentDate: "1 Sep 2026" },
      { label: "Falls", unit: "in 12 months", direction: "lower", baseline: 2, previous: 1, current: 1, currentDate: "1 Sep 2026" },
    ],
  },
  {
    id: "DEMO-146",
    firstName: "Elizabeth",
    lastName: "Reid",
    minutesThisWeek: 24,
    totalMinutes: 391,
    averageWeeklyMinutes: 31,
    averageSessionsPerWeek: 2,
    lastSession: "31 Aug 2026",
    assessments: [
      { label: "Sit-to-stands", unit: "reps", direction: "higher", baseline: 6, previous: 8, current: 9, currentDate: "27 Aug 2026" },
      { label: "Balance", unit: "seconds", direction: "higher", baseline: 12, previous: 15, current: 18, currentDate: "27 Aug 2026" },
      { label: "Confidence", unit: "/ 10", direction: "higher", baseline: 4, previous: 5, current: 7, currentDate: "27 Aug 2026" },
      { label: "Falls", unit: "in 12 months", direction: "lower", baseline: 5, previous: 4, current: 3, currentDate: "27 Aug 2026" },
    ],
  },
  {
    id: "DEMO-152",
    firstName: "David",
    lastName: "Thomson",
    minutesThisWeek: 15,
    totalMinutes: 298,
    averageWeeklyMinutes: 25,
    averageSessionsPerWeek: 1.7,
    lastSession: "29 Aug 2026",
    assessments: [
      { label: "Sit-to-stands", unit: "reps", direction: "higher", baseline: 11, previous: 12, current: 13, currentDate: "25 Aug 2026" },
      { label: "Balance", unit: "seconds", direction: "higher", baseline: 22, previous: 21, current: 24, currentDate: "25 Aug 2026" },
      { label: "Confidence", unit: "/ 10", direction: "higher", baseline: 7, previous: 7, current: 8, currentDate: "25 Aug 2026" },
      { label: "Falls", unit: "in 12 months", direction: "lower", baseline: 1, previous: 1, current: 1, currentDate: "25 Aug 2026" },
    ],
  },
  {
    id: "DEMO-168",
    firstName: "Helen",
    lastName: "Murray",
    minutesThisWeek: 52,
    totalMinutes: 834,
    averageWeeklyMinutes: 48,
    averageSessionsPerWeek: 3.2,
    lastSession: "3 Sep 2026",
    assessments: [
      { label: "Sit-to-stands", unit: "reps", direction: "higher", baseline: 8, previous: 11, current: 13, currentDate: "2 Sep 2026" },
      { label: "Balance", unit: "seconds", direction: "higher", baseline: 15, previous: 20, current: 24, currentDate: "2 Sep 2026" },
      { label: "Confidence", unit: "/ 10", direction: "higher", baseline: 5, previous: 7, current: 8, currentDate: "2 Sep 2026" },
      { label: "Falls", unit: "in 12 months", direction: "lower", baseline: 3, previous: 2, current: 1, currentDate: "2 Sep 2026" },
    ],
  },
  {
    id: "DEMO-174",
    firstName: "William",
    lastName: "Fraser",
    minutesThisWeek: 28,
    totalMinutes: 516,
    averageWeeklyMinutes: 34,
    averageSessionsPerWeek: 2.3,
    lastSession: "2 Sep 2026",
    assessments: [
      { label: "Sit-to-stands", unit: "reps", direction: "higher", baseline: 10, previous: 11, current: 12, currentDate: "29 Aug 2026" },
      { label: "Balance", unit: "seconds", direction: "higher", baseline: 19, previous: 22, current: 23, currentDate: "29 Aug 2026" },
      { label: "Confidence", unit: "/ 10", direction: "higher", baseline: 6, previous: 6, current: 7, currentDate: "29 Aug 2026" },
      { label: "Falls", unit: "in 12 months", direction: "lower", baseline: 2, previous: 2, current: 2, currentDate: "29 Aug 2026" },
    ],
  },
  {
    id: "DEMO-181",
    firstName: "Jean",
    lastName: "Anderson",
    minutesThisWeek: 41,
    totalMinutes: 761,
    averageWeeklyMinutes: 45,
    averageSessionsPerWeek: 2.9,
    lastSession: "3 Sep 2026",
    assessments: [
      { label: "Sit-to-stands", unit: "reps", direction: "higher", baseline: 7, previous: 9, current: 11, currentDate: "31 Aug 2026" },
      { label: "Balance", unit: "seconds", direction: "higher", baseline: 13, previous: 17, current: 21, currentDate: "31 Aug 2026" },
      { label: "Confidence", unit: "/ 10", direction: "higher", baseline: 4, previous: 6, current: 7, currentDate: "31 Aug 2026" },
      { label: "Falls", unit: "in 12 months", direction: "lower", baseline: 4, previous: 3, current: 2, currentDate: "31 Aug 2026" },
    ],
  },
  {
    id: "DEMO-195",
    firstName: "Thomas",
    lastName: "Clark",
    minutesThisWeek: 19,
    totalMinutes: 443,
    averageWeeklyMinutes: 29,
    averageSessionsPerWeek: 1.9,
    lastSession: "30 Aug 2026",
    assessments: [
      { label: "Sit-to-stands", unit: "reps", direction: "higher", baseline: 9, previous: 10, current: 10, currentDate: "26 Aug 2026" },
      { label: "Balance", unit: "seconds", direction: "higher", baseline: 16, previous: 18, current: 20, currentDate: "26 Aug 2026" },
      { label: "Confidence", unit: "/ 10", direction: "higher", baseline: 5, previous: 6, current: 6, currentDate: "26 Aug 2026" },
      { label: "Falls", unit: "in 12 months", direction: "lower", baseline: 3, previous: 3, current: 2, currentDate: "26 Aug 2026" },
    ],
  },
  {
    id: "DEMO-207",
    firstName: "Patricia",
    lastName: "Young",
    minutesThisWeek: 36,
    totalMinutes: 687,
    averageWeeklyMinutes: 41,
    averageSessionsPerWeek: 2.7,
    lastSession: "2 Sep 2026",
    assessments: [
      { label: "Sit-to-stands", unit: "reps", direction: "higher", baseline: 6, previous: 8, current: 10, currentDate: "30 Aug 2026" },
      { label: "Balance", unit: "seconds", direction: "higher", baseline: 11, previous: 15, current: 19, currentDate: "30 Aug 2026" },
      { label: "Confidence", unit: "/ 10", direction: "higher", baseline: 4, previous: 5, current: 7, currentDate: "30 Aug 2026" },
      { label: "Falls", unit: "in 12 months", direction: "lower", baseline: 5, previous: 4, current: 3, currentDate: "30 Aug 2026" },
    ],
  },
  {
    id: "DEMO-214",
    firstName: "George",
    lastName: "Mitchell",
    minutesThisWeek: 22,
    totalMinutes: 572,
    averageWeeklyMinutes: 36,
    averageSessionsPerWeek: 2.4,
    lastSession: "1 Sep 2026",
    assessments: [
      { label: "Sit-to-stands", unit: "reps", direction: "higher", baseline: 12, previous: 13, current: 14, currentDate: "28 Aug 2026" },
      { label: "Balance", unit: "seconds", direction: "higher", baseline: 24, previous: 25, current: 27, currentDate: "28 Aug 2026" },
      { label: "Confidence", unit: "/ 10", direction: "higher", baseline: 7, previous: 8, current: 8, currentDate: "28 Aug 2026" },
      { label: "Falls", unit: "in 12 months", direction: "lower", baseline: 1, previous: 1, current: 1, currentDate: "28 Aug 2026" },
    ],
  },
  {
    id: "DEMO-228",
    firstName: "Susan",
    lastName: "Robertson",
    minutesThisWeek: 47,
    totalMinutes: 918,
    averageWeeklyMinutes: 51,
    averageSessionsPerWeek: 3.4,
    lastSession: "3 Sep 2026",
    assessments: [
      { label: "Sit-to-stands", unit: "reps", direction: "higher", baseline: 8, previous: 12, current: 14, currentDate: "1 Sep 2026" },
      { label: "Balance", unit: "seconds", direction: "higher", baseline: 17, previous: 23, current: 28, currentDate: "1 Sep 2026" },
      { label: "Confidence", unit: "/ 10", direction: "higher", baseline: 5, previous: 7, current: 9, currentDate: "1 Sep 2026" },
      { label: "Falls", unit: "in 12 months", direction: "lower", baseline: 3, previous: 1, current: 1, currentDate: "1 Sep 2026" },
    ],
  },
  {
    id: "DEMO-235",
    firstName: "Andrew",
    lastName: "Walker",
    minutesThisWeek: 12,
    totalMinutes: 336,
    averageWeeklyMinutes: 24,
    averageSessionsPerWeek: 1.6,
    lastSession: "28 Aug 2026",
    assessments: [
      { label: "Sit-to-stands", unit: "reps", direction: "higher", baseline: 9, previous: 9, current: 10, currentDate: "24 Aug 2026" },
      { label: "Balance", unit: "seconds", direction: "higher", baseline: 18, previous: 17, current: 19, currentDate: "24 Aug 2026" },
      { label: "Confidence", unit: "/ 10", direction: "higher", baseline: 6, previous: 6, current: 6, currentDate: "24 Aug 2026" },
      { label: "Falls", unit: "in 12 months", direction: "lower", baseline: 2, previous: 3, current: 2, currentDate: "24 Aug 2026" },
    ],
  },
  {
    id: "DEMO-249",
    firstName: "Dorothy",
    lastName: "Hall",
    minutesThisWeek: 39,
    totalMinutes: 804,
    averageWeeklyMinutes: 46,
    averageSessionsPerWeek: 3,
    lastSession: "2 Sep 2026",
    assessments: [
      { label: "Sit-to-stands", unit: "reps", direction: "higher", baseline: 7, previous: 10, current: 12, currentDate: "29 Aug 2026" },
      { label: "Balance", unit: "seconds", direction: "higher", baseline: 14, previous: 19, current: 22, currentDate: "29 Aug 2026" },
      { label: "Confidence", unit: "/ 10", direction: "higher", baseline: 4, previous: 6, current: 8, currentDate: "29 Aug 2026" },
      { label: "Falls", unit: "in 12 months", direction: "lower", baseline: 4, previous: 2, current: 1, currentDate: "29 Aug 2026" },
    ],
  },
  {
    id: "DEMO-256",
    firstName: "Charles",
    lastName: "King",
    minutesThisWeek: 31,
    totalMinutes: 629,
    averageWeeklyMinutes: 38,
    averageSessionsPerWeek: 2.5,
    lastSession: "1 Sep 2026",
    assessments: [
      { label: "Sit-to-stands", unit: "reps", direction: "higher", baseline: 10, previous: 12, current: 13, currentDate: "27 Aug 2026" },
      { label: "Balance", unit: "seconds", direction: "higher", baseline: 21, previous: 23, current: 25, currentDate: "27 Aug 2026" },
      { label: "Confidence", unit: "/ 10", direction: "higher", baseline: 6, previous: 7, current: 8, currentDate: "27 Aug 2026" },
      { label: "Falls", unit: "in 12 months", direction: "lower", baseline: 2, previous: 2, current: 1, currentDate: "27 Aug 2026" },
    ],
  },
];

function percentChange(from: number, to: number) {
  if (from === 0) return null;
  return Math.round(((to - from) / Math.abs(from)) * 100);
}

function changeTone(change: number | null, direction: Direction) {
  if (change === null || change === 0) return "neutral";
  const improved =
    direction === "higher" ? change > 0 : change < 0;
  return improved ? "positive" : "negative";
}

function changeLabel(from: number, to: number) {
  const change = percentChange(from, to);
  if (change === null) {
    const difference = to - from;
    return `${difference > 0 ? "+" : ""}${difference}`;
  }
  return `${change > 0 ? "+" : ""}${change}%`;
}

export default function GgcParticipantsDashboard({
  fontClassName,
}: {
  fontClassName: string;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(PARTICIPANTS[0].id);

  const filteredParticipants = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return PARTICIPANTS;
    return PARTICIPANTS.filter((participant) =>
      `${participant.firstName} ${participant.lastName} ${participant.id}`
        .toLowerCase()
        .includes(search)
    );
  }, [query]);

  const selectedParticipant =
    PARTICIPANTS.find((participant) => participant.id === selectedId) ??
    PARTICIPANTS[0];

  function handleQueryChange(value: string) {
    setQuery(value);
    const search = value.trim().toLowerCase();
    const firstMatch = PARTICIPANTS.find((participant) =>
      `${participant.firstName} ${participant.lastName} ${participant.id}`
        .toLowerCase()
        .includes(search)
    );
    if (firstMatch) setSelectedId(firstMatch.id);
  }

  return (
    <main
      className={[
        fontClassName,
        "min-h-screen bg-[#A6D5CE] text-[#25303B]",
      ].join(" ")}
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-7 flex items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F9F5EF]/70 px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-black/5">
              <span className="h-2 w-2 rounded-full bg-[#E58B66]" />
              Wobble impact dashboard
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Example Impact Dashboard
            </h1>
            <p className="mt-2 text-sm text-[#25303B]/80 sm:text-base">
              Falls Prevention Programme
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
          <div className="font-extrabold">Example dashboard — fictional data only</div>
          <div className="mt-1 text-[#25303B]/75">
            This customer preview is not connected to Supabase and contains no
            real participant records.
          </div>
        </div>

        <nav
          aria-label="Dashboard views"
          className="mb-6 flex gap-2 rounded-2xl bg-[#F9F5EF] p-2 shadow-sm ring-1 ring-black/5"
        >
          <TabButton
            active={tab === "overview"}
            onClick={() => setTab("overview")}
          >
            Cohort overview
          </TabButton>
          <TabButton
            active={tab === "participants"}
            onClick={() => setTab("participants")}
          >
            Participants
          </TabButton>
        </nav>

        {tab === "overview" ? (
          <Dashboard stats={DEMO_STATS} />
        ) : (
          <div className="space-y-6">
            <ParticipantList
              participants={filteredParticipants}
              query={query}
              selectedId={selectedId}
              onQueryChange={handleQueryChange}
              onSelect={setSelectedId}
            />
            <ParticipantDetail participant={selectedParticipant} />
          </div>
        )}

        <footer className="mt-6 text-xs text-[#25303B]/70">
          {tab === "overview"
            ? "Cohort information is aggregated and anonymised. Outcome measures are shown only where sufficient participant numbers exist."
            : "Individual information must only be available to authorised staff for participants who have explicitly consented to this use."}
        </footer>
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex-1 rounded-xl px-4 py-3 text-sm font-extrabold transition sm:flex-none",
        active
          ? "bg-[#25303B] text-[#F9F5EF] shadow-sm"
          : "bg-white/50 text-[#25303B] hover:bg-white/80",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ParticipantList({
  participants,
  query,
  selectedId,
  onQueryChange,
  onSelect,
}: {
  participants: Participant[];
  query: string;
  selectedId: string;
  onQueryChange: (value: string) => void;
  onSelect: (id: string) => void;
}) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(
    1,
    Math.ceil(participants.length / PARTICIPANTS_PER_PAGE)
  );
  const currentPage = Math.min(page, pageCount);
  const visibleParticipants = participants.slice(
    (currentPage - 1) * PARTICIPANTS_PER_PAGE,
    currentPage * PARTICIPANTS_PER_PAGE
  );

  function changePage(nextPage: number) {
    const safePage = Math.min(Math.max(nextPage, 1), pageCount);
    setPage(safePage);
    const firstParticipant =
      participants[(safePage - 1) * PARTICIPANTS_PER_PAGE];
    if (firstParticipant) onSelect(firstParticipant.id);
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-[#F9F5EF] shadow-xl ring-1 ring-black/5">
      <div className="flex flex-col gap-4 border-b border-black/10 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-extrabold">Participants</h2>
          <p className="mt-1 text-xs text-[#25303B]/65">
            Showing participants who consented to individual reporting
          </p>
        </div>
        <label className="relative block sm:w-72">
          <span className="sr-only">Search participants</span>
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#25303B]/45">
            ⌕
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setPage(1);
              onQueryChange(event.target.value);
            }}
            placeholder="Search name or ID"
            className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-[#25303B]/40 focus:border-[#25303B]/30 focus:ring-2 focus:ring-[#A6D5CE]"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <thead>
            <tr className="bg-[#25303B]/5 text-xs font-bold uppercase tracking-wide text-[#25303B]/60">
              <th className="px-5 py-3">Participant</th>
              <th className="px-4 py-3">This week</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Weekly average</th>
              <th className="px-4 py-3">Sessions / week</th>
              <th className="px-4 py-3">Last session</th>
              <th className="px-4 py-3">Outcomes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {visibleParticipants.map((participant) => {
              const improvements = participant.assessments.filter((assessment) => {
                const change = percentChange(
                  assessment.baseline,
                  assessment.current
                );
                return changeTone(change, assessment.direction) === "positive";
              }).length;
              const displayedImprovements = Math.max(1, improvements);
              const selected = selectedId === participant.id;

              return (
                <tr
                  key={participant.id}
                  className={[
                    "cursor-pointer transition",
                    selected ? "bg-[#A6D5CE]/30" : "hover:bg-white",
                  ].join(" ")}
                  onClick={() => onSelect(participant.id)}
                >
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => onSelect(participant.id)}
                      className="text-left"
                    >
                      <span className="block text-sm font-extrabold">
                        {participant.firstName} {participant.lastName}
                      </span>
                      <span className="mt-0.5 block text-xs text-[#25303B]/55">
                        {participant.id}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-4 text-sm font-bold">
                    {participant.minutesThisWeek} min
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {participant.totalMinutes} min
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {participant.averageWeeklyMinutes} min
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {participant.averageSessionsPerWeek}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {participant.lastSession}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={[
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold",
                        displayedImprovements >= 3
                          ? "bg-[#34D399]/15 text-[#177052]"
                          : displayedImprovements >= 1
                            ? "bg-[#E7B450]/25 text-[#795A13]"
                            : "bg-[#E58B66]/15 text-[#9A422D]",
                      ].join(" ")}
                    >
                      {displayedImprovements} of 4 improving
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {participants.length === 0 && (
          <div className="p-8 text-center text-sm text-[#25303B]/65">
            No participants match that search.
          </div>
        )}
      </div>
      {participants.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-black/10 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-[#25303B]/60">
            Showing {(currentPage - 1) * PARTICIPANTS_PER_PAGE + 1}–
            {Math.min(
              currentPage * PARTICIPANTS_PER_PAGE,
              participants.length
            )}{" "}
            of {participants.length} participants
          </span>
          {pageCount > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-lg bg-white px-3 py-2 text-xs font-extrabold ring-1 ring-black/10 transition hover:bg-[#A6D5CE]/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 text-xs font-bold text-[#25303B]/65">
                Page {currentPage} of {pageCount}
              </span>
              <button
                type="button"
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === pageCount}
                className="rounded-lg bg-white px-3 py-2 text-xs font-extrabold ring-1 ring-black/10 transition hover:bg-[#A6D5CE]/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ParticipantDetail({ participant }: { participant: Participant }) {
  return (
    <section className="rounded-2xl bg-[#25303B] p-5 text-[#F9F5EF] shadow-xl sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-[#A6D5CE]">
            Participant record
          </div>
          <h2 className="mt-1 text-2xl font-extrabold">
            {participant.firstName} {participant.lastName}
          </h2>
          <p className="mt-1 text-xs text-[#F9F5EF]/60">{participant.id}</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#34D399]/15 px-3 py-1.5 text-xs font-bold text-[#8BE6C1] ring-1 ring-[#34D399]/25">
          <span className="h-2 w-2 rounded-full bg-[#34D399]" />
          Consent recorded
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <DetailKpi label="Minutes this week" value={`${participant.minutesThisWeek}`} suffix="min" />
        <DetailKpi label="Total minutes" value={`${participant.totalMinutes}`} suffix="min" />
        <DetailKpi label="Weekly average" value={`${participant.averageWeeklyMinutes}`} suffix="min" />
        <DetailKpi label="Sessions / week" value={`${participant.averageSessionsPerWeek}`} />
        <DetailKpi label="Last session" value={participant.lastSession} compact />
      </div>

      <div className="mt-7">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#A6D5CE]">
              Outcome assessments
            </h3>
            <p className="mt-1 text-xs text-[#F9F5EF]/60">
              Current results compared with baseline and the previous assessment
            </p>
          </div>
          <div className="text-xs text-[#F9F5EF]/50">
            Green indicates improvement
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {participant.assessments.map((assessment) => (
            <AssessmentCard key={assessment.label} assessment={assessment} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DetailKpi({
  label,
  value,
  suffix,
  compact = false,
}: {
  label: string;
  value: string;
  suffix?: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[#F9F5EF]/10 p-4 ring-1 ring-white/10">
      <div className="text-xs font-semibold text-[#F9F5EF]/60">{label}</div>
      <div className={["mt-1 font-extrabold", compact ? "text-base" : "text-2xl"].join(" ")}>
        {value}
        {suffix && (
          <span className="ml-1 text-xs font-semibold text-[#F9F5EF]/55">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function AssessmentCard({ assessment }: { assessment: Assessment }) {
  const baselineChange = percentChange(
    assessment.baseline,
    assessment.current
  );
  const previousChange = percentChange(
    assessment.previous,
    assessment.current
  );

  return (
    <article className="rounded-xl bg-[#F9F5EF] p-4 text-[#25303B] shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-extrabold">{assessment.label}</h4>
          <div className="mt-0.5 text-xs text-[#25303B]/55">
            Reassessed {assessment.currentDate}
          </div>
        </div>
        <ChangeBadge
          label={changeLabel(assessment.baseline, assessment.current)}
          tone={changeTone(baselineChange, assessment.direction)}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Result label="Baseline" value={assessment.baseline} unit={assessment.unit} />
        <Result label="Previous" value={assessment.previous} unit={assessment.unit} />
        <Result label="Current" value={assessment.current} unit={assessment.unit} emphasis />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3 text-xs">
        <span className="text-[#25303B]/60">Change since last assessment</span>
        <ChangeText
          label={changeLabel(assessment.previous, assessment.current)}
          tone={changeTone(previousChange, assessment.direction)}
        />
      </div>
    </article>
  );
}

function Result({
  label,
  value,
  unit,
  emphasis = false,
}: {
  label: string;
  value: number;
  unit: string;
  emphasis?: boolean;
}) {
  return (
    <div className={["rounded-lg p-2.5", emphasis ? "bg-[#A6D5CE]/35" : "bg-black/[0.035]"].join(" ")}>
      <div className="text-[10px] font-bold uppercase tracking-wide text-[#25303B]/50">
        {label}
      </div>
      <div className="mt-1 text-xl font-extrabold">{value}</div>
      <div className="text-[10px] text-[#25303B]/55">{unit}</div>
    </div>
  );
}

function ChangeBadge({
  label,
  tone,
}: {
  label: string;
  tone: "positive" | "negative" | "neutral";
}) {
  return (
    <span
      className={[
        "rounded-full px-2.5 py-1 text-xs font-extrabold",
        tone === "positive"
          ? "bg-[#34D399]/15 text-[#177052]"
          : tone === "negative"
            ? "bg-[#E58B66]/15 text-[#9A422D]"
            : "bg-[#25303B]/10 text-[#25303B]/65",
      ].join(" ")}
    >
      {label} from baseline
    </span>
  );
}

function ChangeText({
  label,
  tone,
}: {
  label: string;
  tone: "positive" | "negative" | "neutral";
}) {
  return (
    <span
      className={[
        "font-extrabold",
        tone === "positive"
          ? "text-[#177052]"
          : tone === "negative"
            ? "text-[#9A422D]"
            : "text-[#25303B]/65",
      ].join(" ")}
    >
      {label}
    </span>
  );
}
