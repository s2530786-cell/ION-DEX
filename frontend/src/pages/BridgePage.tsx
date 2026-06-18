import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { parseUnits, stringToHex } from "viem";
import { useWalletClient } from "wagmi";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { AsyncState } from "@/components/ui/AsyncState";
import { SignSummaryDialog } from "@/components/wallet/SignSummaryDialog";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { useI18n } from "@/i18n/I18nProvider";
import { BSC_CHAIN_ID, ION_CHAIN_ID_SCAFFOLD } from "@/lib/integrationConfig";
import type { AssetSignSummary } from "@/wallet/signSummary";
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
  const { isZh } = useI18n();
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
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [pendingSummary, setPendingSummary] = useState<AssetSignSummary | null>(null);
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
        setRoutesError(error instanceof Error ? error.message : isZh ? "跨链路由暂不可用。" : "Bridge routes unavailable.");
        setRoutesPayload(null);
        setRoutesMeta(null);
      })
      .finally(() => setRoutesLoading(false));
    return () => controller.abort();
  }, [isZh]);

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
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!validation.isValid || validation.parsedAmount === null) {
        return;
      }

      setPendingSummary({
        action: isZh ? "跨链转移" : "Bridge transfer",
        token: asset.toUpperCase(),
        amount: String(validation.parsedAmount),
        fee: activeRoute
          ? isZh
            ? `约 ${activeRoute.estimatedMinutes} 分钟中继`
            : `~${activeRoute.estimatedMinutes} min relay`
          : isZh
            ? "中继费用待定"
            : "relayer fee TBD",
        chainId: direction === "bsc-ion" ? BSC_CHAIN_ID : ION_CHAIN_ID_SCAFFOLD,
        destination: destination.trim() || undefined,
      });
      setSummaryOpen(true);
    },
    [activeRoute, asset, destination, direction, isZh, validation.isValid, validation.parsedAmount],
  );

  const executeBridgeAfterSummary = useCallback(
    async () => {
      if (!validation.isValid || validation.parsedAmount === null) {
        return;
      }

      setSubmitting(true);
      setFormError(null);
      setTxHash(null);

      try {
        if (direction === "bsc-ion") {
          if (evmWallet.status !== "connected" || !evmWallet.snapshot?.address) {
            throw new Error(isZh ? "请先连接 BSC 钱包（MetaMask、OKX、Binance Web3 等）。" : "Connect a BSC wallet (MetaMask, OKX, Binance Web3, etc.) first.");
          }
          if (!bridgeContractsConfigured() || !evmWallet.publicClient || !walletClient) {
            throw new Error(
              isZh
                ? "请在 frontend .env 中设置 VITE_BSC_VAULT_ADDRESS 和 VITE_ION_WRAPPER_ADDRESS，以启用链上跨链调用。"
                : "Set VITE_BSC_VAULT_ADDRESS and VITE_ION_WRAPPER_ADDRESS in frontend .env to enable on-chain bridge calls.",
            );
          }

          const account = evmWallet.snapshot.address as `0x${string}`;
          const destMemo = destination.trim();

          if (asset === "bnb") {
            if (!BSC_BRIDGE_NATIVE_RECEIVER) {
              throw new Error(isZh ? "原生 BNB 跨链充值需要设置 VITE_BSC_BRIDGE_NATIVE_RECEIVER。" : "Set VITE_BSC_BRIDGE_NATIVE_RECEIVER for native BNB bridge deposits.");
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
          throw new Error(isZh ? "ION Chain → BSC 转移需要先连接 ION 钱包。" : "Connect an ION wallet for ION Chain to BSC transfers.");
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
        const message = error instanceof Error ? error.message : isZh ? "跨链交易失败。" : "Bridge transaction failed.";
        setFormError(message);
      } finally {
        setSubmitting(false);
        setSummaryOpen(false);
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
      isZh,
    ],
  );

  return (
    <div className="grid gap-6" data-testid="page-bridge">
      <SignSummaryDialog
        busy={submitting}
        onCancel={() => setSummaryOpen(false)}
        onConfirm={() => void executeBridgeAfterSummary()}
        open={summaryOpen}
        summary={pendingSummary}
      />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200/55">{isZh ? "跨链" : "Cross-chain"}</p>
          <h1 className="mt-2 text-3xl font-black text-white" data-testid="page-title">
            {isZh ? "BSC <> ION 跨链桥" : "BSC <> ION bridge"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-cyan-100/60">
            {isZh
              ? "支持 USDT（BSC）和 BNB（BSC）跨到 ION（ION Chain），也支持通过金库充值、wION 销毁或原生 ION 转账从 ION 回到 BSC。"
              : "USDT (BSC) and BNB (BSC) to ION (ION Chain), and ION back to BSC via vault deposit, wION burn, or native ION transfer."}
          </p>
        </div>
        <DataSourceBadge meta={routesMeta} testId="bridge-metrics-source" />
      </header>

      <AsyncState
        error={routesError}
        state={routesLoading ? "loading" : routesError ? "error" : "ready"}
        testId="bridge-routes"
      >
        {routesPayload ? (
          <NeonCard className="p-4">
            <p className="text-sm text-cyan-100/70">
              {isZh ? "中继器" : "Relayer"}: {routesPayload.relayerStatus} · {isZh ? "验证阈值" : "Verifier threshold"}: {routesPayload.verifier.threshold} · {isZh ? "重放保护" : "Replay guard"}: {routesPayload.verifier.replayProtection ? (isZh ? "开启" : "on") : isZh ? "关闭" : "off"}
            </p>
            {activeRoute ? (
              <p className="mt-2 text-xs text-cyan-100/50">
                {isZh
                  ? `当前路线 ${activeRoute.routeId}：${activeRoute.minAmountIon}–${activeRoute.maxAmountIon} ION · 约 ${activeRoute.estimatedMinutes} 分钟 · ${activeRoute.confirmationsRequired} 次确认`
                  : `Active route ${activeRoute.routeId}: ${activeRoute.minAmountIon}–${activeRoute.maxAmountIon} ION · ~${activeRoute.estimatedMinutes} min · ${activeRoute.confirmationsRequired} confirmations`}
              </p>
            ) : null}
          </NeonCard>
        ) : null}
      </AsyncState>

      <NeonCard className="p-6">
        <form className="grid gap-4" data-testid="bridge-form" onSubmit={(event) => submitBridge(event)}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-bold text-cyan-100/70">{isZh ? "路线" : "Route"}</span>
              <select
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white"
                data-testid="bridge-direction"
                onChange={(event) => {
                  setDirection(event.target.value as BridgeDirection);
                  setTxHash(null);
                }}
                value={direction}
              >
                <option value="bsc-ion">{isZh ? "BSC → ION 链" : "BSC → ION Chain"}</option>
                <option value="ion-bsc">{isZh ? "ION 链 → BSC" : "ION Chain → BSC"}</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-bold text-cyan-100/70">{isZh ? "资产" : "Asset"}</span>
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
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-bold text-cyan-100/70">{isZh ? "数量" : "Amount"}</span>
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
              <span className="font-bold text-cyan-100/70">{isZh ? "目标地址 / 备注" : "Destination address / memo"}</span>
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
          </div>

          {!validation.destinationValid && destination.trim().length > 0 ? (
            <p
              className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100"
              data-testid="bridge-error"
            >
              {isZh ? "目标地址或备注至少需要 8 个字符。" : "Destination must be at least 8 characters."}
            </p>
          ) : null}

          {formError ? (
            <p className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.08] px-4 py-3 text-sm text-rose-100">
              {formError}
            </p>
          ) : null}

          <div
            className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-4 text-sm text-cyan-100/75"
            data-testid="bridge-preview"
          >
            {validation.isValid ? (
              <span>
                {isZh
                  ? `跨链预览：${direction === "bsc-ion" ? "BSC → ION Chain" : "ION Chain → BSC"} · ${asset.toUpperCase()} ${validation.parsedAmount?.toLocaleString()} · 目标 ${destination.trim().slice(0, 12)}…${bridgeContractsConfigured() ? " · 已配置链上金库 / 包装器" : " · 需配置 VITE_BSC_VAULT_ADDRESS / VITE_ION_WRAPPER_ADDRESS 才能调用合约"}`
                  : `Bridge preview: ${direction === "bsc-ion" ? "BSC → ION Chain" : "ION Chain → BSC"} · ${asset.toUpperCase()} ${validation.parsedAmount?.toLocaleString()} · destination ${destination.trim().slice(0, 12)}…${bridgeContractsConfigured() ? " · on-chain vault/wrapper configured" : " · configure VITE_BSC_VAULT_ADDRESS / VITE_ION_WRAPPER_ADDRESS for contract calls"}`}
              </span>
            ) : (
              <span>{isZh ? "请输入有效数量和目标地址后继续。" : "Enter a positive amount and a valid destination to continue."}</span>
            )}
          </div>

          <NeonButton
            className="w-full sm:w-fit"
            data-testid="bridge-submit"
            disabled={!validation.isValid || submitting}
            type="submit"
          >
            {submitting ? (isZh ? "提交中…" : "Submitting…") : isZh ? "提交跨链转移" : "Submit Bridge Transfer"}
          </NeonButton>

          {txHash ? (
            <p
              className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-3 text-sm font-bold text-emerald-100 break-all"
              data-testid="bridge-confirmation"
            >
              {isZh ? `跨链交易已提交。凭证：${txHash}` : `Bridge transaction submitted. Proof: ${txHash}`}
            </p>
          ) : null}
        </form>
      </NeonCard>
    </div>
  );
}
