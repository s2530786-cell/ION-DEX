import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { NeonButton } from "@/components/ui/NeonButton";
import { NeonCard } from "@/components/ui/NeonCard";
import { ScaffoldNotice } from "@/components/ui/ScaffoldNotice";

type ApprovalItem = {
  contract: string;
  allowance: string;
  flaggedUnlimited: boolean;
};

/** Demo allowance rows — not on-chain allowance scan. */
const DEMO_APPROVALS: ApprovalItem[] = [
  {
    contract: "0x1111111111111111111111111111111111111111",
    allowance: "无限",
    flaggedUnlimited: true,
  },
  {
    contract: "0x2222222222222222222222222222222222222222",
    allowance: "2500 ION",
    flaggedUnlimited: false,
  },
  {
    contract: "0x3333333333333333333333333333333333333333",
    allowance: "无限",
    flaggedUnlimited: true,
  },
];

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function ApproveManagerPage() {
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
    setMessage(`[演示] 已将 ${shortenAddress(contract)} 在本地列表中标记为 0，未发送链上 revoke 交易。`);
  }

  function revokeAll() {
    setApproveList((current) =>
      current.map((item) =>
        item.flaggedUnlimited ? { ...item, allowance: "0", flaggedUnlimited: false } : item,
      ),
    );
    setMessage("[演示] 已批量清理本地列表中的“无限授权”标记，未发送链上交易。");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_20rem]" data-testid="page-approve-manager">
      <div className="xl:col-span-2">
        <ScaffoldNotice
          detail="下方合约为演示数据；撤销操作仅更新本地 state，未查询 BSC allowance 或发起 revoke 签名。"
          testId="approve-manager-scaffold-notice"
        />
      </div>
      <NeonCard variant="magenta">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-100/60">Approval Safety</p>
            <h1 className="mt-2 text-3xl font-black text-white">授权安全管理</h1>
            <p className="mt-2 text-sm text-cyan-100/65">
              授权安全 UX 骨架。真实 allowance 扫描与 revoke 签名尚未接入。
            </p>
          </div>
          {unlimitedCount > 0 ? (
            <div className="rounded-2xl border border-amber-300/25 bg-amber-300/[0.08] p-3 text-amber-100">
              <ShieldAlert className="mb-2" size={20} />
              <p className="text-sm font-bold">风险项 {unlimitedCount}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] p-3 text-emerald-100">
              <ShieldCheck className="mb-2" size={20} />
              <p className="text-sm font-bold">当前无无限授权</p>
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
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/45">Contract</p>
                <p className="mt-1 font-mono text-sm text-white">{item.contract}</p>
                <p
                  className={`mt-2 text-sm font-bold ${
                    item.flaggedUnlimited ? "text-amber-200" : "text-cyan-100/80"
                  }`}
                >
                  {item.allowance === "无限" ? "⚠️ 无限授权" : `Allowance: ${item.allowance}`}
                </p>
              </div>
              <NeonButton className="px-4 py-2 text-xs sm:w-auto" onClick={() => revoke(item.contract)} type="button">
                撤销授权
              </NeonButton>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <NeonButton className="px-5 py-3 text-sm" onClick={revokeAll} type="button">
            一键清理所有无限授权
          </NeonButton>
          {message ? <p className="text-sm text-emerald-200">{message}</p> : null}
        </div>
      </NeonCard>

      <NeonCard variant="gold">
        <p className="text-sm uppercase tracking-[0.18em] text-cyan-100/45">Roadmap</p>
        <ul className="mt-4 grid gap-3 text-sm text-cyan-100/75">
          <li>1. 接 allowance 扫描 API</li>
          <li>2. 标记 spender 风险等级</li>
          <li>3. 批量 revoke 钱包签名</li>
          <li>4. 接入真实交易授权列表</li>
        </ul>
      </NeonCard>
    </div>
  );
}
