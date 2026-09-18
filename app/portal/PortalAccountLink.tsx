"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
          ? "rounded-lg bg-[#25303B] px-3 py-2 text-left text-sm font-semibold text-white"
          : "rounded-lg border border-black/10 bg-white px-3 py-2 text-left text-sm font-semibold hover:bg-white/80"
      }
    >
      Account
    </Link>
  );
}
