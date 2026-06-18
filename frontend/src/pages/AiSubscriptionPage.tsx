import { useCallback, useEffect, useMemo, useState } from "react";
import { parseEther } from "viem";
import { bsc } from "wagmi/chains";
import { SentinelAlertTestPanel } from "@/components/sentinel/SentinelAlertTestPanel";
import { DataSourceBadge } from "@/components/data/DataSourceBadge";
import { AsyncState } from "@/components/ui/AsyncState";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlassPanel } from "@/components/ui/glass/GlassPanel";
import { MetricTile } from "@/components/ui/glass/MetricTile";
import { useWalletAggregator } from "@/hooks/useWalletAggregator";
import { useI18n } from "@/i18n/I18nProvider";
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
  nameZh: string;
  nameEn: string;
  usd: Record<AiSubscriptionPeriod, number>;
  rightsZh: string[];
  rightsEn: string[];
};

const tierCatalog: TierCatalog[] = [
  {
    key: "Basic",
    nameZh: "基础版",
    nameEn: "Basic",
    usd: { monthly: 99, quarterly: 247.5, yearly: 1089 },
    rightsZh: ["基础行情", "AI 基础问答", "每日情绪播报"],
    rightsEn: ["Basic market feed", "AI Q&A", "Daily sentiment briefing"],
  },
  {
    key: "Premium",
    nameZh: "高级版",
    nameEn: "Premium",
    usd: { monthly: 499, quarterly: 1247.5, yearly: 5489 },
    rightsZh: ["基础量化", "手动触发交易", "7 日预测"],
    rightsEn: ["Starter quant tools", "Manual trade triggers", "7-day forecasts"],
  },
  {
    key: "King",
    nameZh: "王者版",
    nameEn: "King",
    usd: { monthly: 2999, quarterly: 7497.5, yearly: 32989 },
    rightsZh: ["全自动量化", "AI 自我进化", "滑点优化"],
    rightsEn: ["Full auto quant", "Self-evolving AI", "Slippage optimization"],
  },
  {
    key: "Institutional",
    nameZh: "机构版",
    nameEn: "Institutional",
    usd: { monthly: 19999, quarterly: 49997.5, yearly: 219989 },
    rightsZh: ["机构 API", "私有集群", "专属 AI 节点"],
    rightsEn: ["Institutional API", "Private cluster", "Dedicated AI node"],
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
  const { isZh } = useI18n();
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
        setMessage(
          isZh
            ? "链上收款地址未配置，当前只能预览价格。请在环境变量中设置 VITE_AI_FEE_RECEIVER。"
            : "Fee receiver is not configured, so this page can only preview pricing. Set VITE_AI_FEE_RECEIVER in the environment.",
        );
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
        setMessage(
          isZh
            ? `订阅成功 · ${tier} · tx ${hash.slice(0, 10)}...`
            : `Subscription successful · ${tier} · tx ${hash.slice(0, 10)}...`,
        );
        await reloadRights();
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : isZh
              ? "订阅失败，请检查钱包余额与网络。"
              : "Subscription failed. Please check wallet balance and network.",
        );
      } finally {
        setBusyTier(null);
      }
    },
    [address, autoRenew, chainReady, connect, feeReceiver, ionToken, isZh, period, reloadRights, walletClient],
  );

  const onToggleAutoRenew = useCallback(async () => {
    if (!address) {
      setMessage(isZh ? "请先连接钱包再切换自动续费。" : "Connect a wallet before changing auto-renewal.");
      return;
    }
    const next = !autoRenew;
    try {
      await toggleAiAutoRenewal(address, next);
      setAutoRenew(next);
      setMessage(next ? (isZh ? "已开启自动续费。" : "Auto-renewal enabled.") : isZh ? "已关闭自动续费。" : "Auto-renewal disabled.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : isZh ? "自动续费开关更新失败。" : "Failed to update auto-renewal setting.",
      );
    }
  }, [address, autoRenew, isZh]);

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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/70">
          {isZh ? "AI 分析师" : "AI Analyst"}
        </p>
        <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl" data-testid="page-title">
          {isZh ? "链上 AI 市场分析师" : "On-Chain AI Market Analyst"}
        </h1>
      </header>

      <GlassPanel eyebrow="AI Subscription" testId="ai-subscription-hero" title={isZh ? "ION-DEX AI 量化订阅" : "ION-DEX AI Quant Subscription"}>
        <p className="text-sm text-white/70">
          {isZh
            ? "四档 AI 量化会员，采用 ION 浮动扣费（0.3x - 3.0x），链上真实转账并同步合约记账。"
            : "Four AI quant tiers with floating ION billing (0.3x - 3.0x), backed by real on-chain transfers and contract-side accounting."}
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
              {p === "monthly" ? (isZh ? "月付" : "Monthly") : p === "quarterly" ? (isZh ? "季付" : "Quarterly") : isZh ? "年付" : "Yearly"}
            </button>
          ))}
        </div>
      </div>

      <AsyncState error={null} state={loadState} testId="ai-subscription-loading">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tierCatalog.map((tier) => (
            <GlassPanel
              key={tier.key}
              testId={`ai-subscription-tier-${tier.key.toLowerCase()}`}
              title={isZh ? tier.nameZh : tier.nameEn}
            >
              <p className="text-2xl font-semibold text-cyan-50">${tier.usd[period].toLocaleString()}</p>
              <p className="mt-1 text-sm text-cyan-100/60" data-testid={`ai-subscription-ion-${tier.key.toLowerCase()}`}>
                {isZh ? "预计 ION" : "Est. ION"} · {ionEstimates[tier.key]?.toFixed(2) ?? "..."}
              </p>
              <ul className="mt-4 space-y-1 text-sm text-cyan-100/75">
                {(isZh ? tier.rightsZh : tier.rightsEn).map((right) => (
                  <li key={right}>• {right}</li>
                ))}
              </ul>
              <NeonButton
                className="mt-4 w-full"
                data-testid={`ai-subscription-subscribe-${tier.key.toLowerCase()}`}
                disabled={busyTier !== null}
                onClick={() => void subscribe(tier.key)}
              >
                {busyTier === tier.key ? (isZh ? "处理中…" : "Processing…") : isZh ? "立即订阅" : "Subscribe Now"}
              </NeonButton>
            </GlassPanel>
          ))}
        </div>
      </AsyncState>

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricTile
          label={isZh ? "当前会员" : "Current Tier"}
          testId="ai-subscription-member-tier"
          tone="magenta"
          value={rights?.tier ?? (address ? "Free" : isZh ? "未连接" : "Not Connected")}
        />
        <MetricTile
          label={isZh ? "到期时间" : "Expires At"}
          testId="ai-subscription-expires"
          tone="cyan"
          value={rights?.expires_at ? new Date(rights.expires_at).toLocaleString() : "-"}
        />
        <MetricTile
          label={isZh ? "权限项" : "Rights Count"}
          testId="ai-subscription-rights-count"
          tone="gold"
          value={String(rights?.rights.length ?? 0)}
        />
      </div>

      <GlassPanel testId="ai-subscription-wallet-panel" title={isZh ? "钱包与自动续费" : "Wallet and Auto-Renewal"}>
        <p className="text-sm text-cyan-100/70">
          {address
            ? isZh
              ? `已连接 · ${address.slice(0, 6)}...${address.slice(-4)}`
              : `Connected · ${address.slice(0, 6)}...${address.slice(-4)}`
            : isZh
              ? "连接钱包后可查询订阅权益并发起链上 ION 转账。"
              : "Connect a wallet to inspect subscription rights and send on-chain ION payments."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <NeonButton data-testid="ai-subscription-connect" onClick={() => void onWalletAction()} type="button">
            {address ? (isZh ? "刷新权益" : "Refresh Rights") : isZh ? "连接 MetaMask" : "Connect MetaMask"}
          </NeonButton>
          <NeonButton
            className="opacity-90"
            data-testid="ai-subscription-auto-renew"
            disabled={!address}
            onClick={() => void onToggleAutoRenew()}
            type="button"
          >
            {isZh ? `自动续费：${autoRenew ? "开" : "关"}` : `Auto Renew: ${autoRenew ? "On" : "Off"}`}
          </NeonButton>
        </div>
        {message ? (
          <p className="mt-4 text-sm text-cyan-100/85" data-testid="ai-subscription-confirmation">
            {message}
          </p>
        ) : null}
      </GlassPanel>

      <SentinelAlertTestPanel />
    </div>
  );
}
