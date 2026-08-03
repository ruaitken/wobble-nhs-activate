// Standalone FRONT-END-ONLY demo for Surrey County Council (falls prevention).
// No Supabase, no auth, no real campaign — purely illustrative for sales.
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Montserrat } from "next/font/google";
import SurreyActivateClient from "./SurreyActivateClient";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function DemoSurreyActivatePage() {
  return <SurreyActivateClient fontClassName={montserrat.className} />;
}
