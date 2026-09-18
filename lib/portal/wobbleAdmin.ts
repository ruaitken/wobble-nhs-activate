import { getSupabaseServer } from "@/lib/supabaseServer";
import { AccountError, inviteAccountMember } from "@/lib/portal/account";
import { emailsMatch, normalizeEmail } from "@/lib/portal/licenceMath";
import { nextUniqueId, slugOrgId } from "@/lib/portal/orgIds";
import { addWeeks, isDurationWeeks, weeksToDays } from "@/lib/portal/programmeDuration";
import type { ProgrammeTier } from "@/lib/portal/programmeStatus";

export class WobbleAdminError extends Error {
  constructor(
    public status: number,
    public reason: string
  ) {
    super(reason);
  }
}

export type WobbleProgramme = {
  campaign_id: string;
  service_name: string;
  starts_at: string | null;
};

export type WobbleOrganisation = {
  org_id: string;
  org_name: string;
  created_at: string;
  programmes: WobbleProgramme[];
  admin_emails: string[];
};

function isTier(value: string): value is ProgrammeTier {
  return value === "base" || value === "premium";
}

export async function listWobbleOrganisations(): Promise<WobbleOrganisation[]> {
  const admin = getSupabaseServer();
  const { data: orgs, error: orgError } = await admin
    .from("dashboard_orgs")
    .select("org_id, org_name, created_at")
    .order("created_at", { ascending: false });
  if (orgError) throw orgError;

  const { data: campaigns, error: campaignError } = await admin
    .from("nhs_campaigns")
    .select("id, org_id, service_name, starts_at")
    .not("org_id", "is", null);
  if (campaignError) throw campaignError;

  const { data: members, error: memberError } = await admin
    .from("portal_org_members")
    .select("org_id, user_id, role")
    .eq("role", "customer_admin");
  if (memberError) throw memberError;

  const { data: users, error: userError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (userError) throw userError;

  const emails = new Map(
    (users.users ?? []).map((user) => [user.id, user.email?.toLowerCase() ?? ""])
  );

  const programmesByOrg = new Map<string, WobbleProgramme[]>();
  for (const campaign of campaigns ?? []) {
    if (!campaign.org_id) continue;
    const list = programmesByOrg.get(campaign.org_id) ?? [];
    list.push({
      campaign_id: campaign.id,
      service_name: campaign.service_name,
      starts_at: campaign.starts_at,
    });
    programmesByOrg.set(campaign.org_id, list);
  }
  for (const list of programmesByOrg.values()) {
    list.sort((a, b) => Date.parse(b.starts_at ?? "") - Date.parse(a.starts_at ?? ""));
  }

  const adminsByOrg = new Map<string, string[]>();
  for (const member of members ?? []) {
    const email = emails.get(member.user_id);
    if (!email) continue;
    const list = adminsByOrg.get(member.org_id) ?? [];
    list.push(email);
    adminsByOrg.set(member.org_id, list);
  }

  return (orgs ?? []).map((org) => ({
    org_id: org.org_id,
    org_name: org.org_name,
    created_at: org.created_at,
    programmes: programmesByOrg.get(org.org_id) ?? [],
    admin_emails: adminsByOrg.get(org.org_id) ?? [],
  }));
}

function programmeFields({
  programmeName,
  seatLimit,
  dashboardTier,
  programmeWeeks,
  accessWeeks,
}: {
  programmeName: string;
  seatLimit: number;
  dashboardTier: string;
  programmeWeeks: number;
  accessWeeks: number;
}) {
  const programme = programmeName.trim().replace(/\s+/g, " ");
  if (programme.length < 2) throw new WobbleAdminError(400, "invalid_programme_name");
  if (!Number.isInteger(seatLimit) || seatLimit < 1 || seatLimit > 10000) {
    throw new WobbleAdminError(400, "invalid_seat_limit");
  }
  if (!isTier(dashboardTier)) throw new WobbleAdminError(400, "invalid_tier");
  if (!isDurationWeeks(programmeWeeks)) {
    throw new WobbleAdminError(400, "invalid_programme_duration");
  }
  if (!isDurationWeeks(accessWeeks)) {
    throw new WobbleAdminError(400, "invalid_access_duration");
  }
  return { programme, dashboardTier, programmeWeeks, accessWeeks };
}

async function insertProgramme({
  orgId,
  trustName,
  programmeName,
  seatLimit,
  dashboardTier,
  programmeWeeks,
  accessWeeks,
}: {
  orgId: string;
  trustName: string;
  programmeName: string;
  seatLimit: number;
  dashboardTier: ProgrammeTier;
  programmeWeeks: number;
  accessWeeks: number;
}) {
  const admin = getSupabaseServer();
  const { data: existingCampaigns, error: existingCampaignError } = await admin
    .from("nhs_campaigns")
    .select("id");
  if (existingCampaignError) throw existingCampaignError;

  const campaignId = nextUniqueId(
    `${orgId}_${slugOrgId(programmeName)}`,
    (existingCampaigns ?? []).map((row) => row.id)
  );
  const startsAt = new Date();
  const endsAt = addWeeks(startsAt, programmeWeeks);

  const { error: campaignError } = await admin.from("nhs_campaigns").insert({
    id: campaignId,
    trust_name: trustName,
    service_name: programmeName,
    seat_limit: seatLimit,
    seats_used: 0,
    starts_at: startsAt.toISOString(),
    is_active: true,
    claim_duration_days: weeksToDays(accessWeeks),
    claim_deadline_at: endsAt.toISOString(),
    campaign_type: "nhs",
    org_id: orgId,
  });
  if (campaignError) throw campaignError;

  const { error: entitlementError } = await admin
    .from("portal_programme_entitlements")
    .insert({
      campaign_id: campaignId,
      dashboard_tier: dashboardTier,
      subscription_status: "active",
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
    });
  if (entitlementError) throw entitlementError;

  return campaignId;
}

export async function createWobbleOrganisation({
  orgName,
  programmeName,
  seatLimit,
  dashboardTier,
  programmeWeeks,
  accessWeeks,
  adminEmail,
  confirmEmail,
  createdBy,
  createdByEmail,
  request,
}: {
  orgName: string;
  programmeName: string;
  seatLimit: number;
  dashboardTier: string;
  programmeWeeks: number;
  accessWeeks: number;
  adminEmail: string;
  confirmEmail: string;
  createdBy: string;
  createdByEmail: string | null;
  request: Request;
}) {
  const name = orgName.trim().replace(/\s+/g, " ");
  if (name.length < 2) throw new WobbleAdminError(400, "invalid_org_name");
  const fields = programmeFields({
    programmeName,
    seatLimit,
    dashboardTier,
    programmeWeeks,
    accessWeeks,
  });

  const invitedEmail = normalizeEmail(adminEmail);
  if (!invitedEmail.includes("@")) throw new WobbleAdminError(400, "invalid_email");
  if (!emailsMatch(adminEmail, confirmEmail)) {
    throw new WobbleAdminError(400, "emails_do_not_match");
  }
  if (createdByEmail && normalizeEmail(createdByEmail) === invitedEmail) {
    throw new WobbleAdminError(400, "invite_customer_email");
  }

  const admin = getSupabaseServer();
  const { data: existingOrgs, error: existingOrgError } = await admin
    .from("dashboard_orgs")
    .select("org_id");
  if (existingOrgError) throw existingOrgError;

  const orgId = nextUniqueId(
    slugOrgId(name),
    (existingOrgs ?? []).map((row) => row.org_id)
  );

  const { error: orgError } = await admin.from("dashboard_orgs").insert({
    org_id: orgId,
    org_name: name,
    is_active: true,
  });
  if (orgError) {
    if (orgError.code === "23505") throw new WobbleAdminError(409, "org_exists");
    throw orgError;
  }

  const campaignId = await insertProgramme({
    orgId,
    trustName: name,
    programmeName: fields.programme,
    seatLimit,
    dashboardTier: fields.dashboardTier,
    programmeWeeks: fields.programmeWeeks,
    accessWeeks: fields.accessWeeks,
  });

  const { error: memberError } = await admin.from("portal_org_members").insert({
    org_id: orgId,
    user_id: createdBy,
    role: "wobble_admin",
    created_by: createdBy,
  });
  if (memberError && memberError.code !== "23505") throw memberError;

  let emailSent = false;
  try {
    const invited = await inviteAccountMember({
      orgId,
      email: adminEmail,
      confirmEmail,
      role: "customer_admin",
      invitedBy: createdBy,
      request,
    });
    emailSent = invited.email_sent;
  } catch (error) {
    if (error instanceof AccountError) {
      throw new WobbleAdminError(error.status, error.reason);
    }
    throw error;
  }

  await admin.from("portal_audit_events").insert({
    actor_user_id: createdBy,
    org_id: orgId,
    campaign_id: campaignId,
    action: "portal.org_created",
    details: {
      org_name: name,
      programme_name: fields.programme,
      dashboard_tier: fields.dashboardTier,
      seat_limit: seatLimit,
      programme_weeks: fields.programmeWeeks,
      access_weeks: fields.accessWeeks,
      admin_email_sent: emailSent,
    },
  });

  return {
    org_id: orgId,
    org_name: name,
    campaign_id: campaignId,
    email_sent: emailSent,
    organisations: await listWobbleOrganisations(),
  };
}

export async function addWobbleProgramme({
  orgId,
  programmeName,
  seatLimit,
  dashboardTier,
  programmeWeeks,
  accessWeeks,
  createdBy,
}: {
  orgId: string;
  programmeName: string;
  seatLimit: number;
  dashboardTier: string;
  programmeWeeks: number;
  accessWeeks: number;
  createdBy: string;
}) {
  const fields = programmeFields({
    programmeName,
    seatLimit,
    dashboardTier,
    programmeWeeks,
    accessWeeks,
  });
  const admin = getSupabaseServer();
  const { data: org, error: orgError } = await admin
    .from("dashboard_orgs")
    .select("org_id, org_name")
    .eq("org_id", orgId)
    .maybeSingle();
  if (orgError) throw orgError;
  if (!org) throw new WobbleAdminError(404, "unknown_org");

  const campaignId = await insertProgramme({
    orgId: org.org_id,
    trustName: org.org_name,
    programmeName: fields.programme,
    seatLimit,
    dashboardTier: fields.dashboardTier,
    programmeWeeks: fields.programmeWeeks,
    accessWeeks: fields.accessWeeks,
  });

  const { data: existingMember, error: memberLookupError } = await admin
    .from("portal_org_members")
    .select("user_id")
    .eq("org_id", org.org_id)
    .eq("user_id", createdBy)
    .maybeSingle();
  if (memberLookupError) throw memberLookupError;
  if (!existingMember) {
    const { error: memberError } = await admin.from("portal_org_members").insert({
      org_id: org.org_id,
      user_id: createdBy,
      role: "wobble_admin",
      created_by: createdBy,
    });
    if (memberError && memberError.code !== "23505") throw memberError;
  }

  await admin.from("portal_audit_events").insert({
    actor_user_id: createdBy,
    org_id: org.org_id,
    campaign_id: campaignId,
    action: "portal.programme_added",
    details: {
      programme_name: fields.programme,
      dashboard_tier: fields.dashboardTier,
      seat_limit: seatLimit,
      programme_weeks: fields.programmeWeeks,
      access_weeks: fields.accessWeeks,
    },
  });

  return {
    org_id: org.org_id,
    campaign_id: campaignId,
    organisations: await listWobbleOrganisations(),
  };
}
