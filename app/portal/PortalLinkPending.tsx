"use client";

import { useLinkStatus } from "next/link";

export default function PortalLinkPending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden
    />
  );
}
