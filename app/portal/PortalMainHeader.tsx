"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { tabFromPath } from "@/lib/portal/paths";
import type { ProgrammeView } from "@/lib/portal/programmeStatus";

export default function PortalMainHeader({ selected }: { selected: ProgrammeView }) {
  const tab = tabFromPath(usePathname());
  const isAccount = tab === "account";

  const title = isAccount ? "Account" : selected.label;
  const subtitle = isAccount
    ? "People who can sign in to this organisation"
    : `${selected.dashboard_tier === "premium" ? "Premium" : "Base"}${
        selected.is_current ? " · current period" : " · historical, read-only"
      }`;

  return (
    <header className="mb-7 flex items-start justify-between gap-6">
      <div>
        {!isAccount && (
          <div className="inline-flex items-center gap-2 rounded-full bg-[#F9F5EF]/70 px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-black/5">
            <span className="h-2 w-2 rounded-full bg-[#E58B66]" />
            Wobble impact dashboard
          </div>
        )}
        <h1
          className={[
            "text-3xl font-extrabold tracking-tight sm:text-4xl",
            isAccount ? "" : "mt-4",
          ].join(" ")}
        >
          {title}
        </h1>
        <p className="mt-2 text-sm text-[#25303B]/80 sm:text-base">{subtitle}</p>
      </div>
      <div className="inline-flex shrink-0 rounded-2xl bg-white/30 p-3 ring-1 ring-black/10 backdrop-blur-sm">
        <Image
          src="/wobble-logo.svg"
          alt="Wobble"
          width={128}
          height={128}
          priority
          className="h-24 w-24 rounded-xl sm:h-32 sm:w-32"
        />
      </div>
    </header>
  );
}
