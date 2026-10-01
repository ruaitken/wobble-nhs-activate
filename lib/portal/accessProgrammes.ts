export type AccessProgramme = {
  campaign_id: string;
  programme_name: string;
  org_name: string | null;
  access_starts_at: string | null;
  access_ends_at: string | null;
  named_reporting: boolean;
  consented: boolean | null;
};

export function patientProgrammeName(serviceName: string | null, fallback: string) {
  const name = (serviceName ?? "").trim();
  if (!name) return fallback;
  return name.replace(/\s*\([^)]*\d{4}[^)]*\)\s*$/, "").trim() || name;
}

function endTime(item: AccessProgramme) {
  if (!item.access_ends_at) return Infinity;
  const time = Date.parse(item.access_ends_at);
  return Number.isNaN(time) ? Infinity : time;
}

export function sortAccessProgrammes(items: AccessProgramme[]) {
  return [...items].sort((a, b) => endTime(a) - endTime(b));
}

export function currentAccess(items: AccessProgramme[], now = Date.now()) {
  const live = items.filter((item) => {
    const starts = item.access_starts_at ? Date.parse(item.access_starts_at) : -Infinity;
    return starts <= now && endTime(item) > now;
  });
  return live.sort((a, b) => endTime(b) - endTime(a))[0] ?? null;
}
