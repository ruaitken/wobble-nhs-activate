import SignOutButton from "@/app/portal/SignOutButton";
import ProgrammeSwitcher from "@/app/portal/ProgrammeSwitcher";
import type { PortalContext } from "@/lib/portal/context";
import PortalAccountLink from "@/app/portal/PortalAccountLink";
import PortalMainHeader from "@/app/portal/PortalMainHeader";
import PortalTabs from "@/app/portal/PortalTabs";
import Link from "next/link";
import { PORTAL_ADMIN_PATH } from "@/lib/portal/paths";
import { hasWobbleAdminAccess } from "@/lib/portal/roles";

export default function PortalShell({
  context,
  children,
}: {
  context: PortalContext;
  children: React.ReactNode;
}) {
  const { session, membership, programmes, selected } = context;
  const tabs = [
    { id: "overview" as const, label: "Overview" },
    ...(selected.show_participants
      ? [{ id: "participants" as const, label: "Participants" }]
      : []),
    { id: "licences" as const, label: "Licences" },
  ];

  return (
    <main className="min-h-screen bg-[#A6D5CE] text-[#25303B]">
      <div className="flex min-h-screen">
        <aside className="flex w-64 shrink-0 flex-col border-r border-black/10 bg-[#F9F5EF] px-4 py-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[#25303B]/50">
              Customer portal
            </div>
            <div className="text-sm font-extrabold leading-tight">
              {membership.org_name}
            </div>
          </div>

          <div className="mt-6">
            <ProgrammeSwitcher
              orgId={membership.org_id}
              programmes={programmes}
              selectedId={selected.campaign_id}
            />
          </div>

          <PortalTabs
            orgId={membership.org_id}
            campaignId={selected.campaign_id}
            tabs={tabs}
          />

          <div className="mt-auto border-t border-black/10 pt-4 text-xs text-[#25303B]/70">
            <div className="truncate">{session.email ?? "Signed in"}</div>
            <div className="mt-1 capitalize">
              {membership.role === "customer_admin"
                ? "Administrator"
                : membership.role === "wobble_admin"
                  ? "Wobble"
                  : "Viewer"}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {hasWobbleAdminAccess(session.memberships) ? (
                <Link
                  href={PORTAL_ADMIN_PATH}
                  className="rounded-lg border border-black/10 bg-white px-3 py-2 text-left text-sm font-semibold hover:bg-white/80"
                >
                  Wobble desk
                </Link>
              ) : null}
              <PortalAccountLink
                orgId={membership.org_id}
                campaignId={selected.campaign_id}
              />
              <SignOutButton />
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-4 py-10 sm:px-6 sm:py-14">
          <div className="mx-auto max-w-5xl">
            <PortalMainHeader selected={selected} />
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
