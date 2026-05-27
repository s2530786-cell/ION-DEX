import { useCallback, useEffect, useMemo, useState } from "react";
import { parseEther } from "viem";
import { bsc } from "wagmi/chains";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { AsyncState } from "@/components/ui/AsyncState";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlassPanel } from "@/components/ui/glass/GlassPanel";
import { MetricTile } from "@/components/ui/glass/MetricTile";
import { useWalletAggregator } from "@/hooks/useWalletAggregator";
import {
  fetchAiSubscriptionPrice,
  fetchAiSubscriptionRights,
  submitAiSubscriptionOrder,
  toggleAiAutoRenewal,
  type AiSubscriptionPeriod,
  type AiSubscriptionPrice,
  type AiSubscriptionRights,
  type AiSubscriptionTierKey,
  type ApiMeta,
} from "@/lib/ionApi";
import {
  resolveAiFeeReceiverAddress,
  resolveAiIonTokenAddress,
} from "@/lib/integrationConfig";

const ERC20_TRANSFER_ABI = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

type TierCatalog = {
  key: AiSubscriptionTierKey;
  name: string;
  usd: Record<AiSubscriptionPeriod, number>;
  rights: string[];
};

const tierCatalog: TierCatalog[] = [
  {
    key: "Basic",
    name: "基础版",
    usd: { monthly: 99, quarterly: 247.5, yearly: 1089 },
    rights: ["基础行情", "AI 基础问答", "每日情绪播报"],
  },
  {
    key: "Premium",
    name: "高级版",
    usd: { monthly: 499, quarterly: 1247.5, yearly: 5489 },
    rights: ["基础量化", "手动触发交易", "7 日预测"],
  },
  {
    key: "King",
    name: "王者版",
    usd: { monthly: 2999, quarterly: 7497.5, yearly: 32989 },
    rights: ["全自动量化", "AI 自我进化", "滑点优化"],
  },
  {
    key: "Institutional",
    name: "机构版",
    usd: { monthly: 19999, quarterly: 49997.5, yearly: 219989 },
    rights: ["机构 API", "私有集群", "专属 AI 节点"],
  },
];

const fallbackIonEstimates: Record<AiSubscriptionTierKey, number> = {
  Basic: 123.75,
  Premium: 623.75,
  King: 3748.75,
  Institutional: 24998.75,
};

function priceMeta(source: "live" | "fallback"): ApiMeta {
  return {
    source: source === "live" ? "upstream" : "mock",
    updatedAt: new Date().toISOString(),
    stale: source === "fallback",
    requestId: "ai-subscription-ui",
  };
}

