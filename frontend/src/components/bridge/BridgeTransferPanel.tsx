import { useCallback, useMemo, useState, type FormEvent } from "react";
import { parseUnits, stringToHex } from "viem";
import { useWalletClient } from "wagmi";
import { NeonButton } from "@/components/ui/NeonButton";
import { activeRouteForDirection } from "@/lib/bridgeDeskData";
import {
  BSC_BRIDGE_NATIVE_RECEIVER,
  BSC_VAULT_ADDRESS,
  ION_BSC_TOKEN,
  USDT_BSC_TOKEN,
  bscVaultAbi,
  bscVaultBridgeConfigured,
  erc20Abi,
  type BridgeAsset,
  type BridgeDirection,
} from "@/lib/bridgeContracts";
import { ION_TO_BSC_STEPS, ION_TOTAL_SUPPLY_CAP } from "@/lib/officialBridgeSemantics";
import type { BridgeRoutesPayload } from "@/lib/ionApi";
import { buildIonSendTransactionParams } from "@/wallet/ionSwapTx";
import { useEvmWallet } from "@/wallet/EvmWalletProvider";
import { useIonWallet } from "@/wallet/IonWalletProvider";
import { sendIonWalletTransaction } from "@/wallet/ionSendTransaction";

function toPositiveNumber(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

const selectClassName =
  "mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-base font-bold text-white outline-none";

const segmentedWrapClassName = "rounded-2xl border border-white/10 bg-white/[0.05] p-2";

function SegmentedRoute({
  direction,
  onChange,
}: {
  direction: BridgeDirection;
  onChange: (next: BridgeDirection) => void;
}) {
  return (
    <div className={segmentedWrapClassName} data-testid="bridge-direction">
      <p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/45">Route</p>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { label: "BSC → ION", value: "bsc-ion" },
            { label: "ION → BSC", value: "ion-bsc" },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            className={`rounded-xl px-3 py-2 text-sm font-black transition ${
              direction === option.value
                ? "bg-cyan-300/20 text-cyan-100 shadow-neonCyan"
                : "bg-white/[0.04] text-cyan-100/55 hover:bg-white/[0.08]"
            }`}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function GlassSelect({
  label,
  testId,
  value,
  onChange,
  options,
}: {
  label: string;
  testId: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="glass-surface block rounded-2xl px-4 py-3">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/45">{label}</span>
      <select
        className={selectClassName}
        data-testid={testId}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function GlassInput({
  hint,
  label,
  testId,
  value,
  onChange,
  type = "text",
}: {
  hint: string;
  label: string;
  testId: string;
  value: string;
  onChange: (value: string) => void;
  type?: "number" | "text";
}) {
  return (
    <label className="glass-surface block rounded-2xl px-4 py-3">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/45">{label}</span>
      <input
        className="mt-1 w-full bg-transparent text-lg font-black text-white outline-none"
        data-testid={testId}
        inputMode={type === "number" ? "decimal" : undefined}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
      <span className="mt-1 block text-[0.68rem] font-bold uppercase tracking-[0.16em] text-cyan-100/30">
        {hint}
      </span>
    </label>
  );
}

export type BridgeTransferPanelProps = {
  routesPayload: BridgeRoutesPayload | null;
};

/** Gateway-aware bridge form with optional on-chain BSC vault / ION wallet submission. */
export function BridgeTransferPanel({ routesPayload }: BridgeTransferPanelProps) {
  const evmWallet = useEvmWallet();
  const ionWallet = useIonWallet();
  const { data: walletClient } = useWalletClient();

  const [direction, setDirection] = useState<BridgeDirection>("bsc-ion");
  const [asset, setAsset] = useState<BridgeAsset>("usdt");
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [stagedOffline, setStagedOffline] = useState(false);

  const validation = useMemo(() => {
    const parsedAmount = toPositiveNumber(amount);
    const dest = destination.trim();
    const destinationValid = dest.length >= 8;
    return {
      destinationValid,
      isValid: parsedAmount !== null && destinationValid,
      parsedAmount,
    };
  }, [amount, destination]);

  const activeRoute = useMemo(() => {
    if (!routesPayload) {
      return null;
    }
    return activeRouteForDirection(routesPayload, direction);
  }, [direction, routesPayload]);

  const resetTxState = useCallback(() => {
    setTxHash(null);
    setFormError(null);
    setStagedOffline(false);
  }, []);

  const submitBridge = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!validation.isValid || validation.parsedAmount === null) {
        return;
      }

      setSubmitting(true);
      setFormError(null);
      setTxHash(null);
      setStagedOffline(false);

      try {
        if (direction === "bsc-ion") {
          if (evmWallet.status !== "connected" || !evmWallet.snapshot?.address) {
            setStagedOffline(true);
            return;
          }
          if (!bscVaultBridgeConfigured() || !evmWallet.publicClient || !walletClient) {
            setStagedOffline(true);
            return;
          }

          const account = evmWallet.snapshot.address as `0x${string}`;
          const destMemo = destination.trim();

          if (asset === "bnb") {
            if (!BSC_BRIDGE_NATIVE_RECEIVER) {
              throw new Error("Set VITE_BSC_BRIDGE_NATIVE_RECEIVER for native BNB bridge deposits.");
            }
            const hash = await walletClient.sendTransaction({
              account,
              to: BSC_BRIDGE_NATIVE_RECEIVER,
              value: parseUnits(String(validation.parsedAmount), 18),
              data: stringToHex(`ION-BRIDGE:${destMemo}`),
            });
            setTxHash(hash);
            return;
          }

          const token = asset === "usdt" ? USDT_BSC_TOKEN : ION_BSC_TOKEN;
          const decimals = await evmWallet.publicClient.readContract({
            address: token,
            abi: erc20Abi,
            functionName: "decimals",
          });
          const rawAmount = parseUnits(String(validation.parsedAmount), decimals);

          const allowance = await evmWallet.publicClient.readContract({
            address: token,
            abi: erc20Abi,
            functionName: "allowance",
            args: [account, BSC_VAULT_ADDRESS!],
          });

          if (allowance < rawAmount) {
            const approveHash = await walletClient.writeContract({
              account,
              address: token,
              abi: erc20Abi,
              functionName: "approve",
              args: [BSC_VAULT_ADDRESS!, rawAmount],
            });
            await evmWallet.publicClient.waitForTransactionReceipt({ hash: approveHash });
          }

          const depositHash = await walletClient.writeContract({
            account,
            address: BSC_VAULT_ADDRESS!,
            abi: bscVaultAbi,
            functionName: "deposit",
            args: [token, rawAmount],
          });
          setTxHash(depositHash);
          return;
        }

        if (ionWallet.status !== "connected" || !ionWallet.snapshot) {
          setStagedOffline(true);
          return;
        }

        const built = buildIonSendTransactionParams({
          fromAddress: ionWallet.snapshot.address,
          amountNano: String(Math.round(validation.parsedAmount * 1e9)),
          comment: `BRIDGE:ION->BSC:${destination.trim()}`,
        });
        const result = await sendIonWalletTransaction(ionWallet.snapshot.kind, {
          fromAddress: ionWallet.snapshot.address,
          amountNano: built.value,
          comment: `BRIDGE:ION->BSC:${destination.trim()}`,
        });
        setTxHash(result.proof);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Bridge transaction failed.";
        setFormError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [
      asset,
      destination,
      direction,
      evmWallet.publicClient,
      evmWallet.snapshot,
      evmWallet.status,
      ionWallet.snapshot,
      ionWallet.status,
      validation.isValid,
      validation.parsedAmount,
      walletClient,
    ],
  );

  const amountHint =
    direction === "bsc-ion"
      ? asset === "usdt"
        ? "USDT on BSC"
        : asset === "bnb"
          ? "Native BNB"
          : "ION on BSC"
      : "ION on ION Chain";

  return (
    <form className="grid gap-4" data-testid="bridge-form" onSubmit={submitBridge}>
      <div className="grid gap-3 md:grid-cols-2">
        <SegmentedRoute
          direction={direction}
          onChange={(next) => {
            setDirection(next);
            resetTxState();
          }}
        />
        <GlassSelect
          label="Asset"
          onChange={(value) => {
            setAsset(value as BridgeAsset);
            resetTxState();
          }}
          options={[
            { label: "USDT (BSC)", value: "usdt" },
            { label: "BNB (BSC)", value: "bnb" },
            { label: "ION", value: "ion" },
          ]}
          testId="bridge-asset"
          value={asset}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <GlassInput
          hint={amountHint}
          label="Amount"
          onChange={(value) => {
            setAmount(value);
            resetTxState();
          }}
          testId="bridge-amount"
          type="number"
          value={amount}
        />
        <GlassInput
          hint="EQ… or 0x… destination"
          label="Destination address / memo"
          onChange={(value) => {
            setDestination(value);
            resetTxState();
          }}
          testId="bridge-destination"
          value={destination}
        />
      </div>

      {!validation.destinationValid && destination.trim().length > 0 ? (
        <p
          className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100"
          data-testid="bridge-error"
        >
          Destination must be at least 8 characters.
        </p>
      ) : null}

      {formError ? (
        <p
          className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100"
          data-testid="bridge-submit-error"
        >
          {formError}
        </p>
      ) : null}

      <div
        className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-4 text-sm text-cyan-100/75"
        data-testid="bridge-preview"
      >
        {validation.isValid ? (
          <span>
            Bridge preview: {direction === "bsc-ion" ? "BSC → ION Chain" : "ION Chain → BSC"} ·{" "}
            {asset.toUpperCase()} {validation.parsedAmount?.toLocaleString()} · destination{" "}
            {destination.trim().slice(0, 12)}
            …
            {activeRoute
              ? ` · ${activeRoute.minAmountIon}–${activeRoute.maxAmountIon} ION · ~${activeRoute.estimatedMinutes} min`
              : ""}
            {direction === "ion-bsc"
              ? ` · fixed ${ION_TOTAL_SUPPLY_CAP} ION supply · claim on BSC follows official Bridge mint`
              : bscVaultBridgeConfigured()
                ? " · BSC vault configured for gated BSC→ION experiments"
                : " · set VITE_BSC_VAULT_ADDRESS for gated BSC→ION vault deposits"}
          </span>
        ) : (
          <span>Enter a positive amount and a valid destination to continue.</span>
        )}
      </div>

      {direction === "ion-bsc" ? (
        <div
          className="rounded-2xl border border-violet-300/20 bg-violet-400/[0.06] px-4 py-3 text-sm text-violet-100/85"
          data-testid="bridge-official-flow"
        >
          <p className="font-bold text-violet-100">Official ION → BSC (no wION)</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-violet-100/75">
            {ION_TO_BSC_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-violet-100/55">
            Submit below starts step 1 on ION Chain only. BSC receipt uses ice-swap Bridge oracle mint, not a BSC burn of
            a wrapped token.
          </p>
        </div>
      ) : null}

      <NeonButton
        className="w-full sm:w-fit"
        data-testid="bridge-submit"
        disabled={!validation.isValid || submitting}
        type="submit"
      >
        {submitting
          ? "Submitting…"
          : direction === "ion-bsc"
            ? "Confirm on ION Chain"
            : "Submit Bridge Transfer"}
      </NeonButton>

      {txHash ? (
        <p
          className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100 break-all"
          data-testid="bridge-confirmation"
        >
          Bridge transaction submitted. Proof: {txHash}
        </p>
      ) : null}

      {stagedOffline && !txHash ? (
        <p
          className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100"
          data-testid="bridge-confirmation"
        >
          Bridge transfer review ready for relayer quorum and wallet proofs. Connect BSC or ION wallet to
          submit on-chain, or configure vault env vars for contract calls.
        </p>
      ) : null}
    </form>
  );
}
