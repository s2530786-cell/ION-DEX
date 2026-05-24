/** Dev-only banner so you can confirm the browser loaded this build (not a cached old tab). */
export function DevBuildRibbon() {
  if (!import.meta.env.DEV) {
    return null;
  }

  const stamp =
    import.meta.env.VITE_ION_BUILD_STAMP?.trim() ||
    import.meta.env.VITE_ION_DEV_PORT?.trim() ||
    "dev";

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] flex justify-center px-2 pt-2"
      data-testid="dev-build-ribbon"
      role="status"
    >
      <p className="rounded-full border border-fuchsia-400/70 bg-fuchsia-950/95 px-4 py-1.5 text-center text-[11px] font-bold tracking-wide text-fuchsia-100 shadow-[0_0_24px_rgba(217,70,239,0.45)] sm:text-xs">
        DEV {stamp} · Open Trade build · hard refresh Ctrl+Shift+R
      </p>
    </div>
  );
}
