import { TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { ScaffoldNotice } from "@/components/ui/ScaffoldNotice";
import { useWalletAggregator } from "@/hooks/useWalletAggregator";

const configuredVaultAddress = import.meta.env.VITE_VAULT_CONTRACT_ADDRESS?.trim() ?? "";

export function VaultStakePage() {
  const { signer, walletType, address } = useWalletAggregator();
  const [depositAmt, setDepositAmt] = useState("0");
  const demoApy = 46.8;
  const [status, setStatus] = useState<string | null>(null);

  const vaultConfigured = configuredVaultAddress.length > 0;

  const vaultLabel = useMemo(
    () => (vaultConfigured ? configuredVaultAddress : "未配置（设置 VITE_VAULT_CONTRACT_ADDRESS）"),
    [vaultConfigured],
  );

  async function deposit() {
    if (!signer) {
      setStatus("请先连接 EVM 钱包后再操作。");
      return;
    }
    if (!vaultConfigured) {
      setStatus("Vault 合约地址未配置，无法发起存入。");
      return;
    }
    setStatus(`[预览] 已校验表单，未向 ${configuredVaultAddress} 发送 deposit 交易。`);
  }

  async function compound() {
    if (!signer) {
      setStatus("请先连接 EVM 钱包后再操作。");
      return;
    }
    if (!vaultConfigured) {
      setStatus("Vault 合约地址未配置，无法发起 compound。");
      return;
    }
    setStatus("[预览] 未发送 compound 链上交易。");
  }

  async function withdraw() {
    if (!signer) {
      setStatus("请先连接 EVM 钱包后再操作。");
      return;
    }
    if (!vaultConfigured) {
      setStatus("Vault 合约地址未配置，无法发起提取。");
      return;
    }
    setStatus(`[预览] 未向 vault 发送 withdraw(${depositAmt}) 交易。`);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_20rem]" data-testid="page-vault-stake">
      <div className="xl:col-span-2">
        <ScaffoldNotice
          detail="机枪池 UI 为 scaffold：APY 为演示值，deposit/compound/withdraw 未接 vault 合约写入。"
          testId="vault-stake-scaffold-notice"
        />
      </div>
      <NeonCard variant="gold">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-100/60">Vault Auto-Compound</p>
            <h1 className="mt-2 text-3xl font-black text-white">机枪池 · 自动复利质押</h1>
            <p className="mt-2 text-sm text-cyan-100/65">
              页面骨架已接入 React；需配置 vault 合约地址并接 writeContract 后才可上链。
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] p-3 text-emerald-100">
            <TrendingUp className="mb-2" size={20} />
            <p className="text-sm font-bold">演示 APY {demoApy}%</p>
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
            <NeonButton disabled={!vaultConfigured} onClick={() => void deposit()} type="button">
              预览存入
            </NeonButton>
            <NeonButton
              className="bg-[linear-gradient(110deg,#ffd166,#ff9f1c_48%,#ff3bd4)]"
              disabled={!vaultConfigured}
              onClick={() => void compound()}
              type="button"
            >
              预览复利
            </NeonButton>
            <NeonButton
              className="bg-[linear-gradient(110deg,#8d4dff,#ff3bd4_48%,#ff6b6b)]"
              disabled={!vaultConfigured}
              onClick={() => void withdraw()}
              type="button"
            >
              预览提取
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
          <div>Vault：{vaultLabel}</div>
          <div className="text-cyan-100/55">
            {vaultConfigured ? "合约地址已配置，链上写入尚未接入。" : "缺少 VITE_VAULT_CONTRACT_ADDRESS。"}
          </div>
        </div>
      </NeonCard>
    </div>
  );
}
