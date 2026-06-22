import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { TradeConfirm } from "@/components/compliance/TradeConfirm";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { ScaffoldNotice } from "@/components/ui/ScaffoldNotice";
import { useI18n } from "@/i18n/I18nProvider";
import { useWalletAggregator } from "@/hooks/useWalletAggregator";

type DepthBook = { buy: number[][]; sell: number[][] };

type OrderType = "market" | "limit" | "stop";
type Side = "buy" | "sell";

/** Static demo depth - not live order book or MM API data. */
const DEMO_DEPTH_BOOK: DepthBook = {
  sell: [
    [0.0001412, 8200],
    [0.0001416, 5100],
    [0.0001421, 4300],
    [0.0001425, 3900],
  ],
  buy: [
    [0.0001399, 9100],
    [0.0001395, 6200],
    [0.0001391, 5000],
    [0.0001386, 3700],
  ],
};

export function TradeProPage() {
  const { isZh } = useI18n();
  const { signer, address } = useWalletAggregator();
  const [tab, setTab] = useState<Side>("buy");
  const [orderType, setOrderType] = useState<OrderType>("limit");
  const [price, setPrice] = useState("0.0001400");
  const [amount, setAmount] = useState("0");
  const demoBalance = 10000;
  const [loading, setLoading] = useState(false);
  const depth = DEMO_DEPTH_BOOK;
  const [message, setMessage] = useState<string | null>(null);
  const [showTradeConfirm, setShowTradeConfirm] = useState(false);

  const preview = useMemo(() => {
    const p = Number(price);
    const a = Number(amount);
    if (!Number.isFinite(a) || a <= 0) {
      return null;
    }
    const notional = orderType === "market" ? a : a * (Number.isFinite(p) ? p : 0);
    return {
      notional,
      feeIon: notional * 0.0015,
    };
  }, [amount, orderType, price]);

  const confirmSymbols = useMemo(() => {
    if (tab === "buy") {
      return { pay: "BNB", receive: "ION" };
    }
    return { pay: "ION", receive: "BNB" };
  }, [tab]);

  const receiveAmountPreview = useMemo(() => {
    if (!preview) {
      return "-";
    }
    return preview.notional.toFixed(6);
  }, [preview]);

  function requestSubmit() {
    if (!signer || !address) {
      setMessage(isZh ? "请先连接钱包。" : "Connect a wallet first.");
      return;
    }
    setShowTradeConfirm(true);
  }

  async function submitOrderPreview() {
    setShowTradeConfirm(false);
    setLoading(true);
    setMessage(null);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 400));
      setMessage(
        isZh
          ? `[预览] ${tab === "buy" ? "买入" : "卖出"} ${orderType} 单仅完成本地表单校验，尚未调用 /api/market/mm/order 或链上合约。`
          : `[Preview] ${tab === "buy" ? "Buy" : "Sell"} ${orderType} order completed local validation only. No /api/market/mm/order call or on-chain contract action was made.`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.9fr_0.8fr]" data-testid="page-trade-pro">
      <div className="xl:col-span-3">
        <ScaffoldNotice
          detail={
            isZh
              ? "深度、余额与下单均为演示数据；当前未接做市 API 或链上撮合。Swap 页在后端在线时可使用 GeckoTerminal 报价。"
              : "Depth, balances, and order placement are all demo data. Market-maker APIs and on-chain matching are not wired yet. The Swap page can use GeckoTerminal-backed quotes when the backend is online."
          }
          testId="trade-pro-scaffold-notice"
        />
      </div>
      <NeonCard variant="cyan">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-100/60">
              {isZh ? "专业交易" : "Professional Trade"}
            </p>
            <h1 className="mt-2 text-3xl font-black text-white">{isZh ? "专业交易台" : "Trade Pro"}</h1>
            <p className="mt-2 text-sm text-cyan-100/65">
              {isZh ? "市价 / 限价 / 止盈止损 UI 骨架；图表与深度仍为静态演示。" : "Market / limit / stop order UI scaffold with static demo charting and depth."}
            </p>
          </div>
          <Activity className="text-cyan-200" />
        </div>

        <div className="mt-6 grid h-[24rem] place-items-center rounded-[1.6rem] border border-white/10 bg-black/25 text-center text-cyan-100/55">
          <div>
            <p className="text-lg font-black text-white">{isZh ? "TradingView / K 线挂载位" : "TradingView / K-Line Slot"}</p>
            <p className="mt-2 text-sm">
              {isZh ? "后续会把真实的 TV Widget 挂到这里。" : "A live TV widget will be mounted here later."}
            </p>
          </div>
        </div>
      </NeonCard>

      <NeonCard variant="magenta">
        <div className="flex items-center gap-2">
          <button
            className={`rounded-full px-4 py-2 text-sm font-black ${tab === "buy" ? "bg-emerald-400/20 text-emerald-100" : "text-cyan-100/60"}`}
            onClick={() => setTab("buy")}
            type="button"
          >
            {isZh ? "买入" : "Buy"}
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm font-black ${tab === "sell" ? "bg-rose-400/20 text-rose-100" : "text-cyan-100/60"}`}
            onClick={() => setTab("sell")}
            type="button"
          >
            {isZh ? "卖出" : "Sell"}
          </button>
        </div>

        <div className="mt-4">
          <select
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none"
            onChange={(e) => setOrderType(e.target.value as OrderType)}
            value={orderType}
          >
            <option value="market">{isZh ? "市价" : "Market"}</option>
            <option value="limit">{isZh ? "限价" : "Limit"}</option>
            <option value="stop">{isZh ? "止盈止损" : "Stop"}</option>
          </select>
        </div>

        {orderType !== "market" ? (
          <label className="mt-4 block rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
            <span className="text-xs uppercase tracking-[0.18em] text-cyan-100/45">{isZh ? "价格" : "Price"}</span>
            <input
              className="mt-2 w-full bg-transparent text-lg font-black text-white outline-none"
              onChange={(e) => setPrice(e.target.value)}
              value={price}
            />
          </label>
        ) : null}

        <label className="mt-4 block rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
          <span className="text-xs uppercase tracking-[0.18em] text-cyan-100/45">{isZh ? "数量" : "Amount"}</span>
          <input
            className="mt-2 w-full bg-transparent text-lg font-black text-white outline-none"
            onChange={(e) => setAmount(e.target.value)}
            value={amount}
          />
        </label>

        <div className="mt-4 flex gap-2">
          <button className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white" onClick={() => setAmount(String(demoBalance * 0.25))} type="button">25%</button>
          <button className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white" onClick={() => setAmount(String(demoBalance * 0.5))} type="button">50%</button>
          <button className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white" onClick={() => setAmount(String(demoBalance))} type="button">100%</button>
        </div>

        <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4 text-sm text-cyan-100">
          {preview ? (
            <>
              <p>{isZh ? `预计成交额：${preview.notional.toFixed(6)}` : `Estimated notional: ${preview.notional.toFixed(6)}`}</p>
              <p>{isZh ? `平台费（ION）：${preview.feeIon.toFixed(6)}` : `Platform fee (ION): ${preview.feeIon.toFixed(6)}`}</p>
            </>
          ) : (
            <p>{isZh ? "输入数量后显示成交预览。" : "Enter an amount to show the order preview."}</p>
          )}
        </div>

        <NeonButton className="mt-5 w-full" disabled={loading || !preview} onClick={requestSubmit} type="button">
          {loading
            ? isZh
              ? "校验中..."
              : "Validating..."
            : tab === "buy"
              ? isZh
                ? "预览买入（未提交）"
                : "Preview Buy (No Submit)"
              : isZh
                ? "预览卖出（未提交）"
                : "Preview Sell (No Submit)"}
        </NeonButton>

        {message ? <p className="mt-4 text-sm text-emerald-200">{message}</p> : null}
      </NeonCard>

      <NeonCard variant="gold">
        <p className="text-sm uppercase tracking-[0.18em] text-cyan-100/45">{isZh ? "深度（演示）" : "Depth (Demo)"}</p>
        <div className="mt-4 grid gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-rose-200"><TrendingDown size={16} /> {isZh ? "卖盘" : "Sell"}</div>
            <div className="grid gap-2">
              {depth.sell.map((d) => (
                <div key={`sell-${d[0]}`} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-sm">
                  <span>{d[0].toFixed(7)}</span>
                  <span>{d[1].toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 text-emerald-200"><TrendingUp size={16} /> {isZh ? "买盘" : "Buy"}</div>
            <div className="grid gap-2">
              {depth.buy.map((d) => (
                <div key={`buy-${d[0]}`} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-sm">
                  <span>{d[0].toFixed(7)}</span>
                  <span>{d[1].toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </NeonCard>
      <TradeConfirm
        open={showTradeConfirm}
        payAmount={amount}
        paySymbol={confirmSymbols.pay}
        previewOnly
        receiveAmount={receiveAmountPreview}
        receiveSymbol={confirmSymbols.receive}
        onCancel={() => setShowTradeConfirm(false)}
        onConfirm={() => void submitOrderPreview()}
      />
    </div>
  );
}
