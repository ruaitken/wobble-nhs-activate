import { spawnSync } from "node:child_process";
import path from "node:path";

const workdir = path.join(process.cwd(), ".phase0", "supabase-reference");
const status = spawnSync(
  "supabase",
  ["status", "--workdir", workdir, "-o", "env"],
  { encoding: "utf8" }
);

if (status.status !== 0) {
  console.error(status.stderr || status.stdout);
  process.exit(status.status ?? 1);
}

const env = {};
for (const line of status.stdout.split("\n")) {
  const match = line.match(/^(ANON_KEY|API_URL|SERVICE_ROLE_KEY)="(.*)"$/);
  if (match) env[match[1]] = match[2];
}

const headers = {
  Authorization: `Bearer ${env.SERVICE_ROLE_KEY}`,
  apikey: env.SERVICE_ROLE_KEY,
  "Content-Type": "application/json",
};

const MEMBERS = [
  // Falls 2026 — 12 members, enough to lift the privacy hold
  { email: "practice-member-01@example.com", first: "Pat", last: "River", age: "72-74", gender: "Female", campaign: "PRACTICE_FALLS_2026", minutes: 420, streak: 18, paired: true, consent: true },
  { email: "practice-member-02@example.com", first: "Sam", last: "Brook", age: "68-70", gender: "Male", campaign: "PRACTICE_FALLS_2026", minutes: 360, streak: 14, paired: true, consent: true },
  { email: "practice-member-03@example.com", first: "Alex", last: "Hill", age: "75-80", gender: "Female", campaign: "PRACTICE_FALLS_2026", minutes: 510, streak: 21, paired: true, consent: true },
  { email: "practice-member-04@example.com", first: "Jamie", last: "Dale", age: "64-66", gender: "Male", campaign: "PRACTICE_FALLS_2026", minutes: 280, streak: 9, paired: true, consent: true },
  { email: "practice-member-05@example.com", first: "Morgan", last: "Field", age: "70-72", gender: "Female", campaign: "PRACTICE_FALLS_2026", minutes: 190, streak: 6, paired: true, consent: true },
  { email: "practice-member-06@example.com", first: "Riley", last: "Shaw", age: "58-60", gender: "Male", campaign: "PRACTICE_FALLS_2026", minutes: 240, streak: 11, paired: true, consent: true },
  { email: "practice-member-07@example.com", first: "Casey", last: "Wood", age: "66-68", gender: "Female", campaign: "PRACTICE_FALLS_2026", minutes: 330, streak: 12, paired: true, consent: true },
  { email: "practice-member-08@example.com", first: "Quinn", last: "Lane", age: "80-84", gender: "Male", campaign: "PRACTICE_FALLS_2026", minutes: 150, streak: 4, paired: true, consent: true },
  { email: "practice-member-09@example.com", first: "Drew", last: "Park", age: "61-63", gender: "Female", campaign: "PRACTICE_FALLS_2026", minutes: 90, streak: 3, paired: false, consent: false },
  { email: "practice-member-10@example.com", first: "Reese", last: "Vale", age: "73-75", gender: "Male", campaign: "PRACTICE_FALLS_2026", minutes: 200, streak: 7, paired: false, consent: false },
  { email: "practice-member-11@example.com", first: "Skye", last: "North", age: "55-57", gender: "Female", campaign: "PRACTICE_FALLS_2026", minutes: 0, streak: 0, paired: false, consent: null },
  { email: "practice-member-12@example.com", first: "Blair", last: "West", age: "76-78", gender: "Male", campaign: "PRACTICE_FALLS_2026", minutes: 70, streak: 2, paired: false, consent: null },
  // NN4 2026 — 4 members, stays under the privacy hold
  { email: "practice-member-13@example.com", first: "Eden", last: "Cross", age: "62-64", gender: "Female", campaign: "PRACTICE_NN4_2026", minutes: 80, streak: 3, paired: false },
  { email: "practice-member-14@example.com", first: "Finley", last: "Marsh", age: "70-72", gender: "Male", campaign: "PRACTICE_NN4_2026", minutes: 40, streak: 1, paired: false },
  { email: "practice-member-15@example.com", first: "Harper", last: "Glen", age: "67-69", gender: "Female", campaign: "PRACTICE_NN4_2026", minutes: 0, streak: 0, paired: false },
  { email: "practice-member-16@example.com", first: "Rowan", last: "Beck", age: "74-76", gender: "Male", campaign: "PRACTICE_NN4_2026", minutes: 20, streak: 1, paired: false },
  // Historical Falls 2025 — 8 members so the archived overview can open
  { email: "practice-member-17@example.com", first: "Avery", last: "Stone", age: "71-73", gender: "Female", campaign: "PRACTICE_FALLS_2025", minutes: 300, streak: 10, paired: true, consent: true },
  { email: "practice-member-18@example.com", first: "Cameron", last: "Ford", age: "69-71", gender: "Male", campaign: "PRACTICE_FALLS_2025", minutes: 260, streak: 8, paired: true, consent: true },
  { email: "practice-member-19@example.com", first: "Dakota", last: "Reed", age: "76-78", gender: "Female", campaign: "PRACTICE_FALLS_2025", minutes: 180, streak: 5, paired: true, consent: true },
  { email: "practice-member-20@example.com", first: "Ellis", last: "Hart", age: "63-65", gender: "Male", campaign: "PRACTICE_FALLS_2025", minutes: 220, streak: 7, paired: true, consent: true },
  { email: "practice-member-21@example.com", first: "Frankie", last: "Cole", age: "80-82", gender: "Female", campaign: "PRACTICE_FALLS_2025", minutes: 140, streak: 4, paired: true, consent: true },
  { email: "practice-member-22@example.com", first: "Gray", last: "Bell", age: "66-68", gender: "Male", campaign: "PRACTICE_FALLS_2025", minutes: 110, streak: 3, paired: false, consent: false },
  { email: "practice-member-23@example.com", first: "Indigo", last: "Wren", age: "59-61", gender: "Female", campaign: "PRACTICE_FALLS_2025", minutes: 95, streak: 2, paired: false, consent: null },
  { email: "practice-member-24@example.com", first: "Jules", last: "Frost", age: "77-79", gender: "Male", campaign: "PRACTICE_FALLS_2025", minutes: 0, streak: 0, paired: false, consent: null },
];

