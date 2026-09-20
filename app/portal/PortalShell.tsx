import SignOutButton from "@/app/portal/SignOutButton";
import ProgrammeSwitcher from "@/app/portal/ProgrammeSwitcher";
import type { PortalContext } from "@/lib/portal/context";
import PortalAccountLink from "@/app/portal/PortalAccountLink";
import PortalMainHeader from "@/app/portal/PortalMainHeader";
import PortalTabs from "@/app/portal/PortalTabs";
import Link from "next/link";
import { PORTAL_ADMIN_PATH, programmePath } from "@/lib/portal/paths";
import { canViewOrgOperations, hasWobbleAdminAccess } from "@/lib/portal/roles";
import { mfaPagePath, mfaSatisfied } from "@/lib/portal/mfa";

export default function PortalShell({
  context,
  children,
}: {
  context: PortalContext;
  children: React.ReactNode;
}) {
  const { session, membership, programmes, selected } = context;
  const canOperate = canViewOrgOperations(membership.role);
  const needsAuthenticator = canOperate && !mfaSatisfied(session);
  const tabs = [
    { id: "overview" as const, label: "Overview" },
    ...(canOperate && selected.show_participants
      ? [{ id: "participants" as const, label: "Participants" }]
      : []),
    ...(canOperate ? [{ id: "licences" as const, label: "Licences" }] : []),
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
              {canOperate ? (
                <PortalAccountLink
                  orgId={membership.org_id}
                  campaignId={selected.campaign_id}
                />
              ) : null}
              <SignOutButton />
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-4 py-10 sm:px-6 sm:py-14">
          <div className="mx-auto max-w-5xl">
            <PortalMainHeader selected={selected} />
            {needsAuthenticator ? (
              <div className="mb-6 rounded-xl border border-[#E58B66]/40 bg-[#E58B66]/10 p-4 text-sm">
                Named lists and admin tools need an authenticator app.{" "}
                <Link
                  href={mfaPagePath(programmePath(membership.org_id, selected.campaign_id))}
                  className="font-semibold underline"
                >
                  Set it up now
                </Link>
                .
              </div>
            ) : null}
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
