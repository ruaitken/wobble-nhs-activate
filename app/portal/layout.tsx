export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${montserrat.className} min-h-screen bg-[#A6D5CE] text-[#25303B]`}>
      {children}
    </div>
  );
}
