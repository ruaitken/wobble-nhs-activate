"use client";

import { useMemo, useState } from "react";
import {
  changeLabel,
  changeTone,
  formatSessionDate,
  improvingCount,
  percentChange,
  type ParticipantAssessment,
  type ParticipantSnapshot,
  type PortalParticipant,
} from "@/lib/portal/participantView";
import { matchesSearch, slicePage } from "@/lib/portal/listPaging";
import ListPager from "@/app/portal/ListPager";

export default function ParticipantList({
  snapshot,
}: {
  snapshot: ParticipantSnapshot;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(snapshot.participants[0]?.id ?? "");

  const filtered = useMemo(() => {
    return snapshot.participants.filter((person) =>
      matchesSearch(
        `${person.first_name} ${person.last_name} ${person.id}`,
        query
      )
    );
  }, [query, snapshot.participants]);

  const selected =
    filtered.find((person) => person.id === selectedId) ?? filtered[0] ?? null;

  function handleQueryChange(value: string) {
    setQuery(value);
    const firstMatch = snapshot.participants.find((person) =>
      matchesSearch(`${person.first_name} ${person.last_name} ${person.id}`, value)
    );
    if (firstMatch) setSelectedId(firstMatch.id);
  }

  return (
    <div className="space-y-6">
      <p className="px-6 text-sm text-[#25303B]/80 sm:px-8">
        Showing {snapshot.shown} {snapshot.shown === 1 ? "person" : "people"} who
        consented to named reporting.
        {snapshot.hidden > 0
          ? ` ${snapshot.hidden} ${snapshot.hidden === 1 ? "other stays" : "others stay"} in Overview totals only.`
          : ""}
      </p>
      <ParticipantTable
        participants={filtered}
        selectedId={selected?.id ?? ""}
        query={query}
        onQueryChange={handleQueryChange}
        onSelect={setSelectedId}
      />
      {selected && <ParticipantDetail participant={selected} />}
    </div>
  );
}

function ParticipantTable({
  participants,
  selectedId,
  query,
  onQueryChange,
  onSelect,
}: {
  participants: PortalParticipant[];
  selectedId: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (id: string) => void;
}) {
  const [page, setPage] = useState(1);
  const { currentPage, items: visible } = slicePage(participants, page);

  function changePage(nextPage: number) {
    const next = slicePage(participants, nextPage);
    setPage(next.currentPage);
    const first = next.items[0];
    if (first) onSelect(first.id);
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-[#F9F5EF] shadow-xl ring-1 ring-black/5">
      <div className="flex flex-col gap-4 border-b border-black/10 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-extrabold">Participants</h2>
          <p className="mt-1 text-xs text-[#25303B]/65">
            Showing participants who consented to individual reporting
          </p>
        </div>
        <label className="relative block sm:w-72">
          <span className="sr-only">Search participants</span>
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#25303B]/45">
            ⌕
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setPage(1);
              onQueryChange(event.target.value);
            }}
            placeholder="Search name or ID"
            className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-[#25303B]/40 focus:border-[#25303B]/30 focus:ring-2 focus:ring-[#A6D5CE]"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <thead>
            <tr className="bg-[#25303B]/5 text-xs font-bold uppercase tracking-wide text-[#25303B]/60">
              <th className="px-5 py-3">Participant</th>
              <th className="px-4 py-3">This week</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Weekly average</th>
              <th className="px-4 py-3">Sessions / week</th>
              <th className="px-4 py-3">Last session</th>
              <th className="px-4 py-3">Outcomes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {visible.map((participant) => {
              const improvements = improvingCount(participant.assessments);
              const selected = selectedId === participant.id;
              return (
                <tr
                  key={participant.id}
                  className={[
                    "cursor-pointer transition",
                    selected ? "bg-[#A6D5CE]/30" : "hover:bg-white",
                  ].join(" ")}
                  onClick={() => onSelect(participant.id)}
                >
                  <td className="px-5 py-4">
                    <span className="block text-sm font-extrabold">
                      {participant.first_name} {participant.last_name}
                    </span>
                    <span className="mt-0.5 block text-xs text-[#25303B]/55">
                      {participant.id}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-bold">
                    {participant.minutes_this_week} min
                  </td>
                  <td className="px-4 py-4 text-sm">{participant.total_minutes} min</td>
                  <td className="px-4 py-4 text-sm">
                    {participant.average_weekly_minutes} min
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {participant.average_sessions_per_week}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {formatSessionDate(participant.last_session)}
                  </td>
                  <td className="px-4 py-4">
                    {participant.assessments.length === 0 ? (
                      <span className="inline-flex rounded-full bg-[#25303B]/10 px-2.5 py-1 text-xs font-extrabold text-[#25303B]/65">
                        Collecting
                      </span>
                    ) : (
                      <span
                        className={[
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold",
                          improvements >= 3
                            ? "bg-[#34D399]/15 text-[#177052]"
                            : improvements >= 1
                              ? "bg-[#E7B450]/25 text-[#795A13]"
                              : "bg-[#E58B66]/15 text-[#9A422D]",
                        ].join(" ")}
                      >
                        {improvements} of 4 improving
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {participants.length === 0 && (
          <div className="p-8 text-center text-sm text-[#25303B]/65">
            No participants match that search.
          </div>
        )}
      </div>
      {participants.length > 0 && (
        <ListPager
          total={participants.length}
          page={currentPage}
          noun="participants"
          onPageChange={changePage}
        />
      )}
    </section>
  );
}

function ParticipantDetail({ participant }: { participant: PortalParticipant }) {
  return (
    <section className="rounded-2xl bg-[#25303B] p-5 text-[#F9F5EF] shadow-xl sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-[#A6D5CE]">
            Participant record
          </div>
          <h2 className="mt-1 text-2xl font-extrabold">
            {participant.first_name} {participant.last_name}
          </h2>
          <p className="mt-1 text-xs text-[#F9F5EF]/60">{participant.id}</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#34D399]/15 px-3 py-1.5 text-xs font-bold text-[#8BE6C1] ring-1 ring-[#34D399]/25">
          <span className="h-2 w-2 rounded-full bg-[#34D399]" />
          Consent recorded
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <DetailKpi label="Minutes this week" value={`${participant.minutes_this_week}`} suffix="min" />
        <DetailKpi label="Total minutes" value={`${participant.total_minutes}`} suffix="min" />
        <DetailKpi
          label="Weekly average"
          value={`${participant.average_weekly_minutes}`}
          suffix="min"
        />
        <DetailKpi
          label="Sessions / week"
          value={`${participant.average_sessions_per_week}`}
        />
        <DetailKpi
          label="Last session"
          value={formatSessionDate(participant.last_session)}
          compact
        />
      </div>

      <div className="mt-7">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#A6D5CE]">
              Outcome assessments
            </h3>
            <p className="mt-1 text-xs text-[#F9F5EF]/60">
              Current results compared with baseline and the previous assessment
            </p>
          </div>
          <div className="text-xs text-[#F9F5EF]/50">Green indicates improvement</div>
        </div>

        {participant.assessments.length === 0 ? (
          <div className="rounded-xl bg-[#F9F5EF]/10 p-5 text-sm text-[#F9F5EF]/75 ring-1 ring-white/10">
            We are still collecting paired assessments for this person.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {participant.assessments.map((assessment) => (
              <AssessmentCard key={assessment.label} assessment={assessment} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function DetailKpi({
  label,
  value,
  suffix,
  compact = false,
}: {
  label: string;
  value: string;
  suffix?: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[#F9F5EF]/10 p-4 ring-1 ring-white/10">
      <div className="text-xs font-semibold text-[#F9F5EF]/60">{label}</div>
      <div className={["mt-1 font-extrabold", compact ? "text-base" : "text-2xl"].join(" ")}>
        {value}
        {suffix && (
          <span className="ml-1 text-xs font-semibold text-[#F9F5EF]/55">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function AssessmentCard({ assessment }: { assessment: ParticipantAssessment }) {
  const baselineChange = percentChange(assessment.baseline, assessment.current);
  const previousChange = percentChange(assessment.previous, assessment.current);

  return (
    <article className="rounded-xl bg-[#F9F5EF] p-4 text-[#25303B] shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-extrabold">{assessment.label}</h4>
          <div className="mt-0.5 text-xs text-[#25303B]/55">
            Reassessed {assessment.currentDate}
          </div>
        </div>
        <span
          className={[
            "rounded-full px-2.5 py-1 text-xs font-extrabold",
            changeTone(baselineChange, assessment.direction) === "positive"
              ? "bg-[#34D399]/15 text-[#177052]"
              : changeTone(baselineChange, assessment.direction) === "negative"
                ? "bg-[#E58B66]/15 text-[#9A422D]"
                : "bg-[#25303B]/10 text-[#25303B]/65",
          ].join(" ")}
        >
          {changeLabel(assessment.baseline, assessment.current)} from baseline
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Result label="Baseline" value={assessment.baseline} unit={assessment.unit} />
        <Result label="Previous" value={assessment.previous} unit={assessment.unit} />
        <Result label="Current" value={assessment.current} unit={assessment.unit} emphasis />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3 text-xs">
        <span className="text-[#25303B]/60">Change since last assessment</span>
        <span
          className={[
            "font-extrabold",
            changeTone(previousChange, assessment.direction) === "positive"
              ? "text-[#177052]"
              : changeTone(previousChange, assessment.direction) === "negative"
                ? "text-[#9A422D]"
                : "text-[#25303B]/65",
          ].join(" ")}
        >
          {changeLabel(assessment.previous, assessment.current)}
        </span>
      </div>
    </article>
  );
}

function Result({
  label,
  value,
  unit,
  emphasis = false,
}: {
  label: string;
  value: number;
  unit: string;
  emphasis?: boolean;
}) {
  return (
    <div className={["rounded-lg p-2.5", emphasis ? "bg-[#A6D5CE]/35" : "bg-black/[0.035]"].join(" ")}>
      <div className="text-[10px] font-bold uppercase tracking-wide text-[#25303B]/50">
        {label}
      </div>
      <div className="mt-1 text-xl font-extrabold">{value}</div>
      <div className="text-[10px] text-[#25303B]/55">{unit}</div>
    </div>
  );
}
