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
import { useMemo, useState } from "react";
import type { PageKey } from "@/components/layout/AppShell";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";

type FeatureCard = {
  title: string;
  label: string;
  page: Exclude<PageKey, "swap">;
  icon: typeof Layers3;
  color: "cyan" | "magenta" | "gold";
};

type DashboardPageProps = {
  onNavigate: (page: PageKey) => void;
};

const featureCards: FeatureCard[] = [
  { title: "Pool", label: "Liquidity depth", page: "pool", icon: Layers3, color: "cyan" },
  { title: "Grid", label: "Spot strategies", page: "grid", icon: LayoutGrid, color: "magenta" },
  { title: "Bridge", label: "ION / BSC route", page: "bridge", icon: ArrowLeftRight, color: "cyan" },
  { title: "Burn", label: "Dual-chain supply", page: "burn", icon: Flame, color: "magenta" },
  { title: "ION ID", label: "Identity risk", page: "domain", icon: ShieldCheck, color: "gold" },
  { title: "AI Market", label: "Signals & risk", page: "ai", icon: Bot, color: "cyan" },
];

const depthRows = [
  { label: "ION/USDT", price: "6.024", change: "+8.42%", tone: "text-emerald-300" },
  { label: "BNB/ION", price: "106.68", change: "+1.18%", tone: "text-cyan-200" },
  { label: "ION/BTC", price: "0.0000582", change: "-0.38%", tone: "text-rose-300" },
];

const orderBook = [
  ["6.041", "18,220", "72%"],
  ["6.035", "14,980", "56%"],
  ["6.028", "10,440", "38%"],
  ["6.019", "12,860", "44%"],
  ["6.012", "16,410", "61%"],
] as const;

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-[22rem_1fr_19rem]">
      <SwapPanel />
      <MarketStage />
      <RightStats />
      <div className="xl:col-span-3">
        <FeatureGrid onNavigate={onNavigate} />
      </div>
    </div>
  );
}

