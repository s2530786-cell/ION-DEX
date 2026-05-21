import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import { useMemo, useState, type PropsWithChildren } from "react";
import { AuroraGalaxyBackground } from "@/components/background/AuroraGalaxyBackground";
import { NeonButton } from "@/components/ui/NeonButton";
import { useMockData } from "@/context/MockDataContext";
import { mockPreviewMeta } from "@/lib/MOCK_DATA";
import { UserAvatar } from "./UserAvatar";

export type PageKey =
  | "dashboard"
  | "swap"
  | "trade"
  | "grid"
  | "pool"
  | "stake"
  | "bridge"
  | "burn"
  | "domain"
  | "ai";

export const navItems: Array<{ key: PageKey; label: string }> = [
  { key: "dashboard", label: "Dashboard" },
  { key: "swap", label: "Swap" },
  { key: "trade", label: "Trade" },
  { key: "grid", label: "Grid" },
  { key: "pool", label: "Pool" },
  { key: "stake", label: "Stake" },
  { key: "bridge", label: "Bridge" },
  { key: "burn", label: "Burn" },
  { key: "domain", label: "Domain" },
  { key: "ai", label: "AI" },
];

type AppShellProps = PropsWithChildren<{
  activePage: PageKey;
  onPageChange: (page: PageKey) => void;
}>;

