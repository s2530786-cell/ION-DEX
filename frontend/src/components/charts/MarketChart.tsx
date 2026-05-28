import {
  AreaSeries,
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

/** lightweight-charts requires strictly ascending time; upstream OHLCV may be newest-first. */
export function normalizeChartPoints(points: MarketChartPoint[]): MarketChartPoint[] {
  if (points.length <= 1) {
    return points;
  }
  const sorted = [...points].sort((a, b) => a.time - b.time);
  const normalized: MarketChartPoint[] = [];
  for (const point of sorted) {
    const last = normalized[normalized.length - 1];
    if (last && last.time === point.time) {
      normalized[normalized.length - 1] = point;
    } else {
      normalized.push(point);
    }
  }
  return normalized;
}

export function MarketChart({
  points,
  testId = "market-chart",
}: {
  points: MarketChartPoint[];
  testId?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area", Time> | null>(null);

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

    const series = chart.addSeries(AreaSeries, {
      lineColor: "#00ffff",
      topColor: "rgba(36, 247, 255, 0.35)",
      bottomColor: "rgba(36, 247, 255, 0.02)",
    });

    chartRef.current = chart;
    seriesRef.current = series;

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
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || points.length === 0) {
      return;
    }
    const normalized = normalizeChartPoints(points);
    seriesRef.current.setData(
      normalized.map((point) => ({
        time: point.time as Time,
        value: point.value,
      })),
    );
    chartRef.current?.timeScale().fitContent();
  }, [points]);

  return (
    <div
      className="pointer-events-none relative h-[17.5rem] w-full overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/30"
      data-testid={testId}
      ref={containerRef}
    />
  );
}

export function klinesToChartPoints(
  candles: Array<{ time: number; close: number }>,
): MarketChartPoint[] {
  return normalizeChartPoints(
    candles.map((candle) => ({
      time: candle.time,
      value: candle.close,
    })),
  );
}

export function buildSyntheticSeries(basePrice: number, changePct: number): MarketChartPoint[] {
  const now = Math.floor(Date.now() / 1000);
  const drift = changePct / 100;
  const points: MarketChartPoint[] = [];

  for (let index = 47; index >= 0; index -= 1) {
    const wave = Math.sin(index / 4) * 0.018 + Math.cos(index / 9) * 0.012;
    const trend = drift * ((47 - index) / 47);
    const value = basePrice * (1 + trend + wave);
    points.push({ time: now - index * 3600, value: Number(value.toFixed(4)) });
  }

  return points;
}
