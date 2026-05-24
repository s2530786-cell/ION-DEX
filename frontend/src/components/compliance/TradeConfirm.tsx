import { NeonButton } from "@/components/ui/NeonButton";

export type TradeConfirmProps = {
  open: boolean;
  paySymbol: string;
  receiveSymbol: string;
  payAmount: string;
  receiveAmount: string;
  /** When true, confirm only runs preview callback — no chain submit. */
  previewOnly?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Pre-trade confirmation dialog ported from Doubao TradeConfirm.vue (preview-safe). */
export function TradeConfirm({
  open,
  paySymbol,
  receiveSymbol,
  payAmount,
  receiveAmount,
  previewOnly = true,
  onConfirm,
  onCancel,
}: TradeConfirmProps) {
  if (!open) {
    return null;
  }

  const description = `将支付 ${payAmount} ${paySymbol}，预计获得 ${receiveAmount} ${receiveSymbol}。`;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      data-testid="trade-confirm-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trade-confirm-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12162a] p-6 text-white shadow-[0_0_32px_rgba(255,59,212,0.15)]">
        <h3 className="text-lg font-black text-white" id="trade-confirm-title">
          确认交易 / Confirm Trade
        </h3>
        <p className="mt-3 text-sm text-cyan-100/80">{description}</p>
        <p className="mt-2 text-sm text-cyan-100/65">Swap fee reference: 0.20%. On-chain actions cannot be reversed.</p>
        {previewOnly ? (
          <p className="mt-2 text-xs text-amber-200/90">[预览] 确认后不会发送链上或后端订单。</p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <NeonButton className="flex-1 bg-white/10 shadow-none" onClick={onCancel} type="button">
            取消
          </NeonButton>
          <NeonButton className="flex-1" onClick={onConfirm} type="button">
            {previewOnly ? "确认预览" : "确认提交"}
          </NeonButton>
        </div>
      </div>
    </div>
  );
}
