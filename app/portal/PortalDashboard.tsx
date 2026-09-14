"use client";

import { Dashboard, type Stats } from "@/app/dashboard/[token]/DashboardClient";

export default function PortalDashboard({
  stats,
}: {
  stats: Extract<Stats, { found: true; suppressed: false }>;
}) {
  return <Dashboard stats={stats} />;
}
