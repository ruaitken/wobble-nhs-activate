"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ProgrammeView } from "@/lib/portal/programmeStatus";
import { OVERALL_PROGRAMME_ID, programmePath, tabFromPath } from "@/lib/portal/paths";

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
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(nextId: string) {
    setOpen(false);
    if (nextId === OVERALL_PROGRAMME_ID) {
      const nextTab =
        tab === "licences" ||
        (tab === "participants" &&
          !programmes.some((programme) => programme.show_participants))
          ? "overview"
          : tab;
      router.push(programmePath(orgId, nextId, nextTab));
      return;
    }
    const next = programmes.find((programme) => programme.campaign_id === nextId);
    const nextTab =
      tab === "participants" && next && !next.show_participants ? "overview" : tab;
    router.push(programmePath(orgId, nextId, nextTab));
  }

  const selected = programmes.find((programme) => programme.campaign_id === selectedId);
  const selectedLabel =
    selectedId === OVERALL_PROGRAMME_ID
      ? "Overall"
      : selected
        ? `${selected.label}${selected.is_current ? "" : " (historical)"}`
        : "Overall";

  return (
    <div className="relative" ref={menuRef}>
      <span className="text-xs font-semibold uppercase tracking-wide text-[#25303B]/60">
        Programme
      </span>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        className="mt-2 flex w-full items-start justify-between gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-left text-sm font-extrabold"
      >
        <span className="min-w-0 flex-1 whitespace-normal break-words">{selectedLabel}</span>
        <span aria-hidden="true" className="text-xs text-[#25303B]/50">
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open ? (
        <div
          role="listbox"
          aria-label="Programme"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg"
        >
          <MenuHeading>All programmes</MenuHeading>
          <MenuChoice
            selected={selectedId === OVERALL_PROGRAMME_ID}
            onChoose={() => choose(OVERALL_PROGRAMME_ID)}
          >
            Overall
          </MenuChoice>
          <MenuHeading>Each programme</MenuHeading>
          {programmes.map((programme) => (
            <MenuChoice
              key={programme.campaign_id}
              selected={programme.campaign_id === selectedId}
              onChoose={() => choose(programme.campaign_id)}
            >
              {programme.label}
              {programme.is_current ? "" : " (historical)"}
            </MenuChoice>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MenuHeading({ children }: { children: string }) {
  return (
    <div className="px-3 pb-1 pt-3 text-xs font-extrabold uppercase tracking-wide text-[#25303B]/45">
      {children}
    </div>
  );
}

function MenuChoice({
  selected,
  onChoose,
  children,
}: {
  selected: boolean;
  onChoose: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onChoose}
      className={[
        "block w-full whitespace-normal break-words border-b border-black/10 px-3 py-2 text-left text-sm font-extrabold last:border-b-0",
        selected ? "bg-[#A6D5CE]/50" : "hover:bg-[#F9F5EF]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
