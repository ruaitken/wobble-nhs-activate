"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ProgrammeView } from "@/lib/portal/programmeStatus";
import { programmePath, tabFromPath } from "@/lib/portal/paths";

export default function ProgrammeSwitcher({
  orgId,
  programmes,
  selectedId,
}: {
  orgId: string;
  programmes: ProgrammeView[];
  selectedId: string;
}) {
  const router = useRouter();
  const tab = tabFromPath(usePathname());

  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-[#25303B]/60">
        Programme
      </span>
      <select
        className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
        value={selectedId}
        onChange={(event) => {
          const nextId = event.target.value;
          const next = programmes.find((programme) => programme.campaign_id === nextId);
          const nextTab =
            tab === "participants" && next && !next.show_participants ? "overview" : tab;
          router.push(programmePath(orgId, nextId, nextTab));
        }}
      >
        {programmes.map((programme) => (
          <option key={programme.campaign_id} value={programme.campaign_id}>
            {programme.label}
            {programme.is_current ? "" : " (historical)"}
          </option>
        ))}
      </select>
    </label>
  );
}
