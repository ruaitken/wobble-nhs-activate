// Standalone front-end-only concept for a participant-level GGC dashboard.
// This route uses fictional data and does not connect to Supabase.
import { Montserrat } from "next/font/google";
import GgcParticipantsDashboard from "./GgcParticipantsDashboard";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function DemoGgcParticipantsPage() {
  return <GgcParticipantsDashboard fontClassName={montserrat.className} />;
}
