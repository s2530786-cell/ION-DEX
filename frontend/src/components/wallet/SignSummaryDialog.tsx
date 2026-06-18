import { useMemo } from "react";
import {
  assetSignSummaryToPayload,
  buildSignSummaryPayload,
  type AssetSignSummary,
} from "@/wallet/signSummary";
import { NeonCard } from "@/components/ui/NeonCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { useI18n } from "@/i18n/I18nProvider";

export function SignSummaryDialog({
  open,
  onClose,
  onCancel,
  onConfirm,
  payload,
  summary,
  busy = false,
}: {
  open: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm?: () => void;
  payload?: unknown;
  summary?: AssetSignSummary | null;
  busy?: boolean;
}) {
  const { isZh } = useI18n();
  const built = useMemo(() => {
    if (summary) {
      return assetSignSummaryToPayload(summary, isZh ? "zh-CN" : "en-US");
    }
    return buildSignSummaryPayload(payload, isZh ? "zh-CN" : "en-US");
  }, [isZh, payload, summary]);

  if (!open) {
    return null;
  }

  const dismiss = onCancel ?? onClose ?? (() => undefined);
  const confirm = onConfirm;

  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-black/60 p-6"
      data-testid="sign-summary-dialog"
    >
      <div className="w-full max-w-xl">
        <NeonCard variant="mixed">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.36em] text-cyan-200/70">{isZh ? "钱包" : "Wallet"}</p>
              <h2 className="mt-2 text-2xl font-black text-white">{built.title}</h2>
            </div>
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              onClick={dismiss}
              type="button"
            >
              {isZh ? "关闭" : "Close"}
            </button>
          </div>

          {built.items.length > 0 ? (
            <div className="mt-6 grid gap-3">
              {built.items.map((row) => (
                <div
                  className="flex items-center justify-between gap-6 rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                  key={row.label}
                >
                  <span className="text-sm text-cyan-100/70">{row.label}</span>
                  <span className="text-sm font-semibold text-white">{row.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-cyan-100/60">
              {isZh ? "这次签名请求没有提供结构化摘要。" : "This signature request did not include a structured summary."}
            </p>
          )}

          {confirm ? (
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <NeonButton
                className="bg-white/10 shadow-none hover:shadow-none"
                disabled={busy}
                onClick={dismiss}
                type="button"
              >
                {isZh ? "取消" : "Cancel"}
              </NeonButton>
              <NeonButton data-testid="sign-summary-confirm" disabled={busy} onClick={confirm} type="button">
                {busy ? (isZh ? "签名中…" : "Signing…") : isZh ? "确认" : "Confirm"}
              </NeonButton>
            </div>
          ) : null}
        </NeonCard>
      </div>
    </div>
  );
}
