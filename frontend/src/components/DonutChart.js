import React, { useRef, useEffect } from "react";

// Canvas donut/pie chart. data: [{label, value, color}]
export default function DonutChart({ data = [], size = 220, thickness = 28, centerLabel, centerValue }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 6;
    let start = -Math.PI / 2;
    data.forEach((d) => {
      const angle = (d.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, start, start + angle);
      ctx.strokeStyle = d.color;
      ctx.lineWidth = thickness;
      ctx.lineCap = "butt";
      ctx.shadowColor = d.color;
      ctx.shadowBlur = 12;
      ctx.stroke();
      start += angle;
    });
    ctx.shadowBlur = 0;
    if (centerValue) {
      ctx.fillStyle = "#f8fbff";
      ctx.font = "800 22px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(centerValue, cx, cy + 2);
    }
    if (centerLabel) {
      ctx.fillStyle = "rgba(248,251,255,0.55)";
      ctx.font = "400 11px Sora, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(centerLabel, cx, cy + 22);
    }
  }, [data, size, thickness, centerLabel, centerValue]);

  return <canvas ref={ref} style={{ width: size, height: size }} data-testid="donut-chart" />;
}
