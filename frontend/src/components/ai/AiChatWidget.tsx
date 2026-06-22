import { Bot, X } from "lucide-react";
import { useCallback, useState } from "react";

const QNA: Array<{ q: string; a: string }> = [
  {
    q: "What is ION DEX?",
    a: "ION DEX is the official decentralized exchange for the Ice Open Network. Swap ION/WBNB, provide liquidity, stake, track burns, and bridge assets between ION Chain and BSC.",
  },
  {
    q: "How do I swap ION?",
    a: "Connect your wallet (MetaMask, OKX, or ION extension), select the token pair, enter an amount, and click Swap. All fees are paid in ION.",
  },
  {
    q: "What is the ION burn?",
    a: "ION has a dual-chain burn mechanism on both BSC and ION mainnet. Every transaction burns a small percentage of ION, permanently reducing supply. Track burns on the Burn page.",
  },
  {
    q: "How does bridging work?",
    a: "Bridge ION between BSC and ION Chain via our relayer. Lock tokens on the source chain → relayer verifies → mint on the destination chain. Allow ~2-5 minutes.",
  },
  {
    q: "Where can I buy ION?",
    a: "ION is available on PancakeSwap (BSC) paired with WBNB. Connect your wallet and use the Swap page to exchange BNB for ION.",
  },
  {
    q: "Is this safe?",
    a: "ION DEX contracts undergo rigorous security testing (1,000+ simulated attacks). Always verify the URL is the official ION DEX, never share your private keys, and DYOR.",
  },
];

export function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <>
      {/* Floating button */}
      <button
        aria-label="AI Support"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/30 bg-[#061024]/80 shadow-[0_0_24px_rgba(36,247,255,0.35)] backdrop-blur-md transition hover:scale-110 hover:shadow-[0_0_36px_rgba(36,247,255,0.5)]"
        data-testid="ai-chat-toggle"
        onClick={toggle}
        type="button"
      >
        {open ? <X size={22} className="text-cyan-200" /> : <Bot size={24} className="text-cyan-200" />}
      </button>

      {/* Chat panel */}
      {open ? (
        <div
          className="fixed bottom-24 right-6 z-50 w-[min(22rem,calc(100vw-3rem))] rounded-2xl border border-cyan-300/25 bg-[#061024]/85 p-4 shadow-[0_0_40px_rgba(36,247,255,0.25)] backdrop-blur-xl"
          data-testid="ai-chat-panel"
        >
          <p className="mb-2 text-sm font-black text-cyan-200">
            AI Assistant
          </p>
          <p className="mb-4 text-xs text-cyan-100/55">
            Ask me anything about ION DEX.
          </p>

          {selected !== null ? (
            <button
              className="mb-3 text-left text-sm text-cyan-100/80 hover:text-white transition-colors"
              onClick={() => setSelected(null)}
              type="button"
            >
              ← Back to questions
            </button>
          ) : null}

          <div className="grid gap-2 max-h-[18rem] overflow-y-auto">
            {selected !== null ? (
              <div className="rounded-xl border border-cyan-300/15 bg-white/[0.06] p-3 text-sm text-cyan-100/90 leading-relaxed">
                {QNA[selected].a}
              </div>
            ) : (
              QNA.map((item, i) => (
                <button
                  key={i}
                  className="rounded-xl border border-cyan-300/15 bg-white/[0.04] px-4 py-3 text-left text-sm text-cyan-100/80 hover:bg-white/[0.08] hover:text-white transition text-balance"
                  onClick={() => setSelected(i)}
                  type="button"
                >
                  {item.q}
                </button>
              ))
            )}
          </div>

          <p className="mt-4 text-[0.65rem] text-cyan-100/30 text-right">
            ION DEX AI · v0.1
          </p>
        </div>
      ) : null}
    </>
  );
}
