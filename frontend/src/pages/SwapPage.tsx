import { SwapPanel } from "@/components/swap/SwapPanel";

export function SwapPage() {
  return (
    <div className="mx-auto max-w-2xl" data-testid="page-swap">
      <SwapPanel testIdPrefix="swap" />
    </div>
  );
}
