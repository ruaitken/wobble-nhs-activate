// Public-facing front-end-only example using fictional participant data.
import { Montserrat } from "next/font/google";
import ExampleParticipantsDashboard from "../demo-ggc-participants/GgcParticipantsDashboard";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function DemoParticipantInsightsPage() {
  return <ExampleParticipantsDashboard fontClassName={montserrat.className} />;
}