function SwapPanel() {
  const [payAmount, setPayAmount] = useState("2.50");
  const [slippage, setSlippage] = useState("0.50");

  const quote = useMemo(() => {
    const amount = Number(payAmount);
    const slip = Number(slippage);
    const isValid = Number.isFinite(amount) && amount > 0 && Number.isFinite(slip) && slip >= 0.1 && slip <= 5;
    const ionOut = isValid ? amount * 106.68 : 0;
    const fee = isValid ? ionOut * 0.0025 : 0;
    const minReceived = isValid ? ionOut * (1 - slip / 100) : 0;
    return {
      fee,
      ionOut,
      isValid,
      minReceived,
      priceImpact: amount > 8 ? "1.18%" : "0.24%",
    };
  }, [payAmount, slippage]);

  return (
    <NeonCard className="depth-stage min-h-[31rem]" variant="magenta">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-fuchsia-200/75">
            swap.ion
          </p>
          <p className="mt-2 text-3xl font-black">ION Chain Swap</p>
          <p className="text-sm text-cyan-100/60">Native route for BNB / ION execution</p>
        </div>
        <ArrowDownUp className="text-cyan-200" />
      </div>

      <div className="flow-border mb-4 flex items-center justify-between rounded-3xl p-px">
        <div className="glass-surface flex w-full items-center justify-between rounded-3xl p-3">
          <TokenBadge symbol="BNB" accent="bg-yellow-300 text-black" />
          <ArrowDownUp className="text-cyan-200/60" size={18} />
          <TokenBadge
            symbol="ION"
            accent="bg-gradient-to-br from-yellow-200 to-amber-500 text-slate-950"
          />
        </div>
      </div>

      <div className="space-y-3">
        <AmountField label="Pay BNB" onChange={setPayAmount} testId="swap-pay" value={payAmount} />
        <Readout
          label="Receive ION"
          value={quote.ionOut.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        />
        <AmountField label="Slippage %" onChange={setSlippage} testId="swap-slippage" value={slippage} />
      </div>

      <div className="mt-5 grid gap-2 rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.05] p-4 text-xs text-cyan-100/75 backdrop-blur-xl">
        <QuoteRow
          label="Minimum received"
          value={`${quote.minReceived.toLocaleString(undefined, { maximumFractionDigits: 2 })} ION`}
        />
        <QuoteRow
          label="Protocol fee"
          value={`${quote.fee.toLocaleString(undefined, { maximumFractionDigits: 2 })} ION`}
        />
        <QuoteRow label="Price impact" value={quote.priceImpact} />
        <QuoteRow label="Execution route" value="ION Chain AMM -> wallet signature" />
      </div>

      <NeonButton className="mt-5 w-full" data-testid="swap-submit" disabled={!quote.isValid} type="button">
        Review ION Swap
      </NeonButton>
    </NeonCard>
  );
}

function MarketStage() {
  return (
    <NeonCard className="depth-stage min-h-[31rem]" variant="cyan">
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.36em] text-cyan-200/70">
              Professional Trading Surface
            </p>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">
              swap.ion <span className="text-glow-magenta text-fuchsia-300">Galaxy</span>
            </h1>
          </div>
          <Sparkles className="text-cyan-200" />
        </div>

        <div className="relative min-h-[22rem] flex-1 overflow-hidden rounded-[1.8rem] border border-cyan-200/20 bg-[#03050f]/70 shadow-[0_35px_90px_rgba(0,0,0,0.42)]">
          <div className="absolute inset-0 aurora-noise opacity-80" />
          <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_20deg,rgba(36,247,255,0.1),rgba(255,59,212,0.28),rgba(141,77,255,0.18),rgba(36,247,255,0.1))] blur-2xl [animation:ionSpinSlow_160s_linear_infinite]" />
          <div className="absolute inset-x-4 top-4 grid grid-cols-1 gap-3 sm:inset-x-8 sm:top-8 sm:grid-cols-3">
            {depthRows.map((row) => (
              <div key={row.label} className="glass-surface rounded-2xl px-4 py-3">
                <p className="text-xs text-cyan-100/55">{row.label}</p>
                <p className="mt-1 text-xl font-black">{row.price}</p>
                <p className={`text-xs font-bold ${row.tone}`}>{row.change}</p>
              </div>
            ))}
          </div>
          <div className="float-3d absolute bottom-8 left-5 right-5 h-48 rounded-[2rem] border border-fuchsia-300/20 bg-slate-950/55 p-5 shadow-[0_28px_80px_rgba(255,59,212,0.18)] backdrop-blur-2xl sm:left-8 sm:right-8">
            <div className="absolute inset-x-8 top-1/2 h-px bg-cyan-200/20" />
            <div className="relative flex h-full items-end gap-2">
              {Array.from({ length: 42 }).map((_, index) => {
                const height = 34 + ((index * 29) % 128);
                const magenta = index % 5 === 0;
                return (
                  <div key={index} className="flex flex-1 items-end justify-center">
                    <div
                      className={`w-full max-w-[0.65rem] rounded-full ${
                        magenta ? "bg-fuchsia-400" : "bg-cyan-300"
                      } shadow-[0_0_16px_currentColor]`}
                      style={{ height }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <p className="absolute bottom-6 left-6 rounded-full border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-2 text-xs font-bold text-emerald-100">
            Route health: liquid / slippage guard active
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
        <p className="text-sm text-cyan-100/55">Native liquidity</p>
        <p className="mt-1 text-3xl font-black">$1,234,567</p>
        <p className="mt-1 text-xs text-emerald-300">+12.8% weekly depth</p>
      </NeonCard>
      <NeonCard variant="magenta">
        <p className="text-sm text-cyan-100/55">Swap protection</p>
        <p className="mt-1 text-3xl font-black">0.24%</p>
        <p className="mt-1 text-xs text-cyan-200">current price impact</p>
      </NeonCard>
      <NeonCard variant="gold">
        <p className="text-sm text-cyan-100/55">Order book</p>
        <div className="mt-3 grid gap-2 text-xs">
          {orderBook.map(([price, size, depth]) => (
            <div key={price} className="relative overflow-hidden rounded-xl bg-white/[0.04] px-3 py-2">
              <span
                className="absolute inset-y-0 right-0 bg-cyan-300/[0.08]"
                style={{ width: depth }}
              />
              <span className="relative flex justify-between gap-3">
                <strong className="text-cyan-100">{price}</strong>
                <span className="text-cyan-100/60">{size}</span>
              </span>
            </div>
          ))}
        </div>
      </NeonCard>
    </div>
  );
}

function FeatureGrid({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {featureCards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.title}
            className="group text-left"
            data-testid={`feature-${card.page}`}
            onClick={() => onNavigate(card.page)}
            type="button"
          >
            <NeonCard variant={card.color} className="min-h-[11rem] transition group-hover:-translate-y-1">
              <div className="flex h-full flex-col justify-between gap-5">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.07] text-cyan-200 shadow-neonCyan">
                  <Icon size={28} />
                </div>
                <div>
                  <p className="text-2xl font-black">{card.title}</p>
                  <p className="text-sm text-cyan-100/55">{card.label}</p>
                </div>
              </div>
            </NeonCard>
          </button>
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

function AmountField({
  label,
  onChange,
  testId,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  testId: string;
  value: string;
}) {
  return (
    <label className="glass-surface block rounded-2xl px-4 py-3">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/45">
        {label}
      </span>
      <input
        className="mt-1 w-full bg-transparent text-lg font-black text-white outline-none"
        data-testid={testId}
        inputMode="decimal"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-surface rounded-2xl px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/45">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function QuoteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className="font-black text-white">{value}</span>
    </div>
  );
}
