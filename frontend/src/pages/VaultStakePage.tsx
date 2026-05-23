import { TrendingUp, Wallet } from "lucide-react";
import { useState } from "react";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { useWalletAggregator } from "@/hooks/useWalletAggregator";

const vaultAbi = [
  "function deposit(uint256 amount) external",
  "function compound() external",
  "function withdraw(uint256 share) external",
];

const vaultAddr = import.meta.env.VITE_VAULT_CONTRACT_ADDRESS?.trim() || "0x你的机枪池合约";

export function VaultStakePage() {
  const { signer, walletType, address } = useWalletAggregator();
  const [depositAmt, setDepositAmt] = useState("0");
  const [apy] = useState(46.8);
  const [status, setStatus] = useState<string | null>(null);

  async function deposit() {
    if (!signer) {
      setStatus("请先连接钱包后再存入 LP。");
      return;
    }
    setStatus(`已准备存入 ${depositAmt} LP 到 ${vaultAddr}（待接真实合约写入流）。`);
  }

  async function compound() {
    if (!signer) {
      setStatus("请先连接钱包后再执行复利。");
      return;
    }
    setStatus("已准备发送 compound 交易（待接真实 vault 合约）。");
  }

  async function withdraw() {
    if (!signer) {
      setStatus("请先连接钱包后再提取。");
      return;
    }
    setStatus(`已准备提取 ${depositAmt} 份额（待接真实 vault 合约）。`);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_20rem]" data-testid="page-vault-stake">
      <NeonCard variant="gold">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-100/60">Vault Auto-Compound</p>
            <h1 className="mt-2 text-3xl font-black text-white">机枪池 · 自动复利质押</h1>
            <p className="mt-2 text-sm text-cyan-100/65">
              自动复投挖矿奖励，提升复利效率。当前已经把页面骨架接入 React，下一步只差真实 vault 合约地址和写链逻辑。
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] p-3 text-emerald-100">
            <TrendingUp className="mb-2" size={20} />
            <p className="text-sm font-bold">预估 APY {apy}%</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.18em] text-cyan-100/45">存入 LP 数量</span>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-lg font-black text-white outline-none"
              inputMode="decimal"
              onChange={(event) => setDepositAmt(event.target.value)}
              placeholder="0"
              value={depositAmt}
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-3">
            <NeonButton onClick={() => void deposit()} type="button">存入</NeonButton>
            <NeonButton className="bg-[linear-gradient(110deg,#ffd166,#ff9f1c_48%,#ff3bd4)]" onClick={() => void compound()} type="button">
              一键复利
            </NeonButton>
            <NeonButton className="bg-[linear-gradient(110deg,#8d4dff,#ff3bd4_48%,#ff6b6b)]" onClick={() => void withdraw()} type="button">
              提取
            </NeonButton>
          </div>
        </div>

        {status ? (
          <p className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-3 text-sm text-cyan-100">
            {status}
          </p>
        ) : null}
      </NeonCard>

      <NeonCard variant="cyan">
        <p className="text-sm uppercase tracking-[0.18em] text-cyan-100/45">Wallet status</p>
        <div className="mt-4 grid gap-3 text-sm text-cyan-100/80">
          <div className="flex items-center gap-2">
            <Wallet size={16} />
            <span>当前钱包：{walletType ?? "未连接"}</span>
          </div>
          <div>地址：{address || "未连接"}</div>
          <div>Vault：{vaultAddr}</div>
          <div className="text-cyan-100/55">ABI 已准备：{vaultAbi.length} 个方法</div>
        </div>
      </NeonCard>
    </div>
  );
}
