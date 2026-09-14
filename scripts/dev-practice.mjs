import { spawn, spawnSync } from "node:child_process";
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

if (!env.API_URL || !env.ANON_KEY || !env.SERVICE_ROLE_KEY) {
  console.error("Local Supabase is not running.");
  process.exit(1);
}

const child = spawn("npx", ["next", "dev", "--port", "3001"], {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: env.API_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: env.SERVICE_ROLE_KEY,
    NEXT_DIST_DIR: ".next-practice",
    PORT: "3001",
  },
});

child.on("exit", (code) => process.exit(code ?? 0));
