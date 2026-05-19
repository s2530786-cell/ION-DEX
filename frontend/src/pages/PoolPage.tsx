import { useMemo, useState, type FormEvent } from "react";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { AsyncState } from "@/components/ui/AsyncState";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { useApiResource } from "@/hooks/useApiResource";
import { fetchStakingSummary, type StakingSummary } from "@/lib/ionApi";

type PoolRow = {
  id: string;
  pair: string;
  tvlUsd: number;
  volume24hUsd: number;
  aprPct: number;
};

const mockPools: PoolRow[] = [
  { id: "bnb-ion", pair: "BNB / ION", tvlUsd: 1_240_000, volume24hUsd: 182_000, aprPct: 31.8 },
  { id: "ion-usdt", pair: "ION / USDT", tvlUsd: 640_000, volume24hUsd: 96_500, aprPct: 22.4 },
];

const fallbackStaking: StakingSummary = {
  totalStakedIon: "452000000",
  officialStakedIon: "398000000",
  dexStakedIon: "54000000",
  lpStakedUsd: "12800000",
  apr: { officialPct: 18.2, dexPct: 25.5, lpMiningPct: 31.8 },
};

export function PoolPage() {
  const staking = useApiResource(
    (signal) => fetchStakingSummary(signal),
    fallbackStaking,
  );
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [selectedPool, setSelectedPool] = useState(mockPools[0]?.id ?? "");
  const [bnbAmount, setBnbAmount] = useState("");
  const [ionAmount, setIonAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [submitted, setSubmitted] = useState(false);

  const pool = mockPools.find((row) => row.id === selectedPool) ?? mockPools[0];

  const validation = useMemo(() => {
    const parsedBnb = Number(bnbAmount);
    const parsedIon = Number(ionAmount);
    const parsedSlippage = Number(slippage);
    const amountsValid =
      Number.isFinite(parsedBnb) &&
      Number.isFinite(parsedIon) &&
      parsedBnb > 0 &&
      parsedIon > 0;
    const slippageValid =
      Number.isFinite(parsedSlippage) && parsedSlippage >= 0.1 && parsedSlippage <= 5;
    const yieldIon =
      amountsValid && pool
        ? ((parsedBnb * 642.2 + parsedIon * 6.02) * (pool.aprPct / 100)) / 365
        : null;

    return { amountsValid, slippageValid, isValid: amountsValid && slippageValid, yieldIon };
  }, [bnbAmount, ionAmount, pool, slippage]);

  function submitPool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validation.isValid) {
      setSubmitted(true);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_22rem]" data-testid="page-pool">
      <NeonCard variant="mixed" className="min-h-[31rem]">
        <p className="text-sm uppercase tracking-[0.36em] text-cyan-200/70">Liquidity</p>
        <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl" data-testid="page-title">
          ION liquidity pools
        </h1>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm" data-testid="pool-list">
            <thead className="bg-white/[0.04] text-cyan-100/55">
              <tr>
                <th className="px-4 py-3">Pool</th>
                <th className="px-4 py-3">TVL</th>
                <th className="px-4 py-3">24h Vol</th>
                <th className="px-4 py-3">APR</th>
              </tr>
            </thead>
            <tbody>
              {mockPools.map((row) => (
                <tr
                  className={`border-t border-white/10 ${
                    row.id === selectedPool ? "bg-cyan-300/[0.08]" : ""
                  }`}
                  key={row.id}
                >
                  <td className="px-4 py-3 font-bold">
                    <button
                      className="text-left"
                      data-testid={`pool-row-${row.id}`}
                      onClick={() => {
                        setSelectedPool(row.id);
                        setSubmitted(false);
                      }}
                      type="button"
                    >
                      {row.pair}
                    </button>
                  </td>
                  <td className="px-4 py-3">${row.tvlUsd.toLocaleString()}</td>
                  <td className="px-4 py-3">${row.volume24hUsd.toLocaleString()}</td>
                  <td className="px-4 py-3">{row.aprPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form className="mt-6 grid gap-4" data-testid="pool-form" onSubmit={submitPool}>
          <div className="flex flex-wrap gap-2">
            {(["add", "remove"] as const).map((value) => (
              <button
                className={`rounded-full px-4 py-2 text-xs font-black ${
                  mode === value ? "bg-white/15 text-white" : "text-cyan-100/60"
                }`}
                data-testid={`pool-mode-${value}`}
                key={value}
                onClick={() => {
                  setMode(value);
                  setSubmitted(false);
                }}
                type="button"
              >
                {value === "add" ? "Add LP" : "Remove LP"}
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <PoolField label="BNB" testId="pool-bnb" value={bnbAmount} onChange={setBnbAmount} />
            <PoolField label="ION" testId="pool-ion" value={ionAmount} onChange={setIonAmount} />
            <PoolField label="Slippage %" testId="pool-slippage" value={slippage} onChange={setSlippage} />
          </div>

          {!validation.slippageValid ? (
            <p className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100" data-testid="pool-error">
              Slippage must stay between 0.1% and 5%.
            </p>
          ) : null}

          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-4 text-sm text-cyan-100/75" data-testid="pool-preview">
            {validation.isValid && pool ? (
              <span>
                {mode === "add" ? "Add" : "Remove"} liquidity on {pool.pair}: {bnbAmount} BNB +{" "}
                {ionAmount} ION · est. daily yield ~{validation.yieldIon?.toFixed(2)} USD · slip{" "}
                {slippage}%
              </span>
            ) : (
              <span>Select a pool and enter paired amounts to preview LP mint/burn parameters.</span>
            )}
          </div>

          <NeonButton className="w-full sm:w-fit" data-testid="pool-submit" disabled={!validation.isValid} type="submit">
            {mode === "add" ? "Add Liquidity" : "Remove Liquidity"}
          </NeonButton>

          {submitted ? (
            <p className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100" data-testid="pool-confirmation">
              Liquidity draft ready for wallet signing.
            </p>
          ) : null}
        </form>
      </NeonCard>

      <NeonCard variant="cyan">
        <DataSourceBadge meta={staking.meta} testId="stake-metrics-source" />
        <AsyncState error={staking.error} onRetry={staking.reload} state={staking.state} testId="pool-yield">
          <p className="text-sm text-cyan-100/55">LP mining APR</p>
          <p className="mt-2 text-3xl font-black">{staking.data.apr.lpMiningPct}%</p>
          <p className="mt-2 text-xs text-cyan-100/60">TVL reference ${Number(staking.data.lpStakedUsd).toLocaleString()}</p>
        </AsyncState>
      </NeonCard>
    </div>
  );
}

function PoolField({
  label,
  testId,
  value,
  onChange,
}: {
  label: string;
  testId: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/45">{label}</span>
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
