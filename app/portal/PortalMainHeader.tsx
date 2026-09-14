"use client";

import { usePathname } from "next/navigation";
import { tabFromPath } from "@/lib/portal/paths";
import type { ProgrammeView } from "@/lib/portal/programmeStatus";

export default function PortalMainHeader({ selected }: { selected: ProgrammeView }) {
  const tab = tabFromPath(usePathname());

  if (tab === "account") {
    return (
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight">Account</h1>
        <p className="mt-1 text-sm text-[#25303B]/70">
          People who can sign in to this organisation
        </p>
      </header>
    );
  }

  return (
    <header className="mb-5">
      <h1 className="text-2xl font-extrabold tracking-tight">{selected.label}</h1>
      <p className="mt-1 text-sm text-[#25303B]/70">
        {selected.dashboard_tier === "premium" ? "Premium" : "Base"}
        {selected.is_current ? " · current period" : " · historical, read-only"}
      </p>
    </header>
  );
}
