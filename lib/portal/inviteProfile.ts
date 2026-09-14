import { getSupabaseServer } from "@/lib/supabaseServer";

export const REPORTING_CONSENT_VERSION = "portal-v1";

export function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function namesAreValid(firstName: string, lastName: string) {
  return normalizeName(firstName).length > 0 && normalizeName(lastName).length > 0;
}

export function parseConsentChoice(value: unknown): boolean | null {
  if (value === true || value === "true" || value === "yes") return true;
  if (value === false || value === "false" || value === "no") return false;
  return null;
}

async function findUserIdByEmail(email: string) {
  const admin = getSupabaseServer();
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (error) throw error;
  return data.users.find((user) => user.email?.toLowerCase() === email)?.id ?? null;
}

export async function loadProfileNamesByEmail(email: string) {
  const userId = await findUserIdByEmail(email);
  if (!userId) return { first_name: "", last_name: "" };

  const admin = getSupabaseServer();
  const { data, error } = await admin
    .from("user_meta")
    .select("first_name, last_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return {
    first_name: data?.first_name ?? "",
    last_name: data?.last_name ?? "",
  };
}

export async function saveProfileNames({
  userId,
  firstName,
  lastName,
}: {
  userId: string;
  firstName: string;
  lastName: string;
}) {
  const admin = getSupabaseServer();
  const { error } = await admin.from("user_meta").upsert(
    {
      user_id: userId,
      first_name: normalizeName(firstName),
      last_name: normalizeName(lastName),
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}

export async function saveReportingConsent({
  userId,
  campaignId,
  consented,
}: {
  userId: string;
  campaignId: string;
  consented: boolean;
}) {
  const admin = getSupabaseServer();
  const now = new Date().toISOString();
  const { error } = await admin.from("portal_reporting_consents").upsert(
    {
      user_id: userId,
      campaign_id: campaignId,
      consented,
      consent_version: REPORTING_CONSENT_VERSION,
      consented_at: consented ? now : null,
      withdrawn_at: null,
    },
    { onConflict: "user_id,campaign_id" }
  );
  if (error) throw error;
}
