import { getSupabaseUrl } from "@/lib/supabase/env";
import { getSupabaseServer } from "@/lib/supabaseServer";

export type AppAccessMode = "live" | "practice" | "unavailable";

export type AppAccessResult =
  | { status: "granted"; mode: "live" | "practice" }
  | { status: "pending"; mode: "live" | "unavailable"; reason: string };

function isLocalSupabaseUrl(url: string) {
  return url.includes("127.0.0.1") || url.includes("localhost");
}

export function classifyAppAccessMode() {
  const hasKeys = Boolean(
    process.env.RC_API_KEY && process.env.RC_ENTITLEMENT_ID
  );
  if (hasKeys) return "live" as const;
  try {
    if (isLocalSupabaseUrl(getSupabaseUrl())) return "practice" as const;
  } catch {
    return "unavailable" as const;
  }
  return "unavailable" as const;
}

async function revenueCatFetch(path: string, init?: RequestInit) {
  const apiKey = process.env.RC_API_KEY;
  if (!apiKey) throw new Error("missing_rc_key");
  const response = await fetch(`https://api.revenuecat.com/v1${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    throw new Error(`revenuecat_${response.status}`);
  }
}

async function ensureRevenueCatSubscriber(appUserId: string) {
  await revenueCatFetch(`/subscribers/${encodeURIComponent(appUserId)}`);
}

async function grantRevenueCatEntitlement({
  appUserId,
  entitlementId,
  expiresAtMs,
}: {
  appUserId: string;
  entitlementId: string;
  expiresAtMs: number;
}) {
  await revenueCatFetch(
    `/subscribers/${encodeURIComponent(appUserId)}/entitlements/${encodeURIComponent(entitlementId)}/promotional`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_time_ms: Date.now(),
        end_time_ms: expiresAtMs,
      }),
    }
  );
}

async function recordGrant({
  userId,
  campaignId,
  result,
}: {
  userId: string;
  campaignId: string;
  result: AppAccessResult;
}) {
  const admin = getSupabaseServer();
  await admin.from("portal_app_grants").insert({
    user_id: userId,
    campaign_id: campaignId,
    status: result.status,
    mode: result.mode,
    reason: result.status === "pending" ? result.reason : null,
  });
}

export async function grantAppAccess({
  userId,
  campaignId,
  expiresAt,
}: {
  userId: string;
  campaignId: string;
  expiresAt: Date | null;
}) {
  const mode = classifyAppAccessMode();
  let result: AppAccessResult;

  if (mode === "practice") {
    result = { status: "granted", mode: "practice" };
  } else if (mode === "unavailable") {
    result = { status: "pending", mode: "unavailable", reason: "missing_rc_keys" };
  } else {
    try {
      const entitlementId = process.env.RC_ENTITLEMENT_ID;
      if (!entitlementId) throw new Error("missing_rc_entitlement");
      const expiresAtMs =
        expiresAt?.getTime() ?? Date.now() + 365 * 24 * 60 * 60 * 1000;
      await ensureRevenueCatSubscriber(userId);
      await grantRevenueCatEntitlement({
        appUserId: userId,
        entitlementId,
        expiresAtMs,
      });
      result = { status: "granted", mode: "live" };
    } catch {
      result = { status: "pending", mode: "live", reason: "revenuecat_failed" };
    }
  }

  try {
    await recordGrant({ userId, campaignId, result });
  } catch {
    // Grant recording is additive. A missing practice table must not block activation.
  }

  return result;
}
