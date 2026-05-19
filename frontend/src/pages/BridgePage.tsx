import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { parseUnits } from "viem";
import { useWalletClient } from "wagmi";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { AsyncState } from "@/components/ui/AsyncState";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { useEvmWallet } from "@/wallet/EvmWalletProvider";
import { useIonWallet } from "@/wallet/IonWalletProvider";
import {
  fetchBridgeRoutes,
  type ApiMeta,
  type BridgeRoutesPayload,
} from "@/lib/ionApi";
import {
  BSC_BRIDGE_NATIVE_RECEIVER,
  BSC_VAULT_ADDRESS,
  ION_BSC_TOKEN,
  ION_WRAPPER_ADDRESS,
  USDT_BSC_TOKEN,
  bscVaultAbi,
  bridgeContractsConfigured,
  erc20Abi,
  ionWrapperAbi,
  randomBridgeTxHash,
  type BridgeAsset,
  type BridgeDirection,
} from "@/lib/bridgeContracts";
import { buildIonSendTransactionParams } from "@/wallet/ionSwapTx";
import { sendIonWalletTransaction } from "@/wallet/ionSendTransaction";

function toPositiveNumber(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function BridgePage() {
  const evmWallet = useEvmWallet();
  const ionWallet = useIonWallet();
  const { data: walletClient } = useWalletClient();

  const [routesPayload, setRoutesPayload] = useState<BridgeRoutesPayload | null>(null);
  const [routesMeta, setRoutesMeta] = useState<ApiMeta | null>(null);
  const [routesError, setRoutesError] = useState<string | null>(null);
  const [routesLoading, setRoutesLoading] = useState(true);

  const [direction, setDirection] = useState<BridgeDirection>("bsc-ion");
  const [asset, setAsset] = useState<BridgeAsset>("usdt");
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setRoutesLoading(true);
    fetchBridgeRoutes(controller.signal)
      .then((response) => {
        setRoutesPayload(response.data);
        setRoutesMeta(response.meta);
        setRoutesError(null);
      })
      .catch((error: unknown) => {
        setRoutesError(error instanceof Error ? error.message : "Bridge routes unavailable.");
        setRoutesPayload(null);
        setRoutesMeta(null);
      })
      .finally(() => setRoutesLoading(false));
    return () => controller.abort();
  }, []);

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
    return routesPayload.routes.find(
      (route) =>
        route.fromChain === (direction === "bsc-ion" ? "BSC" : "ION") &&
        route.toChain === (direction === "bsc-ion" ? "ION" : "BSC"),
    );
  }, [direction, routesPayload]);

  const submitBridge = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!validation.isValid || validation.parsedAmount === null) {
        return;
      }

      setSubmitting(true);
      setFormError(null);
      setTxHash(null);

      try {
        if (direction === "bsc-ion") {
          if (evmWallet.status !== "connected" || !evmWallet.snapshot?.address) {
            throw new Error("Connect a BSC wallet (MetaMask, OKX, Binance Web3, etc.) first.");
          }
          if (!bridgeContractsConfigured() || !evmWallet.publicClient || !walletClient) {
            throw new Error(
              "Set VITE_BSC_VAULT_ADDRESS and VITE_ION_WRAPPER_ADDRESS in frontend .env to enable on-chain bridge calls.",
            );
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
              data: `0x${Buffer.from(`ION-BRIDGE:${destMemo}`, "utf8").toString("hex")}` as `0x${string}`,
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
          throw new Error("Connect an ION wallet for ION Chain to BSC transfers.");
        }

        if (
          asset === "ion" &&
          ION_WRAPPER_ADDRESS &&
          evmWallet.publicClient &&
          evmWallet.snapshot &&
          walletClient
        ) {
          const bridgeTxHash = randomBridgeTxHash();
          const account = evmWallet.snapshot.address as `0x${string}`;
          const decimals = await evmWallet.publicClient.readContract({
            address: ION_BSC_TOKEN,
            abi: erc20Abi,
            functionName: "decimals",
          });
          const rawAmount = parseUnits(String(validation.parsedAmount), decimals);
          const hash = await walletClient.writeContract({
            account,
            address: ION_WRAPPER_ADDRESS,
            abi: ionWrapperAbi,
            functionName: "burn",
            args: [rawAmount, bridgeTxHash],
          });
          setTxHash(hash);
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
    ],
  );

  return (
    <div className="grid gap-6" data-testid="page-bridge">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <motion.div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200/55">Cross-chain</p>
          <h1 className="mt-2 text-3xl font-black text-white">BSC &lt;&gt; ION Bridge</h1>
          <p className="mt-2 max-w-2xl text-sm text-cyan-100/60">
            USDT (BSC) and BNB (BSC) to ION (ION Chain), and ION back to BSC via vault deposit, wION burn, or native ION
            transfer.
          </p>
        </motion.div>
        <DataSourceBadge meta={routesMeta} testId="bridge-metrics-source" />
      </header>

      <AsyncState
        empty={false}
        error={routesError}
        loading={routesLoading}
        loadingLabel="Loading bridge routes"
      >
        {routesPayload ? (
          <NeonCard className="p-4">
            <p className="text-sm text-cyan-100/70">
              Relayer: {routesPayload.relayerStatus} · Verifier threshold: {routesPayload.verifier.threshold} · Replay
              guard: {routesPayload.verifier.replayProtection ? "on" : "off"}
            </p>
            {activeRoute ? (
              <p className="mt-2 text-xs text-cyan-100/50">
                Active route {activeRoute.routeId}: {activeRoute.minAmountIon}–{activeRoute.maxAmountIon} ION · ~
                {activeRoute.estimatedMinutes} min · {activeRoute.confirmationsRequired} confirmations
              </p>
            ) : null}
          </NeonCard>
        ) : null}
      </AsyncState>

      <NeonCard className="p-6">
        <form className="grid gap-4" data-testid="bridge-form" onSubmit={submitBridge}>
          <motion.div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-bold text-cyan-100/70">Route</span>
              <select
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white"
                data-testid="bridge-direction"
                onChange={(event) => {
                  setDirection(event.target.value as BridgeDirection);
                  setTxHash(null);
                }}
                value={direction}
              >
                <option value="bsc-ion">BSC → ION Chain</option>
                <option value="ion-bsc">ION Chain → BSC</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-bold text-cyan-100/70">Asset</span>
              <select
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white"
                data-testid="bridge-asset"
                onChange={(event) => {
                  setAsset(event.target.value as BridgeAsset);
                  setTxHash(null);
                }}
                value={asset}
              >
                <option value="usdt">USDT (BSC)</option>
                <option value="bnb">BNB (BSC)</option>
                <option value="ion">ION</option>
              </select>
            </label>
          </motion.div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-bold text-cyan-100/70">Amount</span>
              <input
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white"
                data-testid="bridge-amount"
                inputMode="decimal"
                onChange={(event) => {
                  setAmount(event.target.value);
                  setTxHash(null);
                }}
                placeholder="100"
                type="number"
                value={amount}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-bold text-cyan-100/70">Destination address / memo</span>
              <input
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white"
                data-testid="bridge-destination"
                onChange={(event) => {
                  setDestination(event.target.value);
                  setTxHash(null);
                }}
                placeholder="EQ... or 0x..."
                type="text"
                value={destination}
              />
            </label>
          </motion.div>

          {!validation.destinationValid && destination.trim().length > 0 ? (
            <p
              className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100"
              data-testid="bridge-error"
            >
              Destination must be at least 8 characters.
            </p>
          ) : null}

          {formError ? (
            <p className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100">
              {formError}
            </p>
          ) : null}

          <motion.div
            className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-4 text-sm text-cyan-100/75"
            data-testid="bridge-preview"
          >
            {validation.isValid ? (
              <span>
                Bridge preview: {direction === "bsc-ion" ? "BSC → ION Chain" : "ION Chain → BSC"} · {asset.toUpperCase()}{" "}
                {validation.parsedAmount?.toLocaleString()} · destination {destination.trim().slice(0, 12)}…
                {bridgeContractsConfigured()
                  ? " · on-chain vault/wrapper configured"
                  : " · configure VITE_BSC_VAULT_ADDRESS / VITE_ION_WRAPPER_ADDRESS for contract calls"}
              </span>
            ) : (
              <span>Enter a positive amount and a valid destination to continue.</span>
            )}
          </motion.div>

          <NeonButton
            className="w-full sm:w-fit"
            data-testid="bridge-submit"
            disabled={!validation.isValid || submitting}
            type="submit"
          >
            {submitting ? "Submitting…" : "Submit Bridge Transfer"}
          </NeonButton>

          {txHash ? (
            <p
              className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100 break-all"
              data-testid="bridge-confirmation"
            >
              Bridge transaction submitted. Proof: {txHash}
            </p>
          ) : null}
        </form>
      </NeonCard>
    </div>
  );
}
