import { TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { ScaffoldNotice } from "@/components/ui/ScaffoldNotice";
import { useI18n } from "@/i18n/I18nProvider";
import { resolveVaultContractAddress } from "@/lib/integrationConfig";
import { useWalletAggregator } from "@/hooks/useWalletAggregator";

const configuredVaultAddress = resolveVaultContractAddress() ?? "";

export function VaultStakePage() {
  const { isZh } = useI18n();
  const { signer, walletType, address } = useWalletAggregator();
  const [depositAmt, setDepositAmt] = useState("0");
  const demoApy = 46.8;
  const [status, setStatus] = useState<string | null>(null);

  const vaultConfigured = configuredVaultAddress.length > 0;

  const vaultLabel = useMemo(
    () => (vaultConfigured ? configuredVaultAddress : isZh ? "未配置（设置 VITE_VAULT_CONTRACT_ADDRESS）" : "Not configured (set VITE_VAULT_CONTRACT_ADDRESS)"),
    [isZh, vaultConfigured],
  );

  async function deposit() {
    if (!signer) {
      setStatus(isZh ? "请先连接 EVM 钱包后再操作。" : "Connect an EVM wallet before continuing.");
      return;
    }
    if (!vaultConfigured) {
      setStatus(isZh ? "Vault 合约地址未配置，无法发起存入。" : "Vault contract address is not configured, so deposit cannot start.");
      return;
    }
    setStatus(
      isZh
        ? `[预览] 表单已校验，但还没有向 ${configuredVaultAddress} 发送 deposit 交易。`
        : `[Preview] Form validated, but no deposit transaction was sent to ${configuredVaultAddress}.`,
    );
  }

  async function compound() {
    if (!signer) {
      setStatus(isZh ? "请先连接 EVM 钱包后再操作。" : "Connect an EVM wallet before continuing.");
      return;
    }
    if (!vaultConfigured) {
      setStatus(isZh ? "Vault 合约地址未配置，无法发起复利操作。" : "Vault contract address is not configured, so compounding cannot start.");
      return;
    }
    setStatus(isZh ? "[预览] 尚未发送 compound 链上交易。" : "[Preview] No compound transaction was sent.");
  }

  async function withdraw() {
    if (!signer) {
      setStatus(isZh ? "请先连接 EVM 钱包后再操作。" : "Connect an EVM wallet before continuing.");
      return;
    }
    if (!vaultConfigured) {
      setStatus(isZh ? "Vault 合约地址未配置，无法发起提取。" : "Vault contract address is not configured, so withdrawal cannot start.");
      return;
    }
    setStatus(
      isZh
        ? `[预览] 尚未向 vault 发送 withdraw(${depositAmt}) 交易。`
        : `[Preview] No withdraw(${depositAmt}) transaction was sent to the vault.`,
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_20rem]" data-testid="page-vault-stake">
      <div className="xl:col-span-2">
        <ScaffoldNotice
          detail={
            isZh
              ? "机枪池 UI 仍是 scaffold：APY 为演示值，deposit / compound / withdraw 还没有接入 vault 合约写入。"
              : "The vault UI is still a scaffold: APY is a demo value, and deposit / compound / withdraw are not wired to live vault contract writes yet."
          }
          testId="vault-stake-scaffold-notice"
        />
      </div>
      <NeonCard variant="gold">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-100/60">
              {isZh ? "Vault 自动复利" : "Vault Auto-Compound"}
            </p>
            <h1 className="mt-2 text-3xl font-black text-white">
              {isZh ? "机枪池 · 自动复利质押" : "Vault Stake · Auto-Compound"}
            </h1>
            <p className="mt-2 text-sm text-cyan-100/65">
              {isZh
                ? "页面骨架已接入 React；配置 vault 合约地址并接入 writeContract 之后，才能真正上链。"
                : "The page shell is already wired in React; it needs a configured vault address and writeContract wiring before it can go on-chain."}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] p-3 text-emerald-100">
            <TrendingUp className="mb-2" size={20} />
            <p className="text-sm font-bold">{isZh ? `演示 APY ${demoApy}%` : `Demo APY ${demoApy}%`}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.18em] text-cyan-100/45">
              {isZh ? "存入 LP 数量" : "LP Deposit Amount"}
            </span>
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
              {isZh ? "预览存入" : "Preview Deposit"}
            </NeonButton>
            <NeonButton
              className="bg-[linear-gradient(110deg,#ffd166,#ff9f1c_48%,#ff3bd4)]"
              disabled={!vaultConfigured}
              onClick={() => void compound()}
              type="button"
            >
              {isZh ? "预览复利" : "Preview Compound"}
            </NeonButton>
            <NeonButton
              className="bg-[linear-gradient(110deg,#8d4dff,#ff3bd4_48%,#ff6b6b)]"
              disabled={!vaultConfigured}
              onClick={() => void withdraw()}
              type="button"
            >
              {isZh ? "预览提取" : "Preview Withdraw"}
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
        <p className="text-sm uppercase tracking-[0.18em] text-cyan-100/45">{isZh ? "钱包状态" : "Wallet Status"}</p>
        <div className="mt-4 grid gap-3 text-sm text-cyan-100/80">
          <div className="flex items-center gap-2">
            <Wallet size={16} />
            <span>{isZh ? `当前钱包：${walletType ?? "未连接"}` : `Current wallet: ${walletType ?? "Not connected"}`}</span>
          </div>
          <div>{isZh ? `地址：${address || "未连接"}` : `Address: ${address || "Not connected"}`}</div>
          <div>{`Vault: ${vaultLabel}`}</div>
          <div className="text-cyan-100/55">
            {vaultConfigured
              ? isZh
                ? "合约地址已配置，但链上写入还没有接通。"
                : "The contract address is configured, but on-chain write actions are not wired yet."
              : isZh
                ? "缺少 VITE_VAULT_CONTRACT_ADDRESS。"
                : "Missing VITE_VAULT_CONTRACT_ADDRESS."}
          </div>
        </div>
      </NeonCard>
    </div>
  );
}