export function AiSubscriptionPage() {
  const { address, connect, evmWallet } = useWalletAggregator();
  const walletClient = evmWallet.walletClient;
  const [period, setPeriod] = useState<AiSubscriptionPeriod>("monthly");
  const [ionEstimates, setIonEstimates] = useState<Record<string, number>>(fallbackIonEstimates);
  const [priceSource, setPriceSource] = useState<"live" | "fallback">("fallback");
  const [rights, setRights] = useState<AiSubscriptionRights | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [busyTier, setBusyTier] = useState<AiSubscriptionTierKey | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [autoRenew, setAutoRenew] = useState(true);

  const ionToken = resolveAiIonTokenAddress();
  const feeReceiver = resolveAiFeeReceiverAddress();
  const chainReady = Boolean(ionToken && feeReceiver);

  const reloadPrices = useCallback(async () => {
    setLoadState("loading");
    const next: Record<string, number> = { ...fallbackIonEstimates };
    let live = false;
    await Promise.all(
      tierCatalog.map(async (tier) => {
        try {
          const quote: AiSubscriptionPrice = await fetchAiSubscriptionPrice(tier.key, period);
          next[tier.key] = quote.ion_estimate;
          live = true;
        } catch {
          next[tier.key] = tier.usd[period] / 0.8;
        }
      }),
    );
    setIonEstimates(next);
    setPriceSource(live ? "live" : "fallback");
    setLoadState("ready");
  }, [period]);

  const reloadRights = useCallback(async () => {
    if (!address) {
      setRights(null);
      return;
    }
    try {
      const payload = await fetchAiSubscriptionRights(address);
      setRights(payload);
    } catch {
      setRights({ tier: "Free", expires_at: null, rights: [] });
    }
  }, [address]);

  useEffect(() => {
    void reloadPrices();
  }, [reloadPrices]);

  useEffect(() => {
    void reloadRights();
  }, [reloadRights]);

  const meta = useMemo(() => priceMeta(priceSource), [priceSource]);

  const subscribe = useCallback(
    async (tier: AiSubscriptionTierKey) => {
      setMessage(null);
      if (!address) {
        await connect("metamask");
        return;
      }
      if (!walletClient || !address || !chainReady || !ionToken || !feeReceiver) {
        setMessage("链上收款地址未配置，当前仅可预览价格。请在环境变量中设置 VITE_AI_FEE_RECEIVER。");
        return;
      }
      setBusyTier(tier);
      try {
        const quote = await fetchAiSubscriptionPrice(tier, period);
        const hash = await walletClient.writeContract({
          account: address as `0x${string}`,
          chain: bsc,
          address: ionToken as `0x${string}`,
          abi: ERC20_TRANSFER_ABI,
          functionName: "transfer",
          args: [feeReceiver as `0x${string}`, parseEther(String(quote.ion_estimate))],
        });
        await submitAiSubscriptionOrder({
          wallet_addr: address,
          tier,
          period,
          tx_hash: hash,
          auto_renew: autoRenew,
        });
        setMessage(`订阅成功 · ${tier} · tx ${hash.slice(0, 10)}…`);
        await reloadRights();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "订阅失败，请检查钱包余额与网络。");
      } finally {
        setBusyTier(null);
      }
    },
    [address, autoRenew, chainReady, connect, feeReceiver, ionToken, period, reloadRights, walletClient],
  );

  const onToggleAutoRenew = useCallback(async () => {
    if (!address) {
      setMessage("请先连接钱包再切换自动续费。");
      return;
    }
    const next = !autoRenew;
    try {
      await toggleAiAutoRenewal(address, next);
      setAutoRenew(next);
      setMessage(next ? "已开启自动续费。" : "已关闭自动续费。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "自动续费开关更新失败。");
    }
  }, [address, autoRenew]);

  const onWalletAction = useCallback(async () => {
    if (address) {
      await reloadRights();
      return;
    }
    await connect("metamask");
  }, [address, connect, reloadRights]);

  return (
    <div className="grid gap-5" data-testid="page-ai-subscription">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/70">AI analyst</p>
        <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl" data-testid="page-title">
          On-chain AI market analyst
        </h1>
      </header>

      <GlassPanel eyebrow="AI Subscription" testId="ai-subscription-hero" title="ION‑DEX AI 量化订阅">
        <p className="text-sm text-white/70">
          四档 AI 量化会员，ION 浮动扣费（0.3×–3.0×），链上真实转账 + 合约记账。
        </p>
      </GlassPanel>

      <div className="flex flex-wrap items-center gap-3">
        <DataSourceBadge meta={meta} testId="ai-subscription-source" />
        <div className="flex gap-2">
          {(["monthly", "quarterly", "yearly"] as const).map((p) => (
            <button
              key={p}
              className={`rounded-full px-3 py-1 text-sm ${period === p ? "bg-cyan-500/30 text-cyan-50" : "border border-cyan-400/20 text-cyan-100/70"}`}
              data-testid={`ai-subscription-period-${p}`}
              onClick={() => setPeriod(p)}
              type="button"
            >
              {p === "monthly" ? "月付" : p === "quarterly" ? "季付" : "年付"}
            </button>
          ))}
        </div>
      </div>

      <AsyncState error={null} state={loadState} testId="ai-subscription-loading">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tierCatalog.map((tier) => (
            <GlassPanel key={tier.key} testId={`ai-subscription-tier-${tier.key.toLowerCase()}`} title={tier.name}>
              <p className="text-2xl font-semibold text-cyan-50">${tier.usd[period].toLocaleString()}</p>
              <p className="mt-1 text-sm text-cyan-100/60" data-testid={`ai-subscription-ion-${tier.key.toLowerCase()}`}>
                预估 ION · {ionEstimates[tier.key]?.toFixed(2) ?? "—"}
              </p>
              <ul className="mt-4 space-y-1 text-sm text-cyan-100/75">
                {tier.rights.map((r) => (
                  <li key={r}>✓ {r}</li>
                ))}
              </ul>
              <NeonButton
                className="mt-4 w-full"
                data-testid={`ai-subscription-subscribe-${tier.key.toLowerCase()}`}
                disabled={busyTier !== null}
                onClick={() => void subscribe(tier.key)}
              >
                {busyTier === tier.key ? "处理中…" : "立即订阅"}
              </NeonButton>
            </GlassPanel>
          ))}
        </div>
      </AsyncState>

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricTile
          label="当前会员"
          testId="ai-subscription-member-tier"
          tone="magenta"
          value={rights?.tier ?? (address ? "Free" : "未连接")}
        />
        <MetricTile
          label="到期时间"
          testId="ai-subscription-expires"
          tone="cyan"
          value={rights?.expires_at ? new Date(rights.expires_at).toLocaleString() : "—"}
        />
        <MetricTile
          label="权限项"
          testId="ai-subscription-rights-count"
          tone="gold"
          value={String(rights?.rights.length ?? 0)}
        />
      </div>

      <GlassPanel testId="ai-subscription-wallet-panel" title="钱包与自动续费">
        <p className="text-sm text-cyan-100/70">
          {address ? `已连接 · ${address.slice(0, 6)}…${address.slice(-4)}` : "连接钱包后可查询权限并发起链上 ION 转账。"}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <NeonButton data-testid="ai-subscription-connect" onClick={() => void onWalletAction()} type="button">
            {address ? "刷新权限" : "连接 MetaMask"}
          </NeonButton>
          <NeonButton
            className="opacity-90"
            data-testid="ai-subscription-auto-renew"
            disabled={!address}
            onClick={() => void onToggleAutoRenew()}
            type="button"
          >
            自动续费：{autoRenew ? "开" : "关"}
          </NeonButton>
        </div>
        {message ? (
          <p className="mt-4 text-sm text-cyan-100/85" data-testid="ai-subscription-confirmation">
            {message}
          </p>
        ) : null}
      </GlassPanel>
    </div>
  );
}
