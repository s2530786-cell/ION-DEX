/**
 * GlitchText — Master 2026-05-22 spec
 *
 * 赛博朋克故障风文字效果
 * - ::before / ::after 伪元素 clip-path 随机错位
 * - 霓虹 text-shadow
 * - 可选启用/关闭
 * - 等宽字体 (Courier New monospace)
 */

type GlitchTextProps = {
  text: string;
  enabled?: boolean;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span" | "p";
};

export function GlitchText({
  text,
  enabled = true,
  className = "",
  as: Tag = "span",
}: GlitchTextProps) {
  return (
    <Tag
      data-text={text}
      className={`relative ${className}`}
      style={
        enabled
          ? {
              color: "#fff",
              fontFamily: "'Courier New', monospace",
              letterSpacing: "2px",
              textShadow: "0 0 5px #00fff5",
              position: "relative",
            }
          : {
              color: "#fff",
              fontFamily: "'Courier New', monospace",
              letterSpacing: "2px",
            }
      }
    >
      {text}
      {enabled && (
        <>
          <style>{`
            [data-text="${text}"]::before,
            [data-text="${text}"]::after {
              content: attr(data-text);
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
            }
            [data-text="${text}"]::before {
              left: 2px;
              text-shadow: -2px 0 #FF00FF;
              animation: glitchBefore 2s infinite linear alternate-reverse;
            }
            [data-text="${text}"]::after {
              left: -2px;
              text-shadow: -2px 0 #00FFF5;
              animation: glitchAfter 3s infinite linear alternate-reverse;
            }
          `}</style>
        </>
      )}
    </Tag>
  );
}
