import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const workdir = path.join(root, ".phase0", "supabase-reference");
const configPath = path.join(workdir, "supabase", "config.toml");
const envPath = path.join(workdir, ".env");
const templateSrc = path.join(root, "supabase", "templates", "magic_link.html");
const templateDest = path.join(workdir, "supabase", "templates", "magic_link.html");

const SMTP_BLOCK = `[auth.email.smtp]
enabled = true
host = "smtp.resend.com"
port = 587
user = "resend"
pass = "env(RESEND_API_KEY)"
admin_email = "enquiries@wobblebalance.com"
sender_name = "Wobble"
`;

function readDotEnv(filePath) {
  if (!existsSync(filePath)) return {};
  const values = {};
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

const localEnv = readDotEnv(path.join(root, ".env.local"));
const apiKey = (localEnv.RESEND_API_KEY ?? "").trim();
if (!apiKey) {
  console.error("RESEND_API_KEY is missing from .env.local.");
  process.exit(1);
}

if (!existsSync(configPath)) {
  console.error("Local practice Supabase config was not found.");
  process.exit(1);
}

writeFileSync(envPath, `RESEND_API_KEY=${apiKey}\n`, { mode: 0o600 });

let config = readFileSync(configPath, "utf8");
if (config.includes('host = "smtp.resend.com"')) {
  config = config.replace(/\[auth\.email\.smtp\][\s\S]*?sender_name = "[^"]*"\n/, SMTP_BLOCK);
} else {
  const commented = `# Use a production-ready SMTP server
# [auth.email.smtp]
# enabled = true
# host = "smtp.sendgrid.net"
# port = 587
# user = "apikey"
# pass = "env(SENDGRID_API_KEY)"
# admin_email = "admin@email.com"
# sender_name = "Admin"
`;
  if (!config.includes(commented)) {
    console.error("Could not find the SMTP block in the local config.");
    process.exit(1);
  }
  config = config.replace(commented, SMTP_BLOCK);
}
writeFileSync(configPath, config);

if (existsSync(templateSrc)) {
  copyFileSync(templateSrc, templateDest);
}

const env = { ...process.env, RESEND_API_KEY: apiKey };
const stop = spawnSync(
  "supabase",
  ["stop", "--workdir", workdir],
  { encoding: "utf8", env }
);
if (stop.status !== 0) {
  console.error(stop.stderr || stop.stdout);
  process.exit(stop.status ?? 1);
}

const start = spawnSync(
  "supabase",
  ["start", "--workdir", workdir],
  { encoding: "utf8", env }
);
if (start.status !== 0) {
  console.error(start.stderr || start.stdout);
  process.exit(start.status ?? 1);
}

console.log("Practice Auth now sends magic links through Resend.");
console.log("From: Wobble <enquiries@wobblebalance.com>");
console.log("Live hosted Auth was not changed.");
