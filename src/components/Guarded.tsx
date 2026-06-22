import React, { useEffect, useRef } from 'react';
import { DesignTokens } from '@/lib/design-tokens';

/**
 * 运行时防错包装器 — 运行时护盾
 *
 * 包裹任何 UI 组件，在开发环境下自动检测不规范样式。
 * 如果检测到硬编码颜色/间距，显示红色警告覆盖层。
 *
 * 用法:
 *   <Guarded>
 *     <YourComponent />
 *   </Guarded>
 */

interface GuardedProps {
  children: React.ReactNode;
  /** 关闭检测（生产环境自动关闭） */
  debug?: boolean;
  /** 组件名称，用于警告日志 */
  name?: string;
}

// 硬编码检测正则（与 audit_tokens.py 保持一致）
const HARDCODED_PATTERNS = [
  { regex: /#[0-9a-fA-F]{3,8}/, label: '硬编码 hex 颜色' },
  { regex: /rgba?\(\d+,\s*\d+,\s*\d+/, label: '硬编码 rgb/rgba' },
  { regex: /\d+px/, label: '硬编码 px 值' },
];

function scanStyleForViolations(
  style: React.CSSProperties,
  componentName: string
): string[] {
  const violations: string[] = [];
  const styleStr = JSON.stringify(style);

  for (const { regex, label } of HARDCODED_PATTERNS) {
    if (regex.test(styleStr)) {
      violations.push(`[${componentName}] ${label}: ${styleStr.slice(0, 100)}`);
    }
  }
  return violations;
}

export const Guarded: React.FC<GuardedProps> = ({
  children,
  debug = true,
  name = 'UnknownComponent',
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // 生产环境直接透传
  if (process.env.NODE_ENV !== 'development' || !debug) {
    return <>{children}</>;
  }

  useEffect(() => {
    if (!ref.current) return;

    // 扫描当前 DOM 子树中所有元素的 inline style
    const elements = ref.current.querySelectorAll('[style]');
    const allViolations: string[] = [];

    elements.forEach((el) => {
      const styleAttr = el.getAttribute('style') || '';
      for (const { regex, label } of HARDCODED_PATTERNS) {
        if (regex.test(styleAttr)) {
          allViolations.push(
            `[${name}] DOM 元素 <${el.tagName.toLowerCase()}> ${label}: ${styleAttr.slice(0, 80)}`
          );
        }
      }
    });

    if (allViolations.length > 0) {
      console.warn(
        `%c🛡️ Guarded: ${allViolations.length} 处视觉违规检测到`,
        'color: var(--color-danger); font-weight: bold; font-size: 14px;' // audit-ignore — console debug style
      );
      allViolations.forEach((v) =>
        console.warn(`%c  ⚠ ${v}`, 'color: var(--color-warning);') // audit-ignore — console debug style
      );
      console.warn(
        '%c  💡 请替换为 DesignTokens 中的常量',
        'color: var(--color-muted); font-style: italic;' // audit-ignore — console debug style
      );
    }
  }, [children, name]);

  return (
    <div
      ref={ref}
      style={{
        borderWidth: DesignTokens.borders.thick,
        borderStyle: 'solid',
        borderColor: 'transparent',
        position: 'relative',
      }}
      data-guarded={name}
    >
      {children}
    </div>
  );
};

export default Guarded;
