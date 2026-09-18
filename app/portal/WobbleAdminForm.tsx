"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import type { WobbleOrganisation } from "@/lib/portal/wobbleAdmin";
import { programmePath } from "@/lib/portal/paths";
import {
  DEFAULT_DURATION_WEEKS,
  DURATION_WEEK_OPTIONS,
} from "@/lib/portal/programmeDuration";

const ERRORS: Record<string, string> = {
  invalid_org_name: "Enter the organisation name.",
  invalid_programme_name: "Enter the programme name.",
  invalid_seat_limit: "Enter how many places this programme has.",
  invalid_tier: "Choose Base or Premium.",
  invalid_programme_duration: "Programme duration must be between 12 and 52 weeks.",
  invalid_access_duration: "User access must be between 12 and 52 weeks.",
  invalid_email: "Enter a valid email address.",
  emails_do_not_match: "The two email addresses must match.",
  invite_customer_email: "Invite the customer administrator, not your Wobble login.",
  already_member: "That person already has access to this organisation.",
  org_exists: "An organisation with that name already exists.",
  unknown_org: "That organisation was not found.",
  forbidden_role: "Only Wobble administrators can create organisations.",
};

const fieldClass =
  "mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm outline-none ring-[#A6D5CE] focus:ring-2";

function WeeksSelect({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <select
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
      >
        {DURATION_WEEK_OPTIONS.map((weeks) => (
          <option key={weeks} value={String(weeks)}>
            {weeks === DEFAULT_DURATION_WEEKS
              ? "52 weeks (1 year)"
              : `${weeks} weeks`}
          </option>
        ))}
      </select>
      <span className="mt-1 block text-xs text-[#25303B]/70">{hint}</span>
    </label>
  );
}

