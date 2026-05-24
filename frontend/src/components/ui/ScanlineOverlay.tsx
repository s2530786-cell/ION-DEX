/**
 * ScanlineOverlay — Master 2026-05-22
 *
 * 全屏扫描线覆盖层 (复古黑客屏效果)
 * - 从上到下缓慢漂移的线性渐变条纹
 * - 透明度极高，仅装饰
 * - pointer-events: none (不阻挡交互)
 * - 按皮肤主题控制显隐
 */

type ScanlineOverlayProps = {
  /** Show scanlines: default true */
  visible?: boolean;
  /** Scan speed in seconds: default 8 */
  speed?: number;
  /** Line opacity: default 0.03 */
  opacity?: number;
};

export function ScanlineOverlay({
  visible = true,
  speed = 8,
  opacity = 0.03,
}: ScanlineOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999]"
      aria-hidden="true"
    >
      <div
        className="animate-scanline h-full w-full"
        style={{
          background: `repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 2px,
            rgba(0, 255, 245, ${opacity}) 2px,
            rgba(0, 255, 245, ${opacity}) 4px
          )`,
          animationDuration: `${speed}s`,
        }}
      />
    </div>
  );
}
