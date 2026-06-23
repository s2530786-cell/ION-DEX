import type { PropsWithChildren } from "react";

/**
 * CyberCard — Master 2026-05-22 spec
 *
 * 赛博朋克风卡片容器
 * - 毛玻璃 backdrop-blur-2xl
 * - 切角 clip-path (工业赛博标志)
 * - 呼吸边框 borderPulse animation
 * - 霓虹外发光
 * - 可选扫描线纹理
 * - 可选装饰参数标签 (SYS-ID / LATENCY / CHAIN-SEC)
 */

type CyberCardProps = PropsWithChildren<{
  className?: string;
  /** Breathing border pulse: default true */
  pulse?: boolean;
  /** Chamfered corners (clip-path): default true */
  chamfer?: boolean;
  /** Scanline overlay texture: default true */
  scanline?: boolean;
  /** Decorative param label in top-left */
  sysId?: string;
  /** Decorative param label in top-right */
  latency?: string;
  /** Decorative param label in bottom-right */
  chainSec?: string;
}>;

export function CyberCard({
  children,
  className = "",
  pulse = true,
  chamfer = true,
  scanline = true,
  sysId,
  latency,
  chainSec,
}: CyberCardProps) {
  return (
    <div
      className={`relative ${className} ${pulse ? "animate-border-pulse" : ""}`}
      style={{
        background: "rgba(15, 15, 25, 0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(0, 255, 245, 0.3)",
        padding: "2rem",
        position: "relative",
        ...(chamfer
          ? {
              clipPath:
                "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
            }
          : {}),
      }}
    >
      {/* Decorative param labels */}
      {sysId && (
        <span
          className="absolute left-2 top-1 text-[10px] tracking-[0.2em]"
          style={{ color: "rgba(0, 255, 245, 0.45)", fontFamily: "monospace" }}
        >
          {sysId}
        </span>
      )}
      {latency && (
        <span
          className="absolute right-2 top-1 text-[10px] tracking-[0.2em]"
          style={{ color: "rgba(0, 255, 245, 0.35)", fontFamily: "monospace" }}
        >
          {latency}
        </span>
      )}
      {chainSec && (
        <span
          className="absolute bottom-1 right-2 text-[10px] tracking-[0.2em]"
          style={{ color: "rgba(255, 0, 255, 0.35)", fontFamily: "monospace" }}
        >
          {chainSec}
        </span>
      )}

      {/* Scanline overlay */}
      {scanline && (
        <div
          className="pointer-events-none absolute inset-0 z-[9999] overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="animate-scanline absolute h-full w-full"
            style={{
              background:
                "repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,255,245,0.03) 2px, rgba(0,255,245,0.03) 4px)",
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
