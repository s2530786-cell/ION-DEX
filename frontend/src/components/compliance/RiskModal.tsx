import { useEffect, useState } from "react";
import { NeonButton } from "@/components/ui/NeonButton";

const STORAGE_KEY = "ion-dex-risk-ack-v1";

type RiskModalProps = {
  storageKey?: string;
};

/**
 * First-visit risk disclosure (Doubao bundle). Acknowledgement is stored locally only.
 * Fee figures are product disclosure copy — verify against live fee config before mainnet.
 */
export function RiskModal({ storageKey = STORAGE_KEY }: RiskModalProps) {
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      setOpen(stored !== "1");
    } catch {
      setOpen(true);
    }
  }, [storageKey]);

  function enterDex() {
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // ignore quota / private mode
    }
    setOpen(false);
  }

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
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#12162a] p-6 text-white shadow-[0_0_40px_rgba(36,247,255,0.12)]">
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
        <NeonButton
          className="mt-5 w-full disabled:opacity-40"
          disabled={!agreed}
          onClick={enterDex}
          type="button"
        >
          Enter DEX
        </NeonButton>
      </div>
    </div>
  );
}
