import { Bell, Globe2, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState, type PropsWithChildren } from "react";
import { AuroraGalaxyBackground } from "@/components/background/AuroraGalaxyBackground";
import { ProfileHub } from "@/components/layout/ProfileHub";
import { fetchMarketTickers, type MarketTicker } from "@/lib/ionApi";

export type PageKey =
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
  const [profileHubOpen, setProfileHubOpen] = useState(false);
  const [connectedProviderKey, setConnectedProviderKey] = useState<string | null>(null);
  const [selectedAvatarId, setSelectedAvatarId] = useState("aurora-cyan");
  const [privacyMode, setPrivacyMode] = useState(false);

  return (
    <div className="min-h-screen px-4 py-4 text-white sm:px-6 lg:px-8">
      <AuroraGalaxyBackground />
      <div className="glass-surface mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col overflow-hidden rounded-[2rem] shadow-[0_0_70px_rgba(36,247,255,0.16)]">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 bg-[#03050f]/55 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
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

          <nav
            aria-label="Primary"
            className="flex min-w-0 max-w-[62vw] flex-nowrap items-center gap-1 overflow-x-auto whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] p-1 sm:max-w-[70vw] md:max-w-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
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
                onClick={() => onPageChange(item.key)}
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
              onClick={() => setProfileHubOpen(true)}
            >
              <Globe2 size={18} />
            </button>
            <button
              type="button"
              className="hidden rounded-full border border-white/10 bg-white/[0.04] p-2 text-cyan-100/80 sm:block"
              aria-label="Notifications"
              onClick={() => setProfileHubOpen(true)}
            >
              <Bell size={18} />
            </button>
            <button
              type="button"
              className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-cyan-100/90 md:flex"
              onClick={() => setProfileHubOpen(true)}
            >
              <ShieldCheck size={16} />
              ION ID
            </button>
            <button
              type="button"
              aria-expanded={profileHubOpen}
              aria-label={connectedProviderKey ? "Profile hub, wallet connected" : "Profile hub"}
              className="flex items-center gap-2 rounded-full border border-cyan-200/30 bg-[linear-gradient(135deg,#24f7ff33,#8d4dff33)] px-2 py-1.5 pr-3 shadow-[0_0_20px_rgba(36,247,255,0.2)] transition hover:border-cyan-200/50"
              data-testid="profile-hub-trigger"
              onClick={() => setProfileHubOpen((open) => !open)}
            >
              <span
                className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-[linear-gradient(135deg,#24f7ff,#8d4dff)]"
                data-testid="wallet-connect"
              >
                <UserRound size={18} className="text-white" />
              </span>
              <span className="hidden text-xs font-black text-white sm:inline">
                {connectedProviderKey ? "Profile Ready" : "Profile Hub"}
              </span>
            </button>

            <ProfileHub
              connectedProviderKey={connectedProviderKey}
              onAvatarChange={setSelectedAvatarId}
              onClose={() => setProfileHubOpen(false)}
              onConnect={(key) => {
                setConnectedProviderKey(key);
              }}
              onDisconnect={() => setConnectedProviderKey(null)}
              onPrivacyModeChange={setPrivacyMode}
              open={profileHubOpen}
              privacyMode={privacyMode}
              selectedAvatarId={selectedAvatarId}
            />
          </div>
        </header>

        <TickerStrip privacyMode={privacyMode} />

        <main className="flex-1 p-4 sm:p-6" data-testid="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

function TickerStrip({ privacyMode }: { privacyMode: boolean }) {
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
            <span className="text-white/80">
              {privacyMode ? "••••" : ticker.displayPrice}
            </span>{" "}
            <span
              className={
                ticker.displayChange.startsWith("+") ? "text-emerald-300" : "text-rose-300"
              }
            >
              {privacyMode ? "•••" : ticker.displayChange}
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
