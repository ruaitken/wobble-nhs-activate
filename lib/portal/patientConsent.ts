import { getSupabaseServer } from "@/lib/supabaseServer";
import { isNamedReportingVisible } from "@/lib/portal/participantVisibility";
import {
  parseConsentChoice,
  setReportingConsent,
} from "@/lib/portal/inviteProfile";
import {
  currentAccess,
  patientProgrammeName,
  sortAccessProgrammes,
  type AccessProgramme,
} from "@/lib/portal/accessProgrammes";

export class PatientConsentError extends Error {
  constructor(
    public status: number,
    public reason: string
  ) {
    super(reason);
  }
}

export type PatientConsentProgramme = {
  campaign_id: string;
  programme_name: string;
  consented: boolean;
};

export type PatientConsentState = {
  campaign_member: boolean;
  show_toggle: boolean;
  consented: boolean | null;
  programmes: PatientConsentProgramme[];
  access_programmes: AccessProgramme[];
  current_access: AccessProgramme | null;
};

export function bearerAccessToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)/i.exec(header);
  return match?.[1] ?? "";
}

export async function userIdFromAccessToken(accessToken: string) {
  if (!accessToken) throw new PatientConsentError(401, "unauthenticated");
  const admin = getSupabaseServer();
  const { data, error } = await admin.auth.getUser(accessToken);
  if (error || !data.user) throw new PatientConsentError(401, "unauthenticated");
  return data.user.id;
}

export async function getPatientReportingConsent(
  userId: string
): Promise<PatientConsentState> {
  const admin = getSupabaseServer();
  const { data: claims, error: claimError } = await admin
    .from("nhs_claims")
    .select("campaign_id, claimed_at, expires_at")
    .eq("user_id", userId);
  if (claimError) throw claimError;

  const campaignIds = [
    ...new Set((claims ?? []).map((row) => row.campaign_id).filter(Boolean)),
  ];
  if (campaignIds.length === 0) {
    return {
      campaign_member: false,
      show_toggle: false,
      consented: null,
      programmes: [],
      access_programmes: [],
      current_access: null,
    };
  }

  const [{ data: campaigns, error: campaignError }, { data: entitlements, error: entitlementError }, { data: consents, error: consentError }] =
    await Promise.all([
      admin
        .from("nhs_campaigns")
        .select("id, service_name, trust_name, org_id")
        .in("id", campaignIds),
      admin
        .from("portal_programme_entitlements")
        .select("campaign_id, dashboard_tier")
        .in("campaign_id", campaignIds),
      admin
        .from("portal_reporting_consents")
        .select("campaign_id, consented, withdrawn_at")
        .eq("user_id", userId)
        .in("campaign_id", campaignIds),
    ]);
  if (campaignError) throw campaignError;
  if (entitlementError) throw entitlementError;
  if (consentError) throw consentError;

  const consentByCampaign = new Map(
    (consents ?? []).map((row) => [
      row.campaign_id,
      {
        consented: Boolean(row.consented),
        withdrawn_at: row.withdrawn_at ?? null,
      },
    ])
  );
  const premiumIds = new Set(
    (entitlements ?? [])
      .filter((row) => row.dashboard_tier === "premium")
      .map((row) => row.campaign_id)
  );

  const programmes = (campaigns ?? []).flatMap((campaign) => {
    const canOffer =
      premiumIds.has(campaign.id) || consentByCampaign.has(campaign.id);
    if (!canOffer) return [];
    return [
      {
        campaign_id: campaign.id,
        programme_name: campaign.service_name ?? campaign.id,
        consented: isNamedReportingVisible(
          consentByCampaign.get(campaign.id) ?? null
        ),
      },
    ];
  });

  const orgIds = [
    ...new Set((campaigns ?? []).map((campaign) => campaign.org_id).filter(Boolean)),
  ];
  const { data: orgs, error: orgError } = orgIds.length
    ? await admin.from("dashboard_orgs").select("org_id, org_name").in("org_id", orgIds)
    : { data: [], error: null };
  if (orgError) throw orgError;

  const orgNames = new Map((orgs ?? []).map((org) => [org.org_id, org.org_name]));
  const campaignById = new Map((campaigns ?? []).map((campaign) => [campaign.id, campaign]));
  const toggleIds = new Set(programmes.map((item) => item.campaign_id));

  const accessProgrammes = sortAccessProgrammes(
    (claims ?? []).flatMap((claim) => {
      const campaign = campaignById.get(claim.campaign_id);
      if (!campaign) return [];
      const named = toggleIds.has(campaign.id);
      return [
        {
          campaign_id: campaign.id,
          programme_name: patientProgrammeName(campaign.service_name, campaign.id),
          org_name:
            (campaign.org_id ? orgNames.get(campaign.org_id) : null) ??
            campaign.trust_name ??
            null,
          access_starts_at: claim.claimed_at ?? null,
          access_ends_at: claim.expires_at ?? null,
          named_reporting: named,
          consented: named
            ? isNamedReportingVisible(consentByCampaign.get(campaign.id) ?? null)
            : null,
        },
      ];
    })
  );

  return {
    campaign_member: true,
    show_toggle: programmes.length > 0,
    consented: programmes.length > 0 ? programmes.some((item) => item.consented) : null,
    programmes,
    access_programmes: accessProgrammes,
    current_access: currentAccess(accessProgrammes),
  };
}

export async function updatePatientReportingConsent({
  userId,
  consented,
  campaignId,
}: {
  userId: string;
  consented: boolean;
  campaignId?: string;
}) {
  const state = await getPatientReportingConsent(userId);
  if (!state.show_toggle) {
    throw new PatientConsentError(403, "not_applicable");
  }

  const targets = campaignId
    ? state.programmes.filter((item) => item.campaign_id === campaignId)
    : state.programmes;
  if (targets.length === 0) {
    throw new PatientConsentError(404, "unknown_programme");
  }

  const admin = getSupabaseServer();
  const { data: campaigns, error: campaignError } = await admin
    .from("nhs_campaigns")
    .select("id, org_id")
    .in(
      "id",
      targets.map((item) => item.campaign_id)
    );
  if (campaignError) throw campaignError;

  const orgByCampaign = new Map(
    (campaigns ?? []).map((row) => [row.id, row.org_id ?? null])
  );

  for (const target of targets) {
    await setReportingConsent({
      userId,
      campaignId: target.campaign_id,
      consented,
    });
    await admin.from("portal_audit_events").insert({
      actor_user_id: userId,
      org_id: orgByCampaign.get(target.campaign_id),
      campaign_id: target.campaign_id,
      action: "portal.consent_updated",
      details: { consented, source: "app" },
    });
  }

  return getPatientReportingConsent(userId);
}

export function parsePatientConsentBody(body: { consented?: unknown; campaign_id?: unknown }) {
  const consented = parseConsentChoice(body.consented);
  if (consented === null) throw new PatientConsentError(400, "consent_required");
  const campaignId =
    typeof body.campaign_id === "string" && body.campaign_id.trim()
      ? body.campaign_id.trim()
      : undefined;
  return { consented, campaignId };
}
