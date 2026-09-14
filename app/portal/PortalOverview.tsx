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
      <div>
        <h3 className="text-lg font-bold">Overview</h3>
        <p className="mt-2 text-sm text-[#25303B]/80">
          This programme could not be loaded.
        </p>
      </div>
    );
  }

  if (stats.suppressed) {
    return (
      <div>
        <h3 className="text-lg font-bold">Overview</h3>
        <p className="mt-2 text-sm text-[#25303B]/80">
          To protect individual privacy, cohort statistics appear once at least
          5 members have enrolled. Currently enrolled: {stats.enrolled}.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-xs text-[#25303B]/70">
        Aggregated and anonymised. No names or emails are shown.
      </p>
      <PortalDashboard stats={stats as never} />
    </div>
  );
}
