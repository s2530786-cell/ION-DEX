import { CandlestickSeries, createChart, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import { useEffect, useRef } from "react";
import type { MarketCandle } from "@/lib/ionApi";

function safeRemoveChart(chart: IChartApi | null) {
  if (!chart) {
    return;
  }
  try {
    chart.remove();
  } catch {
    // React Strict Mode teardown can race with chart DOM cleanup.
  }
}

type IonCandleChartProps = {
  candles: MarketCandle[];
  loadState: "idle" | "loading" | "ready" | "error";
  testId?: string;
  className?: string;
};

export function IonCandleChart({
  candles,
  loadState,
  testId = "market-candle-chart",
  className = "",
}: IonCandleChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) {
      return;
    }

    const chart = createChart(host, {
      layout: {
        background: { color: "transparent" },
        textColor: "rgba(200, 240, 255, 0.72)",
      },
      grid: {
        vertLines: { color: "rgba(36, 247, 255, 0.06)" },
        horzLines: { color: "rgba(36, 247, 255, 0.06)" },
      },
      rightPriceScale: {
        borderColor: "rgba(36, 247, 255, 0.18)",
      },
      timeScale: {
        borderColor: "rgba(36, 247, 255, 0.18)",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: "rgba(255, 59, 212, 0.45)" },
        horzLine: { color: "rgba(36, 247, 255, 0.45)" },
      },
      autoSize: true,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#34d399",
      downColor: "#fb7185",
      borderUpColor: "#6ee7b7",
      borderDownColor: "#fda4af",
      wickUpColor: "#34d399",
      wickDownColor: "#fb7185",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const { width, height } = entry.contentRect;
      chart.applyOptions({ width, height });
    });
    resizeObserver.observe(host);

    return () => {
      resizeObserver.disconnect();
      safeRemoveChart(chart);
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || loadState !== "ready" || candles.length === 0) {
      return;
    }

    seriesRef.current.setData(
      candles.map((candle) => ({
        time: candle.time as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })),
    );
    chartRef.current?.timeScale().fitContent();
  }, [candles, loadState]);

  const showChart = loadState === "ready" && candles.length > 0;

  return (
    <div
      className={`relative w-full min-h-[10rem] ${className}`}
      data-chart-ready={showChart ? "true" : "false"}
      data-testid={testId}
    >
      <div
        ref={containerRef}
        className={`h-full min-h-[10rem] w-full ${showChart ? "opacity-100" : "opacity-0"}`}
      />
      {loadState === "loading" ? (
        <p
          className="absolute inset-0 z-10 grid place-items-center text-sm text-cyan-100/60"
          data-testid={`${testId}-loading`}
        >
          Loading candles…
        </p>
      ) : null}
      {loadState === "error" ? (
        <p
          className="absolute inset-0 z-10 grid place-items-center text-sm text-rose-200"
          data-testid={`${testId}-error`}
        >
          Candle feed unavailable
        </p>
      ) : null}
    </div>
  );
}