function shortenIonAddress(address: string): string {
  if (address.length <= 12) {
    return address;
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function AppShell({ activePage, children, onPageChange }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  function selectPage(page: PageKey) {
    onPageChange(page);
    setMobileNavOpen(false);
  }

  return (
    <div className="min-h-screen px-4 py-4 text-white sm:px-6 lg:px-8">
      <AuroraGalaxyBackground />
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/40 shadow-[0_0_70px_rgba(36,247,255,0.16)] backdrop-blur-xl lg:flex">
        <aside
          aria-label="Sidebar"
          className="hidden w-56 shrink-0 flex-col border-r border-white/10 bg-slate-950/55 p-4 lg:flex"
          data-testid="app-sidebar"
        >
          <SidebarBrand />
          <NavList activePage={activePage} className="mt-6" onSelect={selectPage} />
        </aside>

        <AnimatePresence>
          {mobileNavOpen ? (
            <>
              <motion.button
                animate={{ opacity: 1 }}
                aria-label="Close navigation menu"
                className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                onClick={() => setMobileNavOpen(false)}
                type="button"
              />
              <motion.aside
                animate={{ x: 0 }}
                aria-label="Mobile navigation"
                className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,86vw)] flex-col border-r border-white/10 bg-slate-950/95 p-4 shadow-[0_0_40px_rgba(36,247,255,0.2)] backdrop-blur-xl lg:hidden"
                data-testid="app-mobile-nav"
                exit={{ x: "-100%" }}
                initial={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 360, damping: 32 }}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <SidebarBrand />
                  <button
                    aria-label="Close menu"
                    className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-cyan-100/80"
                    data-testid="nav-close"
                    onClick={() => setMobileNavOpen(false)}
                    type="button"
                  >
                    <X size={18} />
                  </button>
                </div>
                <NavList activePage={activePage} onSelect={selectPage} />
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/55 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                aria-expanded={mobileNavOpen}
                aria-label="Open navigation menu"
                className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-cyan-100/80 lg:hidden"
                data-testid="nav-menu"
                onClick={() => setMobileNavOpen(true)}
                type="button"
              >
                <Menu size={18} />
              </button>
              <div className="hidden items-center gap-3 lg:flex">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/55">Navigation</p>
                <p className="text-sm font-bold text-white">
                  {navItems.find((item) => item.key === activePage)?.label ?? "Dashboard"}
                </p>
              </div>
              <div className="flex items-center gap-3 lg:hidden">
                <img
                  src="/ion-logo.png"
                  alt="ION DEX"
                  className="h-10 w-auto rounded-xl"
                  data-testid="brand-logo"
                />
                <div>
                  <p className="text-lg font-black tracking-wide text-glow-cyan" data-testid="brand-title">
                    ION DEX
                  </p>
                  <p className="text-xs text-cyan-100/55">Trade the future of ION</p>
                </div>
              </div>
            </div>

            <nav
              aria-label="Primary"
              className="hidden min-w-0 flex-nowrap items-center gap-1 overflow-x-auto whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] p-1 md:flex lg:hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {navItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`rounded-full px-3 py-2 text-xs font-bold transition hover:bg-white/10 hover:text-white ${
                    activePage === item.key
                      ? "bg-white/15 text-white shadow-[0_0_18px_rgba(36,247,255,0.25)]"
                      : "text-slate-200/75"
                  }`}
                  data-testid={`nav-${item.key}`}
                  onClick={() => selectPage(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="relative flex items-center gap-2">
              <button
                type="button"
                className="hidden rounded-full border border-white/10 bg-white/[0.04] p-2 text-cyan-100/80 sm:block"
                aria-label="Language"
              >
                <Globe2 size={18} />
              </button>
              <button
                type="button"
                className="hidden rounded-full border border-white/10 bg-white/[0.04] p-2 text-cyan-100/80 sm:block"
                aria-label="Notifications"
              >
                <Bell size={18} />
              </button>
              <button
                type="button"
                className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-cyan-100/90 md:flex"
              >
                <ShieldCheck size={16} />
                ION ID
              </button>
              <UserAvatar />
            </div>
          </header>

          <TickerStrip />

          <main className="flex-1 p-4 sm:p-6" data-testid="main-content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarBrand() {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/ion-logo.png"
        alt="ION DEX"
        className="h-10 w-auto rounded-xl"
        data-testid="brand-logo"
      />
      <div>
        <p className="text-lg font-black tracking-wide text-glow-cyan" data-testid="brand-title">
          ION DEX
        </p>
        <p className="text-xs text-cyan-100/55">Trade the future of ION</p>
      </div>
    </div>
  );
}

function NavList({
  activePage,
  className = "",
  onSelect,
}: {
  activePage: PageKey;
  className?: string;
  onSelect: (page: PageKey) => void;
}) {
  return (
    <nav aria-label="Sidebar navigation" className={`grid gap-1 ${className}`}>
      {navItems.map((item) => {
        const active = activePage === item.key;
        return (
          <button
            key={item.key}
            type="button"
            className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm font-bold transition ${
              active
                ? "bg-white/15 text-white shadow-[0_0_18px_rgba(36,247,255,0.2)]"
                : "text-slate-200/75 hover:bg-white/10 hover:text-white"
            }`}
            data-testid={`nav-${item.key}`}
            onClick={() => onSelect(item.key)}
          >
            {item.key === "dashboard" ? <LayoutDashboard size={16} /> : null}
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function TickerStrip() {
  const { marketTickers: tickers } = useMockData();
  const sourceLabel = `${mockPreviewMeta("ticker-strip").source} (MOCK_DATA)`;

  return (
    <div
      className="flex gap-4 overflow-hidden border-b border-white/10 bg-black/25 px-4 py-2 text-xs sm:px-6"
      data-testid="ticker-strip"
    >
      <span className="sr-only" data-testid="ticker-source">
        Ticker source: {sourceLabel}
      </span>
      <div className="flex min-w-max animate-[ticker_36s_linear_infinite] gap-4">
        {[...tickers, ...tickers].map((ticker, index) => (
          <span
            key={`${ticker.symbol}-${index}`}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1"
          >
            <strong className="text-cyan-200">{ticker.symbol}</strong>{" "}
            <span className="text-white/80">{ticker.displayPrice}</span>{" "}
            <span
              className={
                ticker.displayChange.startsWith("+") ? "text-emerald-300" : "text-rose-300"
              }
            >
              {ticker.displayChange}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

