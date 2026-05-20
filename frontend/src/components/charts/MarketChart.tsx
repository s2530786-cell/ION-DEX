import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import { useEffect, useRef } from "react";

export type MarketChartPoint = {
  time: number;
  value: number;
};

export type CandlePoint = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

/** Synthetic OHLC series when live klines are unavailable (dashboard fallback). */
export function buildSyntheticSeries(priceUsd: number, change24hPct: number): CandlePoint[] {
  const base = Number.isFinite(priceUsd) && priceUsd > 0 ? priceUsd : 1;
  const drift = Number.isFinite(change24hPct) ? change24hPct / 100 : 0;
  const now = Math.floor(Date.now() / 1000);
  const bars = 48;
  const points: CandlePoint[] = [];
  let last = base * (1 - drift * 0.35);
  for (let index = 0; index < bars; index += 1) {
    const step = (drift / bars) * (0.6 + Math.sin(index * 0.45) * 0.25);
    const open = last;
    const close = open * (1 + step);
    const high = Math.max(open, close) * (1 + 0.004);
    const low = Math.min(open, close) * (1 - 0.004);
    points.push({ time: now - (bars - index) * 3600, open, high, low, close });
    last = close;
  }
  return points;
}

export function MarketChart({
  points,
  candles,
  mode = "area",
  testId = "market-chart",
}: {
  points?: MarketChartPoint[];
  candles?: CandlePoint[];
  mode?: "area" | "candle";
  testId?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const areaRef = useRef<ISeriesApi<"Area", Time> | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick", Time> | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(198, 244, 255, 0.72)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.12)" },
      timeScale: { borderColor: "rgba(255,255,255,0.12)" },
      height: 280,
    });

    chartRef.current = chart;

    if (mode === "candle") {
      candleRef.current = chart.addSeries(CandlestickSeries, {
        upColor: "#24f7ff",
        downColor: "#ff3bd4",
        borderVisible: false,
        wickUpColor: "#24f7ff",
        wickDownColor: "#ff3bd4",
      });
    } else {
      areaRef.current = chart.addSeries(AreaSeries, {
        lineColor: "#24f7ff",
        topColor: "rgba(36, 247, 255, 0.35)",
        bottomColor: "rgba(36, 247, 255, 0.02)",
      });
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      chart.applyOptions({ width: entry.contentRect.width });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      areaRef.current = null;
      candleRef.current = null;
    };
  }, [mode]);

  useEffect(() => {
    if (mode === "candle" && candleRef.current && candles && candles.length > 0) {
      candleRef.current.setData(
        candles.map((bar) => ({
          time: bar.time as Time,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
        })),
      );
      chartRef.current?.timeScale().fitContent();
      return;
    }
    if (mode === "area" && areaRef.current && points && points.length > 0) {
      areaRef.current.setData(
        points.map((point) => ({
          time: point.time as Time,
          value: point.value,
        })),
      );
      chartRef.current?.timeScale().fitContent();
    }
  }, [candles, mode, points]);

  return (
    <div
      className="relative h-[17.5rem] w-full overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/30"
      data-testid={testId}
      ref={containerRef}
    />
  );
}
