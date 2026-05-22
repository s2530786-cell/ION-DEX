import { DataProvenanceBadge } from "@/components/ui/DataProvenanceBadge";
import { GlassPanel } from "@/components/ui/glass/GlassPanel";
import { useMarketOrderBook } from "@/hooks/useMarketSurface";

type OrderBookPanelProps = {
  symbol?: string;
  testId?: string;
  listTestId?: string;
  provenanceTestId?: string;
};

export function OrderBookPanel({
  symbol = "BNB/ION",
  testId = "orderbook-panel",
  listTestId = "orderbook",
  provenanceTestId = "orderbook-provenance",
}: OrderBookPanelProps) {
  const { book, loadState, provenanceLabel } = useMarketOrderBook(symbol);

  return (
    <GlassPanel eyebrow="Depth" testId={testId} title="Order book">
      {loadState === "loading" ? <p className="text-xs text-cyan-100/55">Loading order book…</p> : null}
      {loadState === "error" ? <p className="text-xs text-rose-200">Order book unavailable</p> : null}
      <div className="grid gap-2" data-testid={listTestId}>
        {loadState === "ready" && book
          ? book.levels.map((row) => (
              <div
                key={`${row.side}-${row.price}`}
                className="relative overflow-hidden rounded-2xl bg-white/[0.04] px-4 py-3"
              >
                <span
                  className={`absolute inset-y-0 right-0 ${row.side === "ask" ? "bg-rose-300/[0.08]" : "bg-emerald-300/[0.08]"}`}
                  style={{ width: row.depth }}
                />
                <span className="relative grid grid-cols-3 gap-2 text-sm">
                  <strong className={row.side === "ask" ? "text-rose-200" : "text-emerald-200"}>
                    {row.price}
                  </strong>
                  <span className="text-cyan-100/70">{row.amount}</span>
                  <span className="text-right text-cyan-100/45">{row.depth}</span>
                </span>
              </div>
            ))
          : null}
      </div>
      {provenanceLabel ? (
        <DataProvenanceBadge className="mt-2" label={provenanceLabel} testId={provenanceTestId} />
      ) : null}
    </GlassPanel>
  );
}
