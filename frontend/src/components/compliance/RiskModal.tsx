import { useCallback, useEffect, useState } from "react";
import { NeonButton } from "@/components/ui/NeonButton";

const STORAGE_KEY = "ion-dex-risk-ack-v1";

/**
 * First-visit risk disclosure (Doubao bundle). Acknowledgement is stored locally only.
 * Fee figures are product disclosure copy — verify against live fee config before mainnet.
 * Clicking "我知道了" acknowledges and closes permanently via localStorage.
 */
export function RiskModal({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const [agreed, setAgreed] = useState(false);

  /* Safety net: sync open state with localStorage on every render cycle */
  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") {
        setOpen(false);
        onClose?.();
      }
    } catch {
      /* ignore */
    }
  }, []);

  const enterDex = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore quota / private mode
    }
    setOpen(false);
    onClose?.();
  }, []);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      data-testid="risk-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="risk-modal-title"
    >
      <div className="glass-surface w-full max-w-lg rounded-2xl p-6 shadow-neonCyan">
        <div className="relative rounded-[1.65rem] border border-white/10 bg-[linear-gradient(145deg,rgba(12,24,52,0.92),rgba(9,13,35,0.72)_48%,rgba(40,14,54,0.82))] p-6">
          <h2 className="text-xl font-black text-amber-100" id="risk-modal-title">
            ⚠️ Risk Warning / 风险提示
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-cyan-100/80">
            <p>This is a decentralized DEX interface for ION. On-chain transactions are irreversible once confirmed.</p>
            <p>
              Fee disclosure (verify on live config): swap ~0.20%; order-book trades ~0.15% platform fee. Figures may
              differ in production.
            </p>
            <p>Do not treat preview/scaffold pages as live trading. Trade at your own risk.</p>
          </div>
          <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-cyan-100/90">
            <input
              checked={agreed}
              className="mt-1 h-4 w-4 accent-cyan-300"
              onChange={(event) => setAgreed(event.target.checked)}
              type="checkbox"
            />
            <span>I have read and agree / 我已阅读并同意</span>
          </label>
          <div className="mt-5 flex gap-3">
            <NeonButton
              className="flex-1 disabled:opacity-40"
              disabled={!agreed}
              onClick={enterDex}
              type="button"
            >
              我知道了
            </NeonButton>
            <button
              className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-cyan-100/70 transition hover:bg-white/[0.12] hover:text-white"
              onClick={enterDex}
              type="button"
            >
              跳过 / Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
