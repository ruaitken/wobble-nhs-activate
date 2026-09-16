"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignOutButton({
  className = "text-left",
}: {
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch("/api/portal/logout", { method: "POST" });
    router.replace("/portal/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className={[
        "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-60",
        className,
      ].join(" ")}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
