import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserCircle2,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { AuroraGalaxyBackground } from "@/components/background/AuroraGalaxyBackground";
import { NeonButton } from "@/components/ui/NeonButton";
import { fetchMarketTickers, type MarketTicker } from "@/lib/ionApi";

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

export function AppShell({ activePage, children, onPageChange }: AppShellProps) {
  const [walletPanelOpen, setWalletPanelOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [connectedProvider, setConnectedProvider] = useState<WalletProviderKey | null>(null);
  const selectedProvider = useMemo(
    () => walletProviders.find((provider) => provider.key === connectedProvider) ?? null,
    [connectedProvider],
  );

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
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[linear-gradient(135deg,#24f7ff,#8d4dff,#ff3bd4)] shadow-neonCyan">
                  <div className="h-5 w-5 rotate-45 rounded-md border-2 border-white/90" />
                </div>
                <div>
                  <p
                    className="text-lg font-black tracking-wide text-glow-cyan"
                    data-testid="brand-title"
                  >
                    ION DEX
                  </p>
                  <p className="text-xs text-cyan-100/55">Trade the future of ION</p>
                </div>
              </div>
            </div>

            <nav
              aria-label="Primary"
              className="hidden min-w-0 flex-nowrap items-center gap-1 overflow-x-auto whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] p-1 md:flex [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
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
              <NeonButton
                aria-expanded={walletPanelOpen}
                className="flex items-center gap-2 px-4 py-2"
                data-testid="wallet-connect"
                onClick={() => setWalletPanelOpen((open) => !open)}
                type="button"
              >
                <Wallet size={16} />
                {selectedProvider ? "Wallet Ready" : "Wallet Connect"}
              </NeonButton>

              {walletPanelOpen ? (
                <WalletConnectPanel
                  connectedProvider={selectedProvider}
                  onConnect={(provider) => setConnectedProvider(provider)}
                  onDisconnect={() => setConnectedProvider(null)}
                />
              ) : null}
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
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[linear-gradient(135deg,#24f7ff,#8d4dff,#ff3bd4)] shadow-neonCyan">
        <div className="h-5 w-5 rotate-45 rounded-md border-2 border-white/90" />
      </div>
      <div>
        <p className="text-lg font-black tracking-wide text-glow-cyan">ION DEX</p>
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

type WalletProviderKey = "online" | "ion-browser" | "walletconnect";

type WalletProvider = {
  key: WalletProviderKey;
  name: string;
  label: string;
  status: string;
};

const walletProviders: WalletProvider[] = [
  {
    key: "online",
    name: "Online+ Wallet",
    label: "ION native social wallet",
    status: "Profile sync shell",
  },
  {
    key: "ion-browser",
    name: "ION Browser Wallet",
    label: "Native chain signing",
    status: "Provider detection shell",
  },
  {
    key: "walletconnect",
    name: "WalletConnect / OKX",
    label: "Mainstream Web3 bridge",
    status: "QR pairing shell",
  },
];

function WalletConnectPanel({
  connectedProvider,
  onConnect,
  onDisconnect,
}: {
  connectedProvider: WalletProvider | null;
  onConnect: (provider: WalletProviderKey) => void;
  onDisconnect: () => void;
}) {
  return (
    <div
      className="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-[min(22rem,calc(100vw-2rem))] rounded-[1.6rem] border border-cyan-200/20 bg-slate-950/95 p-4 shadow-[0_0_36px_rgba(36,247,255,0.24)] backdrop-blur-xl"
      data-testid="wallet-panel"
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-300/[0.08] text-cyan-200 shadow-neonCyan">
          {connectedProvider ? <CheckCircle2 size={22} /> : <Wallet size={22} />}
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-100/50">
            Wallet Shell
          </p>
          <p className="mt-1 text-lg font-black text-white">
            {connectedProvider ? connectedProvider.name : "Choose provider"}
          </p>
        </div>
      </div>

      {connectedProvider ? (
        <div className="grid gap-3" data-testid="profile-menu">
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.07] p-3 text-sm text-emerald-100">
            <p className="font-black" data-testid="wallet-confirmation">
              {connectedProvider.name} draft session ready
            </p>
            <p className="mt-1 text-emerald-100/70">
              Profile, ION ID badges, and wallet signing remain mocked until adapters land.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3">
            <UserCircle2 className="text-cyan-200" size={24} />
            <div>
              <p className="text-sm font-bold text-white">Demo profile</p>
              <p className="text-xs text-cyan-100/55">{connectedProvider.status}</p>
            </div>
          </div>
          <button
            className="flex items-center justify-center gap-2 rounded-full border border-rose-300/25 bg-rose-300/[0.08] px-4 py-2 text-sm font-black text-rose-100 transition hover:bg-rose-300/[0.14]"
            data-testid="wallet-disconnect"
            onClick={onDisconnect}
            type="button"
          >
            <LogOut size={16} />
            Disconnect draft
          </button>
        </div>
      ) : (
        <div className="grid gap-2">
          {walletProviders.map((provider) => (
            <button
              className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-left transition hover:border-cyan-200/35 hover:bg-cyan-300/[0.08]"
              data-testid={`wallet-provider-${provider.key}`}
              key={provider.key}
              onClick={() => onConnect(provider.key)}
              type="button"
            >
              <span className="block text-sm font-black text-white">{provider.name}</span>
              <span className="mt-1 block text-xs text-cyan-100/55">{provider.label}</span>
            </button>
          ))}
          <p className="mt-2 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-xs text-amber-100/75">
            Draft only: no private keys, no RPC calls, no wallet signatures are requested.
          </p>
        </div>
      )}
    </div>
  );
}

function TickerStrip() {
  const [tickers, setTickers] = useState<MarketTicker[]>(fallbackTickers);
  const [sourceLabel, setSourceLabel] = useState("offline fallback");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 1200);

    fetchMarketTickers(controller.signal)
      .then((response) => {
        setTickers(response.data);
        setSourceLabel(`${response.meta.source} API`);
      })
      .catch(() => {
        setTickers(fallbackTickers);
        setSourceLabel("offline fallback");
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

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

const fallbackTickers: MarketTicker[] = [
  { symbol: "ION", priceUsd: 6.02, displayPrice: "$6.02", change24hPct: 8.42, displayChange: "+8.42%" },
  { symbol: "BNB", priceUsd: 642.2, displayPrice: "$642.20", change24hPct: 1.18, displayChange: "+1.18%" },
  { symbol: "BTC", priceUsd: 103420, displayPrice: "$103,420", change24hPct: 0.74, displayChange: "+0.74%" },
  { symbol: "ETH", priceUsd: 4906, displayPrice: "$4,906", change24hPct: -0.38, displayChange: "-0.38%" },
  { symbol: "SOL", priceUsd: 218.3, displayPrice: "$218.30", change24hPct: 3.12, displayChange: "+3.12%" },
  { symbol: "USDT", priceUsd: 1, displayPrice: "$1.00", change24hPct: 0.01, displayChange: "+0.01%" },
];
