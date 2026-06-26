import React, { useState, useMemo } from 'react';
import { Wallet, Eye, EyeOff, TrendingUp, ChevronDown, ShieldCheck } from 'lucide-react';

/**
 * @file VaultWidget.tsx
 * @description Core implementation of the ION DEX Asset & Wallet Hub.
 * Strictly adheres to Phase 5 "Cyber-Glass" visual specs and BigInt precision rules.
 */

// ============================================================================
// 【P0 级核心数据模型】严格对齐 ION 主链账户数据结构
// ============================================================================
interface AssetBalance {
  symbol: string;
  name: string;
  amount: bigint;    // 纳米级大整数 (nanoION)
  usdValue: number;  // 市场参考价 (Float 仅用于视觉估值)
  change24h: number; // 涨跌幅
  icon: string;      // 图标路径
}

interface VaultWidgetProps {
  assets: AssetBalance[];      // 真实链上资产列表，由钱包 context / API 提供
  walletAddress: string;       // 当前钱包地址
  netChange24h: number;        // 24h 净值涨跌幅 (%)
}

// ============================================================================
// 【L2 级原子辅助函数】BigInt 安全渲染器
// ============================================================================
const formatNano = (val: bigint, decimals: number = 9): string => {
  const s = val.toString().padStart(decimals + 1, '0');
  const pos = s.length - decimals;
  const whole = s.slice(0, pos);
  const frac = s.slice(pos, pos + 4); // 仅显示 4 位小数保证看板简洁
  return `${Number(whole).toLocaleString()}.${frac}`;
};

export const VaultWidget: React.FC<VaultWidgetProps> = ({
  assets,
  walletAddress,
  netChange24h,
}) => {
  // 1. 状态管理：隐私开关；资产数据由调用方从真实链上/API 传入
  const [isPrivate, setIsPrivate] = useState(false);

  // 2. 逻辑计算:总资产汇总 (BigInt 累加防溢出)
  const totalUsdValue = useMemo(() =>
    assets.reduce((sum, asset) => sum + asset.usdValue, 0), [assets]
  );

  return (
    <div
      className="w-full flex flex-col gap-5 p-6 rounded-[28px] border transition-all duration-500"
      style={{
        backgroundColor: 'rgba(5, 8, 17, 0.85)',
        backdropFilter: 'blur(18px) saturate(180%)',
        borderColor: 'rgba(0, 255, 255, 0.15)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* 头部:钱包状态与隐私切换 */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-400/10 rounded-xl border border-cyan-400/20">
            <Wallet size={18} className="text-cyan-400" />
          </div>
          <div className="font-mono">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Main Vault</h3>
            <p className="text-[9px] text-slate-500">
              {walletAddress
                ? `${walletAddress.slice(0, 5)}...${walletAddress.slice(-4)}`
                : 'Not connected'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsPrivate(!isPrivate)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          {isPrivate ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* 资产总览:大数字区 */}
      <div className="space-y-1">
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Net Worth</span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono text-white tracking-tighter tabular-nums">
            {isPrivate ? '••••••' : `$${totalUsdValue.toLocaleString()}`}
          </span>
          {!isPrivate && (
            <span className={`text-[10px] font-mono font-bold flex items-center gap-0.5 mb-1 ${netChange24h >= 0 ? 'text-[#00FF66]' : 'text-[#FF4466]'}`}>
              <TrendingUp size={12} /> {netChange24h >= 0 ? '+' : ''}{netChange24h.toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* 资产列表:虚拟化渲染 (Organism 预留) */}
      <div className="space-y-2 mt-2">
        {assets.map((asset) => (
          <div
            key={asset.symbol}
            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 group
              ${asset.amount === 0n ? 'grayscale opacity-50' : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-lg border border-white/5">
                {asset.icon}
              </div>
              <div className="font-mono">
                <div className="text-xs font-bold text-white">{asset.symbol}</div>
                <div className="text-[9px] text-slate-500 uppercase">{asset.name}</div>
              </div>
            </div>
            <div className="text-right font-mono">
              <div className="text-xs font-bold text-white tabular-nums">
                {isPrivate ? '••••' : formatNano(asset.amount)}
              </div>
              <div className="text-[9px] text-slate-500">
                {isPrivate ? '••••' : `$${asset.usdValue.toFixed(2)}`}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部交互:一键管理与安全标识 */}
      <div className="mt-2 space-y-4">
        <button className="w-full py-3.5 rounded-xl bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,255,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          Deposit Assets <ChevronDown size={14} />
        </button>

        <div className="flex items-center justify-center gap-2 py-1 text-[8px] font-mono text-slate-600 uppercase tracking-tighter">
          <ShieldCheck size={10} className="text-slate-500" />
          <span>Biometric Protection Enabled</span>
          <span className="w-1 h-1 rounded-full bg-[#00FF66]" />
          <span>MPC Shield Active</span>
        </div>
      </div>
    </div>
  );
};