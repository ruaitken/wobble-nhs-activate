// Standalone FRONT-END-ONLY impact dashboard demo for Surrey County Council.
// Uses mock data only — does not connect to Supabase or any real records.
import { Montserrat } from "next/font/google";
import SurreyDashboardClient from "./SurreyDashboardClient";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function DemoSurreyDashboardPage() {
  return <SurreyDashboardClient fontClassName={montserrat.className} />;
}