const EXTRA_FALLS_NAMES = [
  ["Noah", "Cole"],
  ["Mia", "Hart"],
  ["Leo", "Nash"],
  ["Eva", "Quinn"],
  ["Owen", "Blythe"],
  ["Ivy", "Shore"],
  ["Hugo", "Penn"],
  ["Ruby", "Vale"],
  ["Theo", "Marsh"],
  ["Lila", "Croft"],
  ["Arlo", "Beech"],
  ["Nina", "Frost"],
  ["Jude", "Hale"],
  ["Cora", "Wynn"],
];

for (const [index, [first, last]] of EXTRA_FALLS_NAMES.entries()) {
  MEMBERS.push({
    email: `practice-member-${String(25 + index).padStart(2, "0")}@example.com`,
    first,
    last,
    age: index % 2 ? "70-72" : "64-66",
    gender: index % 2 ? "Male" : "Female",
    campaign: "PRACTICE_FALLS_2026",
    minutes: 110 + index * 12,
    streak: 2 + (index % 9),
    paired: index % 3 === 0,
    consent: true,
  });
}

async function rest(path, { method = "GET", body, prefer } = {}) {
  const response = await fetch(`${env.API_URL}/rest/v1/${path}`, {
    method,
    headers: {
      ...headers,
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${path} failed: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

const listedUsers = await fetch(`${env.API_URL}/auth/v1/admin/users?page=1&per_page=200`, {
  headers,
}).then((response) => response.json());
const usersByEmail = new Map(
  (listedUsers.users ?? []).map((user) => [user.email?.toLowerCase(), user.id])
);

async function upsertUser(email) {
  const existing = usersByEmail.get(email);
  if (existing) return existing;

  const created = await fetch(`${env.API_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      email_confirm: true,
    }),
  });
  const body = await created.json();
  if (!created.ok) {
    throw new Error(body.msg || body.message || `Could not create ${email}`);
  }
  usersByEmail.set(email, body.id);
  return body.id;
}

function weekKeys(count) {
  const keys = [];
  const start = new Date("2026-01-05T00:00:00Z");
  for (let i = 0; i < count; i += 1) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i * 7);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

function exerciseDates(count) {
  const dates = [];
  const start = new Date("2026-01-06T00:00:00Z");
  for (let i = 0; i < count; i += 1) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i * 2);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function weeklyMinutes(total, weeks) {
  if (total <= 0) return {};
  const keys = weekKeys(weeks);
  const base = Math.floor(total / weeks);
  const leftover = total - base * weeks;
  return Object.fromEntries(
    keys.map((key, index) => [key, index === 0 ? base + leftover : base])
  );
}

const created = [];
for (const member of MEMBERS) {
  const userId = await upsertUser(member.email);
  const weeks = member.minutes > 0 ? 8 : 0;
  const sessions = member.minutes > 0 ? Math.max(3, Math.round(member.minutes / 15)) : 0;

  await rest("user_meta?on_conflict=user_id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: {
      user_id: userId,
      first_name: member.first,
      last_name: member.last,
      age_range: member.age,
      gender: member.gender,
    },
  });

  await rest("user_data?on_conflict=user_id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: {
      user_id: userId,
      current_streak: member.streak,
      longest_streak: member.streak,
      weekly_minutes: weeklyMinutes(member.minutes, weeks || 1),
      exercise_dates: exerciseDates(sessions),
      user_tz: "Europe/London",
    },
  });

  await rest("nhs_claims?on_conflict=campaign_id,user_id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: {
      campaign_id: member.campaign,
      user_id: userId,
      status: "active",
      first_name: member.consent === false ? "" : member.first,
      last_name: member.consent === false ? "" : member.last,
    },
  });

  if (member.paired) {
    const existing = await rest(
      `assessments?user_id=eq.${userId}&select=id&limit=1`
    );
    if (!existing?.length) {
      const initialSts = 8 + created.length;
      await rest("assessments", {
        method: "POST",
        prefer: "return=minimal",
        body: [
          {
            user_id: userId,
            assessment_type: "initial",
            sit_to_stand_count: initialSts,
            balance_score: 3,
            confidence_score: 90,
            fall_count: 2,
            created_at: "2026-01-15T10:00:00Z",
          },
          {
            user_id: userId,
            assessment_type: "retake",
            sit_to_stand_count: initialSts + 3,
            balance_score: 5,
            confidence_score: 110,
            fall_count: 1,
            created_at: "2026-06-15T10:00:00Z",
          },
        ],
      });
    }
  }

  if (member.consent === true || member.consent === false) {
    await rest("portal_reporting_consents?on_conflict=user_id,campaign_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: {
        user_id: userId,
        campaign_id: member.campaign,
        consented: member.consent,
        consent_version: "practice-v1",
        consented_at: member.consent ? "2026-02-01T10:00:00Z" : null,
        withdrawn_at: null,
      },
    });
  }

  created.push(member.campaign);
}

const counts = created.reduce((acc, id) => {
  acc[id] = (acc[id] ?? 0) + 1;
  return acc;
}, {});

console.log("Practice participants ready:", counts);

await rest("nhs_campaigns?id=eq.PRACTICE_FALLS_2026", {
  method: "PATCH",
  prefer: "return=minimal",
  body: { seat_limit: 50 },
});
