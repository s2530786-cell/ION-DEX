import { Bell, Globe2, ShieldCheck, Wallet } from "lucide-react";
import type { PropsWithChildren } from "react";
import { AuroraGalaxyBackground } from "@/components/background/AuroraGalaxyBackground";
import { NeonButton } from "@/components/ui/NeonButton";

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
  return (
    <div className="min-h-screen px-4 py-4 text-white sm:px-6 lg:px-8">
      <AuroraGalaxyBackground />
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/40 shadow-[0_0_70px_rgba(36,247,255,0.16)] backdrop-blur-xl">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 bg-slate-950/55 px-4 py-3 sm:px-6">
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

          <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 lg:flex">
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

          <div className="flex items-center gap-2">
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
            <NeonButton className="flex items-center gap-2 px-4 py-2">
              <Wallet size={16} />
              Wallet Connect
            </NeonButton>
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

function TickerStrip() {
  const tickers = [
    { symbol: "ION", price: "$6.02", change: "+8.42%" },
    { symbol: "BNB", price: "$642.20", change: "+1.18%" },
    { symbol: "BTC", price: "$103,420", change: "+0.74%" },
    { symbol: "ETH", price: "$4,906", change: "-0.38%" },
    { symbol: "SOL", price: "$218.30", change: "+3.12%" },
    { symbol: "USDT", price: "$1.00", change: "+0.01%" },
  ];

  return (
    <div
      className="flex gap-4 overflow-hidden border-b border-white/10 bg-black/25 px-4 py-2 text-xs sm:px-6"
      data-testid="ticker-strip"
    >
      <div className="flex min-w-max animate-[ticker_36s_linear_infinite] gap-4">
        {[...tickers, ...tickers].map((ticker, index) => (
          <span
            key={`${ticker.symbol}-${index}`}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1"
          >
            <strong className="text-cyan-200">{ticker.symbol}</strong>{" "}
            <span className="text-white/80">{ticker.price}</span>{" "}
            <span
              className={
                ticker.change.startsWith("+") ? "text-emerald-300" : "text-rose-300"
              }
            >
              {ticker.change}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
