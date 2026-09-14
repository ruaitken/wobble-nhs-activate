import { getSupabaseServer } from "@/lib/supabaseServer";

const FORBIDDEN_KEYS = new Set([
  "email",
  "first_name",
  "last_name",
  "invited_email",
  "user_id",
]);

function hasForbiddenKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasForbiddenKey);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value as Record<string, unknown>).some(([key, child]) => {
    if (FORBIDDEN_KEYS.has(key)) return true;
    return hasForbiddenKey(child);
  });
}

export async function getPortalCampaignStats(campaignId: string) {
  const admin = getSupabaseServer();
  const { data, error } = await admin.rpc("get_campaign_stats", {
    p_campaign_id: campaignId,
  });
  if (error) throw error;
  if (hasForbiddenKey(data)) {
    throw new Error("aggregate_contains_personal_data");
  }
  return data;
}
