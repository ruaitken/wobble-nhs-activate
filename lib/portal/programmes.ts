import { getSupabaseServer } from "@/lib/supabaseServer";
import {
  defaultCampaignId,
  toProgrammeView,
  type ProgrammeRecord,
  type ProgrammeTier,
  type ProgrammeView,
  type SubscriptionStatus,
} from "@/lib/portal/programmeStatus";

function isTier(value: string): value is ProgrammeTier {
  return value === "base" || value === "premium";
}

function isStatus(value: string): value is SubscriptionStatus {
  return (
    value === "trial" ||
    value === "active" ||
    value === "suspended" ||
    value === "cancelled"
  );
}

export async function getOrgProgrammes(orgId: string): Promise<ProgrammeView[]> {
  const admin = getSupabaseServer();
  const { data: campaigns, error: campaignError } = await admin
    .from("nhs_campaigns")
    .select("id, org_id, service_name, starts_at, is_active")
    .eq("org_id", orgId);

  if (campaignError) throw campaignError;
  if (!campaigns?.length) return [];

  const campaignIds = campaigns.map((campaign) => campaign.id);
  const { data: entitlements, error: entitlementError } = await admin
    .from("portal_programme_entitlements")
    .select("campaign_id, dashboard_tier, subscription_status, starts_at, ends_at")
    .in("campaign_id", campaignIds);

  if (entitlementError) throw entitlementError;

  const entitlementByCampaign = new Map(
    (entitlements ?? []).map((row) => [row.campaign_id, row])
  );

  return campaigns.flatMap((campaign) => {
    const entitlement = entitlementByCampaign.get(campaign.id);
    if (!entitlement) return [];
    if (!isTier(entitlement.dashboard_tier)) return [];
    if (!isStatus(entitlement.subscription_status)) return [];
    if (!campaign.org_id) return [];

    const record: ProgrammeRecord = {
      campaign_id: campaign.id,
      org_id: campaign.org_id,
      service_name: campaign.service_name ?? campaign.id,
      starts_at: entitlement.starts_at ?? campaign.starts_at,
      ends_at: entitlement.ends_at,
      is_active: campaign.is_active,
      dashboard_tier: entitlement.dashboard_tier,
      subscription_status: entitlement.subscription_status,
    };
    return [toProgrammeView(record)];
  }).sort((a, b) => {
    if (a.is_current !== b.is_current) return a.is_current ? -1 : 1;
    const aStart = a.starts_at ? Date.parse(a.starts_at) : 0;
    const bStart = b.starts_at ? Date.parse(b.starts_at) : 0;
    return bStart - aStart;
  });
}

export async function getProgrammeForOrg(orgId: string, campaignId: string) {
  const programmes = await getOrgProgrammes(orgId);
  return programmes.find((programme) => programme.campaign_id === campaignId) ?? null;
}

export function pickDefaultCampaignId(programmes: ProgrammeView[]) {
  return defaultCampaignId(programmes);
}
