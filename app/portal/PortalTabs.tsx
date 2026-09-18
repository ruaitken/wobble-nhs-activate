"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { programmePath, tabFromPath, type PortalTab } from "@/lib/portal/paths";

export default function PortalTabs({
  orgId,
  campaignId,
  tabs,
}: {
  orgId: string;
  campaignId: string;
  tabs: { id: PortalTab; label: string }[];
}) {
  const active = tabFromPath(usePathname());

  return (
    <nav className="mt-6 flex flex-col gap-1">
      {tabs.map((item) => {
        const isActive = item.id === active;
        return (
          <Link
            key={item.id}
            href={programmePath(orgId, campaignId, item.id)}
            className={
              isActive
                ? "rounded-lg bg-[#25303B] px-3 py-2 text-sm font-semibold text-white"
                : "rounded-lg px-3 py-2 text-sm font-semibold text-[#25303B] hover:bg-white/70"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
