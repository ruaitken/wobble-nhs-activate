// This dashboard is per-campaign and token-gated, so it must never be prerendered.
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Montserrat } from "next/font/google";
import DashboardClient from "./DashboardClient";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <DashboardClient token={token} fontClassName={montserrat.className} />;
}
