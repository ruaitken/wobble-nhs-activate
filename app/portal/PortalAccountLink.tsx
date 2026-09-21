"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import PortalLinkPending from "@/app/portal/PortalLinkPending";
import { programmePath, tabFromPath } from "@/lib/portal/paths";

export default function PortalAccountLink({
  orgId,
  campaignId,
}: {
  orgId: string;
  campaignId: string;
}) {
  const isActive = tabFromPath(usePathname()) === "account";

  return (
    <Link
      href={programmePath(orgId, campaignId, "account")}
      className={
        isActive
          ? "flex items-center justify-between gap-2 rounded-lg bg-[#25303B] px-3 py-2 text-left text-sm font-semibold text-white"
          : "flex items-center justify-between gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-left text-sm font-semibold hover:bg-white/80"
      }
    >
      Account
      <PortalLinkPending />
    </Link>
  );
}
