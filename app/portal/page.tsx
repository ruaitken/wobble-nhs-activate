export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { getPortalSession } from "@/lib/portal/session";
import { defaultPortalPath } from "@/lib/portal/context";
import { PORTAL_HOME_PATH, PORTAL_LOGIN_PATH } from "@/lib/portal/paths";

export default async function PortalHomePage() {
  const session = await getPortalSession();
  if (!session) redirect(PORTAL_LOGIN_PATH);

  if (session.memberships.length === 0) {
    return (
      <main className="min-h-screen bg-[#A6D5CE] text-[#25303B]">
        <div className="mx-auto max-w-xl px-4 py-16">
          <section className="rounded-2xl bg-[#F9F5EF] p-6 shadow-xl ring-1 ring-black/5">
            <h1 className="text-2xl font-extrabold">No organisation access</h1>
            <p className="mt-2 text-sm text-[#25303B]/80">
              This account is signed in, but it is not a member of a customer
              organisation. Ask Wobble to invite you.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const next = await defaultPortalPath(session);
  if (next === PORTAL_HOME_PATH) {
    return (
      <main className="min-h-screen bg-[#A6D5CE] text-[#25303B]">
        <div className="mx-auto max-w-xl px-4 py-16">
          <section className="rounded-2xl bg-[#F9F5EF] p-6 shadow-xl ring-1 ring-black/5">
            <h1 className="text-2xl font-extrabold">No programme yet</h1>
            <p className="mt-2 text-sm text-[#25303B]/80">
              This organisation does not have a programme to open. Ask Wobble
              to add one.
            </p>
          </section>
        </div>
      </main>
    );
  }

  redirect(next);
}
