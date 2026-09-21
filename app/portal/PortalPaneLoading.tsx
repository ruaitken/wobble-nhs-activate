export default function PortalPaneLoading() {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/40 px-5 py-6"
      role="status"
      aria-live="polite"
    >
      <span
        className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-[#25303B]/20 border-t-[#25303B]"
        aria-hidden
      />
      <span className="text-sm font-semibold">Loading…</span>
    </div>
  );
}
