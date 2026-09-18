import PortalDashboard from "@/app/portal/PortalDashboard";

type OverviewStats = {
  found?: boolean;
  suppressed?: boolean;
  enrolled?: number;
} | null;

export default function PortalOverview({
  stats,
}: {
  stats: OverviewStats;
}) {
  if (!stats || !stats.found) {
    return (
      <div className="rounded-2xl border border-[#E58B66]/40 bg-[#E58B66]/10 p-6">
        <div className="text-sm font-bold">This programme could not be loaded</div>
        <div className="mt-1 text-sm text-[#25303B]/80">
          Please refresh and try again.
        </div>
      </div>
    );
  }

  if (stats.suppressed) {
    return (
      <div className="rounded-2xl border border-black/10 bg-[#F9F5EF] p-6 shadow-xl ring-1 ring-black/5">
        <div className="text-sm font-extrabold">Not enough members yet</div>
        <div className="mt-1 text-sm text-[#25303B]/80">
          To protect individual privacy, we only show cohort statistics once at
          least 5 members have enrolled. Currently enrolled: {stats.enrolled}.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PortalDashboard stats={stats as never} />
      <p className="mt-6 text-xs text-[#25303B]/70">
        All information displayed here is aggregated and anonymised. Outcome
        measures are only shown where sufficient participant numbers exist to
        protect individual privacy. No names or emails are shown.
      </p>
    </div>
  );
}
