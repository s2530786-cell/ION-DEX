import { useCallback, useMemo, useState } from "react";
import { useIonWallet } from "@/context/IonWalletContext";
import { useEvmWallet } from "@/context/EvmWalletContext";
import { useApiResource } from "@/hooks/useApiResource";
import { useI18n } from "@/i18n/I18nProvider";
import { AsyncState } from "@/components/ui/AsyncState";
import { NeonCard } from "@/components/ui/NeonCard";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { fetchStakingSummary, type StakingSummary } from "@/lib/ionApi";

type PortfolioPageProps = Record<string, never>;

const fallbackStaking: StakingSummary = {
  totalStakedIon: "0",
  officialStakedIon: "0",
  dexStakedIon: "0",
  lpStakedUsd: "0",
  apr: { officialPct: 0, dexPct: 0, lpMiningPct: 0 },
};

export function PortfolioPage(_props: PortfolioPageProps) {
  const { isZh } = useI18n();
  const ionWallet = useIonWallet();
  const evmWallet = useEvmWallet();
  const ionConnected = ionWallet.status === "connected";
  const evmConnected = evmWallet.status === "connected";
  const ionAddress = ionWallet.snapshot?.address ?? null;
  const evmAddress = evmWallet.snapshot?.address ?? null;
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const fetchStaking = useCallback(
    (signal: AbortSignal) => fetchStakingSummary(signal),
    [],
  );
  const staking = useApiResource(fetchStaking, fallbackStaking);

  const connected = ionConnected || evmConnected;

  const stats = useMemo(() => {
    const totalStaked = Number(staking.data.totalStakedIon);
    const dexStaked = Number(staking.data.dexStakedIon);
    const officialStaked = Number(staking.data.officialStakedIon);
    return {
      totalStaked: Number.isFinite(totalStaked) ? totalStaked : 0,
      dexStaked: Number.isFinite(dexStaked) ? dexStaked : 0,
      officialStaked: Number.isFinite(officialStaked) ? officialStaked : 0,
      lpApr: staking.data.apr.lpMiningPct,
      dexApr: staking.data.apr.dexPct,
      officialApr: staking.data.apr.officialPct,
    };
  }, [staking.data]);

  const formatIon = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M ION`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K ION`;
    return `${n.toLocaleString()} ION`;
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-5" data-testid="page-portfolio">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-100/45">
            {isZh ? "Portfolio" : "Portfolio"}
          </p>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">
            {isZh ? "My Assets" : "My Assets"}
          </h1>
        </div>
        {connected ? (
          <p className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-300">
            {isZh ? "Connected" : "Connected"}
          </p>
        ) : (
          <p className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs text-amber-300">
            {isZh ? "Not Connected" : "Not Connected"}
          </p>
        )}
      </div>

      {/* Wallet addresses */}
      {connected ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ionConnected && ionAddress ? (
            <NeonCard density="compact" variant="cyan">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/55">ION {isZh ? "Wallet" : "Wallet"}</p>
              <p className="mt-1 font-mono text-sm text-cyan-100 break-all">{ionAddress}</p>
            </NeonCard>
          ) : null}
          {evmConnected && evmAddress ? (
            <NeonCard density="compact" variant="magenta">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/55">EVM {isZh ? "Wallet" : "Wallet"}</p>
              <p className="mt-1 font-mono text-sm text-fuchsia-200 break-all">{evmAddress}</p>
            </NeonCard>
          ) : null}
        </div>
      ) : null}

      {/* Staking overview */}
      <section>
        <p className="mb-3 text-xs uppercase tracking-[0.28em] text-cyan-100/45">
          {isZh ? "Staking Overview" : "Staking Overview"}
        </p>
        <DataSourceBadge meta={staking.meta} testId="portfolio-staking-source" />
        <AsyncState
          error={staking.error}
          onRetry={staking.reload}
          state={staking.state}
          testId="portfolio-staking"
        >
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              color="cyan"
              hovered={hoveredCard === "total"}
              label={isZh ? "Total Staked" : "Total Staked"}
              onHover={setHoveredCard}
              testId="portfolio-total-staked"
              value={formatIon(stats.totalStaked)}
            />
            <StatCard
              color="magenta"
              hovered={hoveredCard === "dex"}
              label={isZh ? "DEX Staking" : "DEX Staking"}
              onHover={setHoveredCard}
              sub={`APR ${stats.dexApr}%`}
              testId="portfolio-dex-staked"
              value={formatIon(stats.dexStaked)}
            />
            <StatCard
              color="gold"
              hovered={hoveredCard === "official"}
              label={isZh ? "Official Staking" : "Official Staking"}
              onHover={setHoveredCard}
              sub={`APR ${stats.officialApr}%`}
              testId="portfolio-official-staked"
              value={formatIon(stats.officialStaked)}
            />
          </div>
        </AsyncState>
      </section>

      {/* LP mining */}
      <section>
        <p className="mb-3 text-xs uppercase tracking-[0.28em] text-cyan-100/45">
          {isZh ? "LP Mining" : "LP Mining"}
        </p>
        <NeonCard density="compact" variant="mixed">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cyan-100/80">{isZh ? "Current APR" : "Current APR"}</p>
              <p className="mt-1 text-3xl font-black text-glow-cyan">{stats.lpApr}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-cyan-100/60">{isZh ? "LP Staked Total" : "LP Staked Total"}</p>
              <p className="mt-1 text-xl font-bold text-white">
                ${Number(staking.data.lpStakedUsd).toLocaleString()}
              </p>
            </div>
          </div>
        </NeonCard>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
  hovered,
  onHover,
  testId,
}: {
  label: string;
  value: string;
  sub?: string;
  color: "cyan" | "magenta" | "gold";
  hovered: boolean;
  onHover: (id: string | null) => void;
  testId: string;
}) {
  const colorMap = {
    cyan: { glow: "text-glow-cyan", border: "var(--ion-cyan)" },
    magenta: { glow: "text-glow-magenta", border: "var(--ion-magenta)" },
    gold: { glow: "", border: "var(--ion-gold)" },
  };
  const c = colorMap[color];

  return (
    <div
      onMouseEnter={() => onHover(testId)}
      onMouseLeave={() => onHover(null)}
      style={{
        borderRadius: "1.75rem",
        border: "1px solid",
        borderColor: hovered ? c.border : "transparent",
        transition: "border-color 0.2s ease",
      }}
    >
      <NeonCard density="compact" variant={color}>
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/55">{label}</p>
        <p className={`mt-1 text-2xl font-black ${c.glow}`} data-testid={testId}>
          {value}
        </p>
        {sub ? <p className="mt-1 text-[0.7rem] text-emerald-300">{sub}</p> : null}
      </NeonCard>
    </div>
  );
}
