import {
  ArrowDownUp,
  ArrowLeftRight,
  Bot,
  Flame,
  LayoutGrid,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";

type FeatureCard = {
  title: string;
  label: string;
  icon: typeof Layers3;
  color: "cyan" | "magenta" | "gold";
};

const featureCards: FeatureCard[] = [
  { title: "Pool", label: "Liquidity", icon: Layers3, color: "cyan" },
  { title: "Grid", label: "Spot strategies", icon: LayoutGrid, color: "magenta" },
  { title: "Bridge", label: "ION / BSC", icon: ArrowLeftRight, color: "cyan" },
  { title: "Burn", label: "Dual-chain tracker", icon: Flame, color: "magenta" },
  { title: "ION ID", label: "KYC Pass", icon: ShieldCheck, color: "gold" },
  { title: "AI Market", label: "Signals & risk", icon: Bot, color: "cyan" },
];

export function DashboardPage() {
  return (
    <div className="grid gap-5 xl:grid-cols-[21rem_1fr_18rem]">
      <SwapPanel />
      <MarketStage />
      <RightStats />
      <div className="xl:col-span-3">
        <FeatureGrid />
      </div>
    </div>
  );
}

function SwapPanel() {
  return (
    <NeonCard className="min-h-[28rem]" variant="magenta">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-2xl font-black">Swap</p>
          <p className="text-sm text-cyan-100/55">BNB / ION market buy</p>
        </div>
        <ArrowDownUp className="text-cyan-200" />
      </div>

      <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <TokenBadge symbol="BNB" accent="bg-yellow-300 text-black" />
        <ArrowDownUp className="text-cyan-200/60" size={18} />
        <TokenBadge
          symbol="ION"
          accent="bg-gradient-to-br from-yellow-200 to-amber-500 text-slate-950"
        />
      </div>

      <div className="space-y-3">
        <InputShell label="Pay" value="0.00" />
        <InputShell label="Receive" value="0.00" />
        <InputShell label="Limit price" value="Market" />
        <InputShell label="Slippage" value="0.5%" />
      </div>

      <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-3 text-xs text-cyan-100/75">
        Fees are planned in ION. Final quote will show protocol fee, execution fee, price
        impact, and minimum received.
      </div>

      <NeonButton className="mt-5 w-full" data-testid="swap-submit" type="button">
        Swap
      </NeonButton>
    </NeonCard>
  );
}

function MarketStage() {
  return (
    <NeonCard className="min-h-[28rem]" variant="cyan">
      <div className="flex h-full flex-col">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.36em] text-cyan-200/70">
              Professional Chart
            </p>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">
              ION Market <span className="text-glow-magenta text-fuchsia-300">Galaxy</span>
            </h1>
          </div>
          <Sparkles className="text-cyan-200" />
        </div>

        <div className="relative flex-1 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/30">
          <div className="absolute inset-0 aurora-noise opacity-80" />
          <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_20deg,rgba(36,247,255,0.1),rgba(255,59,212,0.28),rgba(141,77,255,0.18),rgba(36,247,255,0.1))] blur-2xl [animation:ionSpinSlow_160s_linear_infinite]" />
          <div className="absolute inset-x-8 bottom-10 h-36">
            <div className="h-full w-full rounded-[50%] border-t border-cyan-200/45 shadow-[0_-22px_50px_rgba(36,247,255,0.28)]" />
          </div>
          <div className="absolute bottom-8 left-8 right-8 flex h-44 items-end gap-2">
            {Array.from({ length: 38 }).map((_, index) => {
              const height = 34 + ((index * 29) % 120);
              const magenta = index % 5 === 0;
              return (
                <div key={index} className="flex flex-1 items-end justify-center">
                  <div
                    className={`w-full max-w-[0.7rem] rounded-full ${
                      magenta ? "bg-fuchsia-400" : "bg-cyan-300"
                    } shadow-[0_0_16px_currentColor]`}
                    style={{ height }}
                  />
                </div>
              );
            })}
          </div>
          <p className="absolute left-6 top-5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-cyan-100/75">
            AI Signal: Bullish 63% / Risk: Medium
          </p>
        </div>
      </div>
    </NeonCard>
  );
}

function RightStats() {
  return (
    <div className="grid gap-5">
      <NeonCard variant="cyan">
        <p className="text-sm text-cyan-100/55">TVL</p>
        <p className="mt-1 text-3xl font-black">$1,234,567</p>
        <p className="mt-1 text-xs text-emerald-300">+12.8% this week</p>
      </NeonCard>
      <NeonCard variant="magenta">
        <p className="text-sm text-cyan-100/55">APR</p>
        <p className="mt-1 text-3xl font-black">25.5%</p>
        <p className="mt-1 text-xs text-cyan-200">Dynamic staking rate</p>
      </NeonCard>
      <NeonCard variant="gold">
        <p className="text-sm text-cyan-100/55">Burn</p>
        <p className="mt-1 text-3xl font-black">87.26M</p>
        <div className="mt-4 h-2 rounded-full bg-white/10">
          <div className="h-2 w-[62%] rounded-full bg-[linear-gradient(90deg,#24f7ff,#ff3bd4,#ffd166)]" />
        </div>
      </NeonCard>
    </div>
  );
}

function FeatureGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {featureCards.map((card) => {
        const Icon = card.icon;
        return (
          <NeonCard key={card.title} variant={card.color} className="min-h-[11rem]">
            <div className="flex h-full flex-col justify-between">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.07] text-cyan-200 shadow-neonCyan">
                <Icon size={28} />
              </div>
              <div>
                <p className="text-2xl font-black">{card.title}</p>
                <p className="text-sm text-cyan-100/55">{card.label}</p>
              </div>
            </div>
          </NeonCard>
        );
      })}
    </div>
  );
}

function TokenBadge({ symbol, accent }: { symbol: string; accent: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`grid h-9 w-9 place-items-center rounded-xl text-xs font-black ${accent}`}
      >
        {symbol.slice(0, 2)}
      </span>
      <span className="font-black">{symbol}</span>
    </div>
  );
}

function InputShell({ label, value }: { label: string; value: string }) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/45">
        {label}
      </span>
      <input
        className="mt-1 w-full bg-transparent text-lg font-black text-white outline-none"
        placeholder={value}
      />
    </label>
  );
}
