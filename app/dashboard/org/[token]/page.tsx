export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Montserrat } from "next/font/google";
import OrgDashboardClient from "./OrgDashboardClient";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default async function OrgDashboardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <OrgDashboardClient token={token} fontClassName={montserrat.className} />;
}
