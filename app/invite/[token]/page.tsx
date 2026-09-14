export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Montserrat } from "next/font/google";
import InviteActivateClient from "@/app/invite/InviteActivateClient";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <InviteActivateClient token={token} fontClassName={montserrat.className} />;
}
