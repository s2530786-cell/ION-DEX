import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { TradeConfirm } from "@/components/compliance/TradeConfirm";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { ScaffoldNotice } from "@/components/ui/ScaffoldNotice";
import { useWalletAggregator } from "@/hooks/useWalletAggregator";

type DepthBook = { buy: number[][]; sell: number[][] };

type OrderType = "market" | "limit" | "stop";
type Side = "buy" | "sell";

/** Static demo depth — not live order book or MM API data. */
// [PREVIEW-ONLY] Replace with live data source once backend endpoint is ready
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
  const { signer, address } = useWalletAggregator();
  const [tab, setTab] = useState<Side>("buy");
  const [orderType, setOrderType] = useState<OrderType>("limit");
  const [price, setPrice] = useState("0.0001400");
  const [amount, setAmount] = useState("0");
  // [PREVIEW-ONLY] Replace with live data source once backend endpoint is ready
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
      return "—";
    }
    return preview.notional.toFixed(6);
  }, [preview]);

  function requestSubmit() {
    if (!signer || !address) {
      setMessage("请先连接钱包。");
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
        `[预览] ${tab === "buy" ? "买入" : "卖出"} ${orderType} 单仅本地表单校验，未调用 /api/market/mm/order 或链上合约。`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.9fr_0.8fr]" data-testid="page-trade-pro">
      <div className="xl:col-span-3">
        <ScaffoldNotice
          detail="深度、余额与下单均为演示数据；未接做市 API 或链上撮合。Swap 页可走后端 GeckoTerminal 报价。"
          testId="trade-pro-scaffold-notice"
        />
      </div>
      <NeonCard variant="cyan">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-100/60">Professional Trade</p>
            <h1 className="mt-2 text-3xl font-black text-white">Trade Pro</h1>
            <p className="mt-2 text-sm text-cyan-100/65">市价 / 限价 / 止盈止损 UI 骨架；图表与深度为静态演示。</p>
          </div>
          <Activity className="text-cyan-200" />
        </div>

        <div className="mt-6 grid h-[24rem] place-items-center rounded-[1.6rem] border border-white/10 bg-black/25 text-center text-cyan-100/55">
          <div>
            <p className="text-lg font-black text-white">TradingView / K-Line Slot</p>
            <p className="mt-2 text-sm">后续把真实 TV widget 挂进这里。</p>
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
            买入
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm font-black ${tab === "sell" ? "bg-rose-400/20 text-rose-100" : "text-cyan-100/60"}`}
            onClick={() => setTab("sell")}
            type="button"
          >
            卖出
          </button>
        </div>

        <div className="mt-4">
          <select
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none"
            onChange={(e) => setOrderType(e.target.value as OrderType)}
            value={orderType}
          >
            <option value="market">市价</option>
            <option value="limit">限价</option>
            <option value="stop">止盈止损</option>
          </select>
        </div>

        {orderType !== "market" ? (
          <label className="mt-4 block rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
            <span className="text-xs uppercase tracking-[0.18em] text-cyan-100/45">价格</span>
            <input
              className="mt-2 w-full bg-transparent text-lg font-black text-white outline-none"
              onChange={(e) => setPrice(e.target.value)}
              value={price}
            />
          </label>
        ) : null}

        <label className="mt-4 block rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
          <span className="text-xs uppercase tracking-[0.18em] text-cyan-100/45">数量</span>
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
              <p>预估成交额：{preview.notional.toFixed(6)}</p>
              <p>平台费（ION）：{preview.feeIon.toFixed(6)}</p>
            </>
          ) : (
            <p>输入数量后显示成交预览。</p>
          )}
        </div>

        <NeonButton className="mt-5 w-full" disabled={loading || !preview} onClick={requestSubmit} type="button">
          {loading ? "校验中..." : tab === "buy" ? "预览买入（未提交）" : "预览卖出（未提交）"}
        </NeonButton>

        {message ? <p className="mt-4 text-sm text-emerald-200">{message}</p> : null}
      </NeonCard>

      <NeonCard variant="gold">
        <p className="text-sm uppercase tracking-[0.18em] text-cyan-100/45">Depth (demo)</p>
        <div className="mt-4 grid gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-rose-200"><TrendingDown size={16} /> Sell</div>
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
            <div className="mb-2 flex items-center gap-2 text-emerald-200"><TrendingUp size={16} /> Buy</div>
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
