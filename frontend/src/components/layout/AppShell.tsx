import { Bell, CheckCircle2, Globe2, LogOut, ShieldCheck, UserCircle2, Wallet } from "lucide-react";
import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { AuroraGalaxyBackground } from "@/components/background/AuroraGalaxyBackground";
import { NeonButton } from "@/components/ui/NeonButton";
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
  const [walletPanelOpen, setWalletPanelOpen] = useState(false);
  const [connectedProvider, setConnectedProvider] = useState<WalletProviderKey | null>(null);
  const selectedProvider = useMemo(
    () => walletProviders.find((provider) => provider.key === connectedProvider) ?? null,
    [connectedProvider],
  );

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
    status: "Profile sync ready",
  },
  {
    key: "ion-browser",
    name: "ION Browser Wallet",
    label: "Native chain signing",
    status: "Provider detection ready",
  },
  {
    key: "walletconnect",
    name: "WalletConnect / OKX",
    label: "Mainstream Web3 bridge",
    status: "QR pairing ready",
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
            Wallet Access
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
              {connectedProvider.name} secure session ready
            </p>
            <p className="mt-1 text-emerald-100/70">
              Profile, ION ID badges, and wallet signing are staged behind user approval.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3">
            <UserCircle2 className="text-cyan-200" size={24} />
            <div>
              <p className="text-sm font-bold text-white">ION profile</p>
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
            Disconnect
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
            Private keys never leave the wallet. Signatures require explicit approval.
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