export default function WobbleAdminForm({
  initialOrganisations,
  memberOrgIds,
}: {
  initialOrganisations: WobbleOrganisation[];
  memberOrgIds: string[];
}) {
  const router = useRouter();
  const [organisations, setOrganisations] = useState(initialOrganisations);
  const [orgName, setOrgName] = useState("");
  const [programmeName, setProgrammeName] = useState("");
  const [seatLimit, setSeatLimit] = useState("50");
  const [dashboardTier, setDashboardTier] = useState<"base" | "premium">("premium");
  const [programmeWeeks, setProgrammeWeeks] = useState(String(DEFAULT_DURATION_WEEKS));
  const [accessWeeks, setAccessWeeks] = useState(String(DEFAULT_DURATION_WEEKS));
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [renewOrgId, setRenewOrgId] = useState(organisations[0]?.org_id ?? "");
  const [renewName, setRenewName] = useState("");
  const [renewSeats, setRenewSeats] = useState("50");
  const [renewTier, setRenewTier] = useState<"base" | "premium">("premium");
  const [renewProgrammeWeeks, setRenewProgrammeWeeks] = useState(
    String(DEFAULT_DURATION_WEEKS)
  );
  const [renewAccessWeeks, setRenewAccessWeeks] = useState(
    String(DEFAULT_DURATION_WEEKS)
  );
  const [renewing, setRenewing] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/portal/admin/organisations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_name: orgName,
          programme_name: programmeName,
          seat_limit: Number(seatLimit),
          dashboard_tier: dashboardTier,
          programme_weeks: Number(programmeWeeks),
          access_weeks: Number(accessWeeks),
          email,
          confirm_email: confirmEmail,
        }),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        reason?: string;
        message?: string;
        org_id?: string;
        campaign_id?: string;
        organisations?: WobbleOrganisation[];
      };
      if (!response.ok || !body.ok) {
        setError(ERRORS[body.reason ?? ""] ?? "We could not create that organisation.");
        return;
      }
      if (body.org_id && body.campaign_id) {
        router.push(programmePath(body.org_id, body.campaign_id));
        return;
      }
      setOrganisations(body.organisations ?? organisations);
      setMessage(body.message ?? "Organisation created.");
    } catch {
      setError("We could not create that organisation.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddProgramme(event: React.FormEvent) {
    event.preventDefault();
    setRenewing(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/portal/admin/programmes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: renewOrgId,
          programme_name: renewName,
          seat_limit: Number(renewSeats),
          dashboard_tier: renewTier,
          programme_weeks: Number(renewProgrammeWeeks),
          access_weeks: Number(renewAccessWeeks),
        }),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        reason?: string;
        message?: string;
        org_id?: string;
        campaign_id?: string;
        organisations?: WobbleOrganisation[];
      };
      if (!response.ok || !body.ok) {
        setError(ERRORS[body.reason ?? ""] ?? "We could not add that programme.");
        return;
      }
      setOrganisations(body.organisations ?? organisations);
      setRenewName("");
      setRenewSeats("50");
      setRenewProgrammeWeeks(String(DEFAULT_DURATION_WEEKS));
      setRenewAccessWeeks(String(DEFAULT_DURATION_WEEKS));
      setMessage(body.message ?? "Programme added.");
      if (body.org_id && body.campaign_id) {
        router.push(programmePath(body.org_id, body.campaign_id));
      }
    } catch {
      setError("We could not add that programme.");
    } finally {
      setRenewing(false);
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-xl border border-[#E58B66]/40 bg-[#E58B66]/10 p-4 text-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-black/10 bg-white/70 p-4 text-sm">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#25303B]/70">
          New organisation
        </h2>
        <label className="block">
          <span className="text-sm font-semibold">Organisation name</span>
          <input
            required
            value={orgName}
            onChange={(event) => setOrgName(event.target.value)}
            className={fieldClass}
            placeholder="Example Integrated Care"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">First programme</span>
          <input
            required
            value={programmeName}
            onChange={(event) => setProgrammeName(event.target.value)}
            className={fieldClass}
            placeholder="Falls Prevention 2026"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Places</span>
            <input
              required
              type="number"
              min={1}
              max={10000}
              value={seatLimit}
              onChange={(event) => setSeatLimit(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Dashboard</span>
            <select
              value={dashboardTier}
              onChange={(event) =>
                setDashboardTier(event.target.value as "base" | "premium")
              }
              className={fieldClass}
            >
              <option value="premium">Premium (named participants)</option>
              <option value="base">Base</option>
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <WeeksSelect
            label="Programme duration"
            hint="How long this programme stays live."
            value={programmeWeeks}
            onChange={setProgrammeWeeks}
          />
          <WeeksSelect
            label="User access"
            hint="How long each person can use the app after they activate."
            value={accessWeeks}
            onChange={setAccessWeeks}
          />
        </div>
        <label className="block">
          <span className="text-sm font-semibold">First administrator email</span>
          <input
            required
            type="email"
            autoComplete="off"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={fieldClass}
            placeholder="you@organisation.nhs.uk"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Confirm email address</span>
          <input
            required
            type="email"
            autoComplete="off"
            value={confirmEmail}
            onChange={(event) => setConfirmEmail(event.target.value)}
            className={fieldClass}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-[#25303B] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create organisation"}
        </button>
      </form>

      {organisations.length > 0 ? (
        <form onSubmit={handleAddProgramme} className="space-y-5 border-t border-black/10 pt-8">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#25303B]/70">
            Add a programme
          </h2>
          <p className="text-sm text-[#25303B]/80">
            Use this when an organisation renews or starts a second programme.
            Inside the portal, switch programmes from the sidebar menu.
          </p>
          <label className="block">
            <span className="text-sm font-semibold">Organisation</span>
            <select
              required
              value={renewOrgId}
              onChange={(event) => setRenewOrgId(event.target.value)}
              className={fieldClass}
            >
              {organisations.map((org) => (
                <option key={org.org_id} value={org.org_id}>
                  {org.org_name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Programme name</span>
            <input
              required
              value={renewName}
              onChange={(event) => setRenewName(event.target.value)}
              className={fieldClass}
              placeholder="Falls Prevention 2027"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold">Places</span>
              <input
                required
                type="number"
                min={1}
                max={10000}
                value={renewSeats}
                onChange={(event) => setRenewSeats(event.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Dashboard</span>
              <select
                value={renewTier}
                onChange={(event) =>
                  setRenewTier(event.target.value as "base" | "premium")
                }
                className={fieldClass}
              >
                <option value="premium">Premium (named participants)</option>
                <option value="base">Base</option>
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <WeeksSelect
              label="Programme duration"
              hint="How long this programme stays live."
              value={renewProgrammeWeeks}
              onChange={setRenewProgrammeWeeks}
            />
            <WeeksSelect
              label="User access"
              hint="How long each person can use the app after they activate."
              value={renewAccessWeeks}
              onChange={setRenewAccessWeeks}
            />
          </div>
          <button
            type="submit"
            disabled={renewing || !renewOrgId}
            className="w-full rounded-xl bg-[#25303B] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {renewing ? "Adding…" : "Add programme"}
          </button>
        </form>
      ) : null}

      <div>
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#25303B]/70">
          Organisations
        </h2>
        {organisations.length === 0 ? (
          <p className="mt-3 text-sm text-[#25303B]/80">No organisations yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {organisations.map((org) => {
              const latest = org.programmes[0];
              const canOpen =
                memberOrgIds.includes(org.org_id) && Boolean(latest);
              return (
                <li key={org.org_id}>
                  {canOpen && latest ? (
                    <Link
                      href={programmePath(org.org_id, latest.campaign_id)}
                      className="block rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm hover:bg-white"
                    >
                      <div className="font-bold">{org.org_name}</div>
                      <div className="mt-1 text-[#25303B]/70">
                        {org.programmes.map((item) => item.service_name).join(" · ")}
                        {org.admin_emails.length > 0
                          ? ` · ${org.admin_emails.join(", ")}`
                          : " · No customer administrator yet"}
                      </div>
                      <div className="mt-2 text-xs font-semibold">Open dashboard</div>
                    </Link>
                  ) : (
                    <div className="rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm">
                      <div className="font-bold">{org.org_name}</div>
                      <div className="mt-1 text-[#25303B]/70">
                        {org.programmes.map((item) => item.service_name).join(" · ") ||
                          "No programme yet"}
                        {org.admin_emails.length > 0
                          ? ` · ${org.admin_emails.join(", ")}`
                          : " · No customer administrator yet"}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
