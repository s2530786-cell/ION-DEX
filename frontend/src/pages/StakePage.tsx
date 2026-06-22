import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { AsyncState } from "@/components/ui/AsyncState";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { useApiResource } from "@/hooks/useApiResource";
import { useI18n } from "@/i18n/I18nProvider";
import { fetchStakingSummary, type StakingSummary } from "@/lib/ionApi";

const UNLOCK_SECONDS = 7 * 24 * 60 * 60;

const fallbackStaking: StakingSummary = {
  totalStakedIon: "452000000",
  officialStakedIon: "398000000",
  dexStakedIon: "54000000",
  lpStakedUsd: "12800000",
  apr: { officialPct: 18.2, dexPct: 25.5, lpMiningPct: 31.8 },
};

function formatCountdown(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

export function StakePage() {
  const { isZh } = useI18n();
  const fetchStaking = useCallback((signal: AbortSignal) => fetchStakingSummary(signal), []);
  const staking = useApiResource(fetchStaking, fallbackStaking);

  const [mode, setMode] = useState<"stake" | "unstake">("stake");
  const [amount, setAmount] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [unlockLeft, setUnlockLeft] = useState(UNLOCK_SECONDS);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setUnlockLeft((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

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

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_22rem]" data-testid="page-stake">
      <NeonCard variant="mixed" className="min-h-[31rem]">
        <p className="text-sm uppercase tracking-[0.36em] text-cyan-200/70">{isZh ? "收益" : "Yield"}</p>
        <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl" data-testid="page-title">
          {isZh ? "DEX 质押中心" : "DEX staking hub"}
        </h1>

        <DataSourceBadge meta={staking.meta} testId="stake-metrics-source" />

        <AsyncState
          error={staking.error}
          onRetry={staking.reload}
          state={staking.state}
          testId="stake-metrics"
        >
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Metric label={isZh ? "DEX 年化" : "DEX APR"} value={`${staking.data.apr.dexPct}%`} />
            <Metric label={isZh ? "官方质押" : "Official stake"} value={`${Number(staking.data.officialStakedIon).toLocaleString()} ION`} />
            <Metric label={isZh ? "DEX 质押" : "DEX stake"} value={`${Number(staking.data.dexStakedIon).toLocaleString()} ION`} />
          </div>
        </AsyncState>

        <form className="mt-8 grid gap-4" data-testid="stake-form" onSubmit={submitStake}>
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
              {isZh ? "质押 ION" : "Stake ION"}
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
              {isZh ? "解除质押 ION" : "Unstake ION"}
            </button>
          </div>

          <label className="block rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/45">
              {isZh ? "数量 ION" : "Amount ION"}
            </span>
            <input
              className="mt-1 w-full bg-transparent text-lg font-black text-white outline-none"
              data-testid="stake-amount"
              inputMode="decimal"
              onChange={(event) => {
                setAmount(event.target.value);
                setSubmitted(false);
              }}
              value={amount}
            />
          </label>

          <div
            className="rounded-2xl border border-amber-300/25 bg-amber-300/[0.06] p-4 text-sm text-amber-100/85"
            data-testid="stake-preview"
          >
            {validation.isValid ? (
              <span>
                {isZh
                  ? `${mode === "stake" ? "质押" : "解除质押"}预览：${amount} ION · 当前 DEX APR ${staking.data.apr.dexPct}% · 解锁队列 ${formatCountdown(unlockLeft)}`
                  : `${mode === "stake" ? "Stake" : "Unstake"} preview: ${amount} ION · advertised DEX APR ${staking.data.apr.dexPct}% · unlock queue ${formatCountdown(unlockLeft)}`}
              </span>
            ) : (
              <span>{isZh ? "输入数量以预览质押载荷和解锁时间。" : "Enter an amount to preview staking payloads and unlock timing."}</span>
            )}
          </div>

          <NeonButton
            className="w-full sm:w-fit"
            data-testid="stake-submit"
            disabled={!validation.isValid}
            type="submit"
          >
            {mode === "stake" ? (isZh ? "质押 ION" : "Stake ION") : isZh ? "解除质押 ION" : "Unstake ION"}
          </NeonButton>

          {submitted ? (
            <p
              className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100"
              data-testid="stake-confirmation"
            >
              {mode === "stake"
                ? isZh
                  ? "质押操作已准备好进入钱包签名。"
                  : "Stake review ready for wallet signing."
                : isZh
                  ? "解除质押操作已准备好进入钱包签名。"
                  : "Unstake review ready for wallet signing."}
            </p>
          ) : null}
        </form>
      </NeonCard>

      <NeonCard variant="cyan">
        <p className="text-sm text-cyan-100/55">{isZh ? "解锁倒计时" : "Unlock countdown"}</p>
        <p className="mt-2 text-3xl font-black" data-testid="stake-unlock-countdown">
          {formatCountdown(unlockLeft)}
        </p>
        <p className="mt-2 text-xs text-cyan-100/60">
          {isZh ? "用于测试网质押中心体验的演练解除质押冷却时间。" : "Rehearsal unstake cooldown for testnet staking hub UX."}
        </p>
      </NeonCard>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/45">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}
