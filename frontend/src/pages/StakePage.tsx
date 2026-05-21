import { useCallback, useMemo, useState, type FormEvent } from "react";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { AsyncState } from "@/components/ui/AsyncState";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { useApiResource } from "@/hooks/useApiResource";
import { fetchStakingSummary, type StakingSummary } from "@/lib/ionApi";
import {
  DEX_DRAFT_STAKE_NOTE,
  formatStakingAprLabel,
  OFFICIAL_LIQUID_STAKE_RECEIPT,
  OFFICIAL_LIQUID_STAKE_STEPS,
  OFFICIAL_UNSTAKE_ROUND_HOURS_APPROX,
} from "@/lib/officialStakingSemantics";

const fallbackStaking: StakingSummary = {
  totalStakedIon: "452000000",
  officialStakedIon: "398000000",
  dexStakedIon: "54000000",
  lpStakedUsd: "12800000",
  apr: { officialPct: null, dexPct: null, lpMiningPct: 31.8 },
  officialRewardAsset: "LION",
  officialUnstakeRoundHoursApprox: OFFICIAL_UNSTAKE_ROUND_HOURS_APPROX,
};

export function StakePage() {
  const fetchStaking = useCallback((signal: AbortSignal) => fetchStakingSummary(signal), []);
  const staking = useApiResource(fetchStaking, fallbackStaking);

  const [mode, setMode] = useState<"stake" | "unstake">("stake");
  const [amount, setAmount] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const validation = useMemo(() => {
    const parsed = Number(amount);
    return { isValid: Number.isFinite(parsed) && parsed > 0, parsed };
  }, [amount]);

  function submitStake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validation.isValid) {
      setSubmitted(true);
    }
  }

  const unstakeHours =
    staking.data.officialUnstakeRoundHoursApprox ?? OFFICIAL_UNSTAKE_ROUND_HOURS_APPROX;
  const receipt = staking.data.officialRewardAsset ?? OFFICIAL_LIQUID_STAKE_RECEIPT;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_22rem]" data-testid="page-stake">
      <NeonCard variant="mixed" className="min-h-[31rem]">
        <p className="text-sm uppercase tracking-[0.36em] text-cyan-200/70">Yield</p>
        <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl" data-testid="page-title">
          ION staking hub
        </h1>
        <p className="mt-2 text-sm text-cyan-100/70" data-testid="stake-subtitle">
          Official liquid staking (ION → {receipt}) and DEX draft fee pool — do not mix the two flows.
        </p>

        <DataSourceBadge meta={staking.meta} testId="stake-metrics-source" />

        <AsyncState
          error={staking.error}
          onRetry={staking.reload}
          state={staking.state}
          testId="stake-metrics"
        >
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Metric
              label="Official APR"
              testId="stake-metric-official-apr"
              value={formatStakingAprLabel(staking.data.apr.officialPct, "Dynamic · live TBD")}
            />
            <Metric
              label="Official stake"
              testId="stake-metric-official"
              value={`${Number(staking.data.officialStakedIon).toLocaleString()} ION`}
            />
            <Metric
              label={`Receipt (${receipt})`}
              testId="stake-metric-receipt"
              value={receipt}
            />
          </div>
        </AsyncState>

        <div
          className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4"
          data-testid="stake-official-panel"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100/55">
            Official network staking
          </p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-cyan-100/75">
            {OFFICIAL_LIQUID_STAKE_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>

        <p className="mt-4 text-xs text-amber-100/80" data-testid="stake-dex-draft-note">
          {DEX_DRAFT_STAKE_NOTE}
        </p>

        <form className="mt-6 grid gap-4" data-testid="stake-form" onSubmit={submitStake}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-100/55">
            DEX draft pool (not official LION)
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className={`rounded-full px-4 py-2 text-xs font-black ${mode === "stake" ? "bg-white/15 text-white" : "text-cyan-100/60"}`}
              data-testid="stake-mode-stake"
              onClick={() => {
                setMode("stake");
                setSubmitted(false);
              }}
              type="button"
            >
              Stake ION (draft)
            </button>
            <button
              className={`rounded-full px-4 py-2 text-xs font-black ${mode === "unstake" ? "bg-white/15 text-white" : "text-cyan-100/60"}`}
              data-testid="stake-mode-unstake"
              onClick={() => {
                setMode("unstake");
                setSubmitted(false);
              }}
              type="button"
            >
              Unstake ION (draft)
            </button>
          </div>

          <label className="block rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/45">
              Amount ION
            </span>
            <input
              className="mt-1 w-full bg-transparent text-lg font-black text-white outline-none"
              data-testid="stake-amount"
              inputMode="decimal"
              onChange={(event) => {
                setAmount(event.target.value);
                setSubmitted(false);
              }}
              placeholder="500"
              value={amount}
            />
          </label>

          <div
            className="rounded-2xl border border-amber-300/25 bg-amber-300/[0.06] p-4 text-sm text-amber-100/85"
            data-testid="stake-preview"
          >
            {validation.isValid ? (
              <span>
                DEX draft {mode === "stake" ? "stake" : "unstake"} preview: {amount} ION · APR{" "}
                {formatStakingAprLabel(staking.data.apr.dexPct, "not wired")}. Official unstake ~{unstakeHours}h
                (validation round).
              </span>
            ) : (
              <span>Enter an amount to preview DEX draft staking payloads only.</span>
            )}
          </div>

          <NeonButton
            className="w-full sm:w-fit"
            data-testid="stake-submit"
            disabled={!validation.isValid}
            type="submit"
          >
            {mode === "stake" ? "Stake ION (draft)" : "Unstake ION (draft)"}
          </NeonButton>

          {submitted ? (
            <p
              className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100"
              data-testid="stake-confirmation"
            >
              {mode === "stake"
                ? "DEX draft stake ready for wallet signing — not the official LION deposit."
                : "DEX draft unstake ready — official release follows the ~20h validation round."}
            </p>
          ) : null}
        </form>
      </NeonCard>

      <NeonCard variant="cyan">
        <p className="text-sm text-cyan-100/55">Official unstake timing</p>
        <p className="mt-2 text-3xl font-black" data-testid="stake-unlock-round">
          ~{unstakeHours}h
        </p>
        <p className="mt-2 text-xs text-cyan-100/60">
          Per ice.io / liquid-staking-contract: funds release at the next validation round, not the 7-day mock
          cooldown used in earlier DEX-only drafts.
        </p>
      </NeonCard>
    </div>
  );
}

function Metric({
  label,
  value,
  testId,
}: {
  label: string;
  value: string;
  testId?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4" data-testid={testId}>
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/45">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}
