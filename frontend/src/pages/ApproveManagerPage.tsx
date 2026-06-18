import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { ScaffoldNotice } from "@/components/ui/ScaffoldNotice";
import { useI18n } from "@/i18n/I18nProvider";
import { DEMO_APPROVAL_CONTRACTS } from "@/lib/integrationConfig";

type ApprovalItem = {
  contract: string;
  allowance: string;
  flaggedUnlimited: boolean;
};

/** Demo allowance rows - not on-chain allowance scan. */
const DEMO_APPROVALS: ApprovalItem[] = DEMO_APPROVAL_CONTRACTS.map((row) => ({ ...row }));

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ApproveManagerPage() {
  const { isZh } = useI18n();
  const [approveList, setApproveList] = useState<ApprovalItem[]>(DEMO_APPROVALS);
  const [message, setMessage] = useState<string | null>(null);

  const unlimitedCount = useMemo(
    () => approveList.filter((item) => item.flaggedUnlimited).length,
    [approveList],
  );

  function revoke(contract: string) {
    setApproveList((current) =>
      current.map((item) =>
        item.contract === contract
          ? { ...item, allowance: "0", flaggedUnlimited: false }
          : item,
      ),
    );
    setMessage(
      isZh
        ? `[演示] 已将 ${shortenAddress(contract)} 在本地列表中标记为 0，未发送链上 revoke 交易。`
        : `[Demo] Marked ${shortenAddress(contract)} as 0 in the local list. No on-chain revoke transaction was sent.`,
    );
  }

  function revokeAll() {
    setApproveList((current) =>
      current.map((item) =>
        item.flaggedUnlimited ? { ...item, allowance: "0", flaggedUnlimited: false } : item,
      ),
    );
    setMessage(
      isZh
        ? "[演示] 已批量清理本地列表中的“无限授权”标记，未发送链上交易。"
        : '[Demo] Cleared all "unlimited approval" flags in the local list. No on-chain transaction was sent.',
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_20rem]" data-testid="page-approve-manager">
      <div className="xl:col-span-2">
        <ScaffoldNotice
          detail={
            isZh
              ? "下方合约为演示数据；撤销操作只会更新本地 state，不会查询 BSC allowance 或发起 revoke 签名。"
              : "Contracts below are demo data. Revoke actions only update local state and do not query BSC allowances or request revoke signatures."
          }
          testId="approve-manager-scaffold-notice"
        />
      </div>
      <NeonCard variant="magenta">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-100/60">
              {isZh ? "授权安全" : "Approval Safety"}
            </p>
            <h1 className="mt-2 text-3xl font-black text-white">{isZh ? "授权安全管理" : "Approval Safety Manager"}</h1>
            <p className="mt-2 text-sm text-cyan-100/65">
              {isZh
                ? "授权安全 UX 骨架。真实 allowance 扫描与 revoke 钱包签名尚未接入。"
                : "Approval safety UX scaffold. Live allowance scanning and revoke wallet signing are not wired yet."}
            </p>
          </div>
          {unlimitedCount > 0 ? (
            <div className="rounded-2xl border border-amber-300/25 bg-amber-300/[0.08] p-3 text-amber-100">
              <ShieldAlert className="mb-2" size={20} />
              <p className="text-sm font-bold">{isZh ? `风险项 ${unlimitedCount}` : `${unlimitedCount} Risk Items`}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] p-3 text-emerald-100">
              <ShieldCheck className="mb-2" size={20} />
              <p className="text-sm font-bold">{isZh ? "当前无无限授权" : "No Unlimited Approvals"}</p>
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-3">
          {approveList.map((item) => (
            <div
              key={item.contract}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/45">
                  {isZh ? "合约" : "Contract"}
                </p>
                <p className="mt-1 font-mono text-sm text-white">{item.contract}</p>
                <p
                  className={`mt-2 text-sm font-bold ${
                    item.flaggedUnlimited ? "text-amber-200" : "text-cyan-100/80"
                  }`}
                >
                  {item.allowance === "无限"
                    ? isZh
                      ? "警告：无限授权"
                      : "Warning: Unlimited approval"
                    : `${isZh ? "授权额度" : "Allowance"}: ${item.allowance}`}
                </p>
              </div>
              <NeonButton className="px-4 py-2 text-xs sm:w-auto" onClick={() => revoke(item.contract)} type="button">
                {isZh ? "撤销授权" : "Revoke Approval"}
              </NeonButton>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <NeonButton className="px-5 py-3 text-sm" onClick={revokeAll} type="button">
            {isZh ? "一键清理所有无限授权" : "Clear All Unlimited Approvals"}
          </NeonButton>
          {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
        </div>
      </NeonCard>

      <NeonCard variant="gold">
        <p className="text-sm uppercase tracking-[0.18em] text-cyan-100/45">{isZh ? "路线图" : "Roadmap"}</p>
        <ul className="mt-4 grid gap-3 text-sm text-cyan-100/75">
          <li>{isZh ? "1. 接 allowance 扫描 API" : "1. Wire allowance scan API"}</li>
          <li>{isZh ? "2. 标记 spender 风险等级" : "2. Classify spender risk levels"}</li>
          <li>{isZh ? "3. 批量 revoke 钱包签名" : "3. Batch revoke wallet signing"}</li>
          <li>{isZh ? "4. 接入真实交易授权列表" : "4. Integrate live trade approval list"}</li>
        </ul>
      </NeonCard>
    </div>
  );
}
