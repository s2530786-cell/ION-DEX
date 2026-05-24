import { useCallback, useEffect, useState } from "react";
import { GlassPanel } from "@/components/ui/glass/GlassPanel";
import { MetricTile } from "@/components/ui/glass/MetricTile";
import { fetchJson } from "@/lib/http";

// ── 类型定义 ──────────────────────────────────────────

type AssetBalance = {
  symbol: string;
  name: string;
  chain: string;
  address: string;
  decimals: number;
  balanceRaw: string;
  balanceFormatted: string;
  usdPrice: number | null;
  usdValue: number | null;
};

type ChainBalance = {
  chain: string;
  chainName: string;
  nativeCurrency: string;
  assets: AssetBalance[];
  totalUsd: number;
};

type PortfolioData = {
  address: string;
  chains: ChainBalance[];
  totalUsd: number;
  updatedAt: string;
};

// ── 链图标颜色映射 ────────────────────────────────────

const CHAIN_THEME: Record<string, { color: string; icon: string }> = {
  ion:       { color: "#00ffff", icon: "✦" },
  bsc:       { color: "#f0b90b", icon: "⬡" },
  ethereum:  { color: "#627eea", icon: "◆" },
  base:      { color: "#0052ff", icon: "▣" },
  solana:    { color: "#9945ff", icon: "◈" },
  bitcoin:   { color: "#f7931a", icon: "₿" },
};

function getChainTheme(chain: string) {
  return CHAIN_THEME[chain] ?? { color: "#888", icon: "●" };
}

// ── 格式化工具 ────────────────────────────────────────

function formatUsd(value: number | null): string {
  if (value === null || value === undefined) return "$—";
  if (value >= 1000) return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(6)}`;
}

function formatPrice(value: number | null): string {
  if (!value) return "—";
  if (value >= 1000) return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(6)}`;
}

function formatBalance(value: string, decimals: number): string {
  const num = parseFloat(value);
  if (num === 0) return "0";
  if (num >= 1) return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: decimals > 9 ? 4 : 6 });
  return num.toFixed(4);
}

// ── 主组件 ────────────────────────────────────────────

type PortfolioHubProps = {
  address: string;
  onClose?: () => void;
};

export function PortfolioHub({ address, onClose }: PortfolioHubProps) {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedChain, setExpandedChain] = useState<string | null>("bsc");

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchJson<{ data: PortfolioData }>(
        `/api/portfolio?address=${encodeURIComponent(address)}`
      );
      setData(result.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch portfolio");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (address) fetchPortfolio();
  }, [address, fetchPortfolio]);

  if (loading) {
    return (
      <GlassPanel className="p-4">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin h-6 w-6 border-2 border-ion-cyan border-t-transparent rounded-full" />
          <span className="ml-3 text-sm text-gray-400">Scanning 6 chains...</span>
        </div>
      </GlassPanel>
    );
  }

  if (error) {
    return (
      <GlassPanel className="p-4">
        <div className="text-red-400 text-sm text-center">
          <p>⚠️ {error}</p>
          <button
            onClick={fetchPortfolio}
            className="mt-2 text-ion-cyan underline text-xs"
          >
            Retry
          </button>
        </div>
      </GlassPanel>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-3">
      {/* 总资产 */}
      <GlassPanel className="p-4 text-center">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Portfolio Value</div>
        <div className="text-3xl font-bold" style={{ color: "#00ffff", textShadow: "0 0 20px rgba(0,255,255,0.4)" }}>
          {formatUsd(data.totalUsd)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {data.chains.filter(c => c.totalUsd > 0).length} active chains · Updated {new Date(data.updatedAt).toLocaleTimeString()}
        </div>
      </GlassPanel>

      {/* 链列表 */}
      <div className="space-y-2">
        {data.chains.map((chain) => {
          const theme = getChainTheme(chain.chain);
          const nonZero = chain.assets.filter(a => parseFloat(a.balanceRaw) > 0);
          const isExpanded = expandedChain === chain.chain;

          return (
            <div
              key={chain.chain}
              className={`rounded-2xl border border-white/10 bg-white/[0.04] p-3 cursor-pointer transition-all ${isExpanded ? "ring-1 ring-white/20" : "hover:border-cyan-200/20"}`}
              style={isExpanded ? { boxShadow: `0 0 12px ${theme.color}22` } : undefined}
              onClick={() => setExpandedChain(isExpanded ? null : chain.chain)}
            >
              {/* 链头部 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span style={{ color: theme.color, fontSize: "1.2rem" }}>{theme.icon}</span>
                  <span className="font-medium text-sm">{chain.chainName}</span>
                  {nonZero.length > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${theme.color}22`, color: theme.color }}>
                      {nonZero.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono" style={{ color: chain.totalUsd > 0 ? "#00ff88" : "#666" }}>
                    {formatUsd(chain.totalUsd)}
                  </span>
                  <span className="text-gray-600 text-xs">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* 展开的资产列表 */}
              {isExpanded && (
                <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
                  {chain.assets.map((asset) => {
                    const hasBalance = parseFloat(asset.balanceRaw) > 0;
                    return (
                      <div
                        key={`${asset.chain}-${asset.symbol}-${asset.address}`}
                        className={`flex items-center justify-between text-xs py-1 ${hasBalance ? "" : "opacity-40"}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 text-right font-mono">{asset.symbol}</span>
                          <span className="text-gray-500 truncate max-w-[120px]">{asset.name}</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono">
                          <span style={{ color: hasBalance ? "#e0e0e0" : "#555" }}>
                            {hasBalance ? formatBalance(asset.balanceFormatted, asset.decimals) : "—"}
                          </span>
                          <span className="w-16 text-right text-gray-500">
                            {formatPrice(asset.usdPrice)}
                          </span>
                          {hasBalance && asset.usdValue !== null && (
                            <span className="w-16 text-right" style={{ color: "#00ff88" }}>
                              {formatUsd(asset.usdValue)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 刷新 */}
      <div className="flex justify-center">
        <button
          onClick={fetchPortfolio}
          className="text-xs text-gray-500 hover:text-ion-cyan transition-colors"
        >
          ↻ Refresh
        </button>
      </div>
    </div>
  );
}
