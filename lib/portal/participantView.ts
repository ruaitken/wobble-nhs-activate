export type OutcomeDirection = "higher" | "lower";

export type ParticipantAssessment = {
  label: string;
  unit: string;
  direction: OutcomeDirection;
  baseline: number;
  previous: number;
  current: number;
  currentDate: string;
};

export type PortalParticipant = {
  id: string;
  first_name: string;
  last_name: string;
  minutes_this_week: number;
  total_minutes: number;
  average_weekly_minutes: number;
  average_sessions_per_week: number;
  last_session: string | null;
  assessments: ParticipantAssessment[];
};

export type ParticipantSnapshot = {
  campaign_id: string;
  shown: number;
  hidden: number;
  participants: PortalParticipant[];
};

type AssessmentRow = {
  assessment_type: string | null;
  sit_to_stand_count: number | null;
  balance_score: number | null;
  confidence_score: number | null;
  fall_count: number | null;
  created_at: string | null;
};

export type ClaimWindow = {
  claimedAt: string | null;
  expiresAt: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function londonDay(value: string) {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(time);
}

function addDays(day: string, days: number) {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function mondayOf(day: string) {
  const date = new Date(`${day}T00:00:00Z`);
  const offset = (date.getUTCDay() + 6) % 7;
  return addDays(day, -offset);
}

export function weekStartFromKey(key: string) {
  const isoWeek = key.match(/^(\d{4})-(\d{2})$/);
  if (isoWeek) {
    const year = Number(isoWeek[1]);
    const week = Number(isoWeek[2]);
    if (week < 1 || week > 53) return null;
    const weekOne = mondayOf(`${year}-01-04`);
    return addDays(weekOne, (week - 1) * 7);
  }
  const dated = key.match(/^\d{4}-\d{2}-\d{2}/);
  if (dated && !Number.isNaN(Date.parse(`${dated[0]}T00:00:00Z`))) {
    return mondayOf(dated[0]);
  }
  return null;
}

function windowDays(window: ClaimWindow) {
  return {
    start: window.claimedAt ? londonDay(window.claimedAt) : null,
    end: window.expiresAt ? londonDay(window.expiresAt) : null,
  };
}

export function weeklyMinutesInWindow(
  value: unknown,
  window: ClaimWindow
): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  const { start, end } = windowDays(window);
  const result: Record<string, number> = {};
  for (const [key, minutes] of Object.entries(value as Record<string, unknown>)) {
    const weekStart = weekStartFromKey(key);
    const n = Number(minutes);
    if (!weekStart || !Number.isFinite(n)) continue;
    if (end && weekStart > end) continue;
    if (start && addDays(weekStart, 6) < start) continue;
    result[weekStart] = (result[weekStart] ?? 0) + n;
  }
  return result;
}

export function sessionDatesInWindow(dates: unknown, window: ClaimWindow) {
  if (!Array.isArray(dates)) return [];
  const { start, end } = windowDays(window);
  return dates
    .map((value) => String(value).slice(0, 10))
    .filter((day) => !Number.isNaN(Date.parse(`${day}T00:00:00Z`)))
    .filter((day) => (!start || day >= start) && (!end || day <= end));
}

export function sumWeeklyMinutes(value: unknown): number {
  if (!value || typeof value !== "object") return 0;
  return Object.values(value as Record<string, unknown>).reduce<number>(
    (sum, minutes) => {
      const n = Number(minutes);
      return sum + (Number.isFinite(n) ? n : 0);
    },
    0
  );
}

export function latestWeekMinutes(value: unknown) {
  if (!value || typeof value !== "object") return 0;
  const entries = Object.entries(value as Record<string, unknown>)
    .map(([key, minutes]) => ({
      time: Date.parse(key),
      minutes: Number(minutes),
    }))
    .filter((entry) => Number.isFinite(entry.minutes));
  if (entries.length === 0) return 0;
  const now = Date.now();
  const current = entries.find(
    (entry) =>
      !Number.isNaN(entry.time) &&
      now >= entry.time &&
      now < entry.time + 7 * 24 * 60 * 60 * 1000
  );
  if (current) return current.minutes;
  return [...entries].sort((a, b) => b.time - a.time)[0]?.minutes ?? 0;
}

export function averageWeeklyMinutes(value: unknown) {
  if (!value || typeof value !== "object") return 0;
  const weeks = Object.values(value as Record<string, unknown>)
    .map((minutes) => Number(minutes))
    .filter((minutes) => Number.isFinite(minutes) && minutes > 0);
  if (weeks.length === 0) return 0;
  return Math.round(weeks.reduce((sum, minutes) => sum + minutes, 0) / weeks.length);
}

export function latestDate(dates: unknown) {
  if (!Array.isArray(dates) || dates.length === 0) return null;
  const times = dates
    .map((value) => Date.parse(String(value)))
    .filter((time) => !Number.isNaN(time));
  if (times.length === 0) return null;
  return new Date(Math.max(...times)).toISOString().slice(0, 10);
}

export function averageSessionsPerWeek(dates: unknown) {
  if (!Array.isArray(dates) || dates.length === 0) return 0;
  const weeks = new Set(
    dates
      .map((value) => Date.parse(String(value)))
      .filter((time) => !Number.isNaN(time))
      .map((time) => {
        const date = new Date(time);
        const year = date.getUTCFullYear();
        const start = new Date(Date.UTC(year, 0, 1));
        return `${year}-${Math.floor((time - start.getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
      })
  );
  if (weeks.size === 0) return 0;
  return Math.round((dates.length / weeks.size) * 10) / 10;
}

export function formatSessionDate(value: string | null) {
  if (!value) return "No sessions yet";
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(time);
}

function metric(row: AssessmentRow | undefined, key: keyof AssessmentRow) {
  const value = row?.[key];
  return typeof value === "number" ? value : 0;
}

export function assessmentsFromRows(
  rows: AssessmentRow[],
  window: ClaimWindow
): ParticipantAssessment[] {
  const timed = rows
    .map((row) => ({ row, time: Date.parse(row.created_at ?? "") }))
    .filter((entry) => !Number.isNaN(entry.time))
    .sort((a, b) => a.time - b.time);
  const opens = window.claimedAt ? Date.parse(window.claimedAt) : -Infinity;
  const closes = window.expiresAt ? Date.parse(window.expiresAt) : Infinity;
  const inWindow = timed.filter((entry) => entry.time > opens && entry.time <= closes);

  const baseline =
    timed.filter((entry) => entry.time <= opens).at(-1) ?? inWindow[0];
  if (!baseline) return [];
  const later = inWindow.filter((entry) => entry.time > baseline.time);
  if (later.length === 0) return [];

  const initial = baseline.row;
  const current = later[later.length - 1].row;
  const previous = later.length > 1 ? later[later.length - 2].row : initial;
  const currentDate = formatSessionDate(current.created_at);

  return [
    {
      label: "Sit-to-stands",
      unit: "reps",
      direction: "higher",
      baseline: metric(initial, "sit_to_stand_count"),
      previous: metric(previous, "sit_to_stand_count"),
      current: metric(current, "sit_to_stand_count"),
      currentDate,
    },
    {
      label: "Balance",
      unit: "score",
      direction: "higher",
      baseline: metric(initial, "balance_score"),
      previous: metric(previous, "balance_score"),
      current: metric(current, "balance_score"),
      currentDate,
    },
    {
      label: "Confidence",
      unit: "score",
      direction: "higher",
      baseline: metric(initial, "confidence_score"),
      previous: metric(previous, "confidence_score"),
      current: metric(current, "confidence_score"),
      currentDate,
    },
    {
      label: "Falls",
      unit: "falls",
      direction: "lower",
      baseline: metric(initial, "fall_count"),
      previous: metric(previous, "fall_count"),
      current: metric(current, "fall_count"),
      currentDate,
    },
  ];
}

export function percentChange(from: number, to: number) {
  if (from === 0) return null;
  return Math.round(((to - from) / Math.abs(from)) * 100);
}

export function changeTone(
  change: number | null,
  direction: OutcomeDirection
): "positive" | "negative" | "neutral" {
  if (change === null || change === 0) return "neutral";
  const improved = direction === "higher" ? change > 0 : change < 0;
  return improved ? "positive" : "negative";
}

export function changeLabel(from: number, to: number) {
  const change = percentChange(from, to);
  if (change === null) {
    const difference = to - from;
    return `${difference > 0 ? "+" : ""}${difference}`;
  }
  return `${change > 0 ? "+" : ""}${change}%`;
}

export function improvingCount(assessments: ParticipantAssessment[]) {
  return assessments.filter((assessment) => {
    const change = percentChange(assessment.baseline, assessment.current);
    return changeTone(change, assessment.direction) === "positive";
  }).length;
}
