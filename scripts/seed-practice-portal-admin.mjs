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

const email = "practice-admin@example.com";
const realAdminEmail = "ruaitken@wobblebalance.com";
const viewerEmail = "practice-viewer@example.com";
const outsiderEmail = "practice-outsider@example.com";

async function upsertUser(serviceUrl, serviceKey, userEmail) {
  const list = await fetch(`${serviceUrl}/auth/v1/admin/users?page=1&per_page=200`, {
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
    },
  });
  const listed = await list.json();
  const existing = (listed.users ?? []).find(
    (user) => user.email?.toLowerCase() === userEmail
  );
  if (existing) return existing.id;

  const created = await fetch(`${serviceUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: userEmail,
      email_confirm: true,
    }),
  });
  const body = await created.json();
  if (!created.ok) {
    throw new Error(body.msg || body.message || "Could not create practice user");
  }
  return body.id;
}

const adminId = await upsertUser(env.API_URL, env.SERVICE_ROLE_KEY, email);
const realAdminId = await upsertUser(env.API_URL, env.SERVICE_ROLE_KEY, realAdminEmail);
const viewerId = await upsertUser(env.API_URL, env.SERVICE_ROLE_KEY, viewerEmail);
await upsertUser(env.API_URL, env.SERVICE_ROLE_KEY, outsiderEmail);

async function upsertMember(userId, role) {
  const member = await fetch(
    `${env.API_URL}/rest/v1/portal_org_members?on_conflict=org_id,user_id`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.SERVICE_ROLE_KEY}`,
        apikey: env.SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        org_id: "PRACTICE_ORG",
        user_id: userId,
        role,
      }),
    }
  );
  if (!member.ok) {
    const text = await member.text();
    throw new Error(`Could not add practice portal member: ${text}`);
  }
}

await upsertMember(adminId, "customer_admin");
await upsertMember(realAdminId, "wobble_admin");
await upsertMember(viewerId, "viewer");

console.log(
  "Practice portal users ready: ruaitken@wobblebalance.com (Wobble admin), practice-admin@example.com (admin), practice-viewer@example.com (viewer), practice-outsider@example.com (no org)."
);
