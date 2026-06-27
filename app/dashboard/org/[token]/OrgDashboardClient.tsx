"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Dashboard, type Stats } from "../../[token]/DashboardClient";

type ServiceEntry = { campaign_id: string; stats: Stats };

type OrgStats =
  | { found: false }
  | {
      found: true;
      org_name: string;
      combined: Stats;
      services: ServiceEntry[];
    };

type ApiResponse = { ok: true; org: OrgStats } | { ok: false; reason: string };

const COMBINED = "__combined__";

export default function OrgDashboardClient({
  token,
  fontClassName,
}: {
  token: string;
  fontClassName: string;
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [scope, setScope] = useState<string>(COMBINED);

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch(
          `/api/dashboard/org?token=${encodeURIComponent(token)}`
        );
        const json = (await res.json()) as ApiResponse;
        setData(json);
      } catch {
        setData({ ok: false, reason: "network_error" });
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [token]);

  const org = data?.ok && data.org.found ? data.org : null;

  const selectedStats: Stats | null = useMemo(() => {
    if (!org) return null;
    if (scope === COMBINED) return org.combined;
    return org.services.find((s) => s.campaign_id === scope)?.stats ?? org.combined;
  }, [org, scope]);

  return (
    <main className={[fontClassName, "min-h-screen bg-[#A6D5CE] text-[#25303B]"].join(" ")}>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-7 flex items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F9F5EF]/70 px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-black/5">
              <span className="h-2 w-2 rounded-full bg-[#E58B66]" />
              Wobble impact dashboard
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {org ? org.org_name : "Impact dashboard"}
            </h1>
          </div>
          <div className="inline-flex rounded-2xl bg-white/30 p-2 ring-1 ring-black/10 backdrop-blur-sm">
            <Image
              src="/wobble-logo.svg"
              alt="Wobble"
              width={84}
              height={84}
              priority
              className="rounded-xl opacity-85"
            />
          </div>
        </header>

        {loading && (
          <div className="rounded-2xl border border-black/10 bg-white/40 p-6">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 animate-pulse rounded-full bg-[#25303B]/50" />
              <div className="text-sm font-semibold">Loading your data…</div>
            </div>
          </div>
        )}

        {!loading && !org && (
          <div className="rounded-2xl border border-[#E58B66]/40 bg-[#E58B66]/10 p-6">
            <div className="text-sm font-bold">This dashboard link can’t be opened</div>
            <div className="mt-1 text-sm text-[#25303B]/80">
              Please check the link is correct, or contact your Wobble team.
            </div>
          </div>
        )}

        {!loading && org && (
          <div className="space-y-6">
            {/* Scope toggle */}
            <div className="flex flex-wrap gap-2 rounded-2xl bg-[#F9F5EF] p-2 shadow-sm ring-1 ring-black/5">
              <ToggleButton
                active={scope === COMBINED}
                onClick={() => setScope(COMBINED)}
                label="All services"
              />
              {org.services.map((s) => (
                <ToggleButton
                  key={s.campaign_id}
                  active={scope === s.campaign_id}
                  onClick={() => setScope(s.campaign_id)}
                  label={
                    (s.stats.found && s.stats.service_name) || "Service"
                  }
                />
              ))}
            </div>

            {/* Selected scope body */}
            <ScopeBody stats={selectedStats} />
          </div>
        )}

        <footer className="mt-6 text-xs text-[#25303B]/70">
          Figures are aggregated and anonymised. Updated automatically.
        </footer>
      </div>
    </main>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-xl px-4 py-2 text-sm font-extrabold transition",
        active
          ? "bg-[#25303B] text-[#F9F5EF] shadow-sm"
          : "bg-white/50 text-[#25303B] hover:bg-white/80",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function ScopeBody({ stats }: { stats: Stats | null }) {
  if (!stats || !stats.found) {
    return (
      <div className="rounded-2xl border border-[#E58B66]/40 bg-[#E58B66]/10 p-6">
        <div className="text-sm font-bold">No data for this view</div>
      </div>
    );
  }
  if (stats.suppressed) {
    return (
      <div className="rounded-2xl border border-black/10 bg-[#F9F5EF] p-6 shadow-xl ring-1 ring-black/5">
        <div className="text-sm font-extrabold">Not enough members yet</div>
        <div className="mt-1 text-sm text-[#25303B]/80">
          To protect individual privacy, we only show statistics once at least 5
          members have enrolled. Currently enrolled: {stats.enrolled}.
        </div>
      </div>
    );
  }
  return <Dashboard stats={stats} />;
}

