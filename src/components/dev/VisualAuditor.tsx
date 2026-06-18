import React, { useState } from 'react';
import { DesignTokens } from '@/lib/design-tokens';

/**
 * VisualAuditor — 像素级质量审计工具 (仅在开发环境开启)
 * 功能：暴露页面当前引用的 Token 数值，确保 1:1 对齐
 * 
 * PM 不需要看代码，对比设计图和浮窗数值即可。
 * 不一致 → 直接告诉 AI："cardPadding 从 24px 改成 28px"
 */
export const VisualAuditor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-cyan-500 text-black px-4 py-2 rounded-full font-bold text-xs"
      >
        {isVisible ? '关闭审计' : '开启视觉审计'}
      </button>

      {isVisible && (
        <div className="mt-2 p-4 bg-black/90 border border-cyan-500 rounded-lg text-xs text-white max-h-[400px] overflow-y-auto">
          <h3 className="font-bold text-cyan-400 mb-2">当前系统 Tokens</h3>
          <div className="space-y-2">
            {Object.entries(DesignTokens.spacing).map(([key, val]) => (
              <div key={key} className="flex justify-between">
                <span>{key}:</span>
                <span className="text-magenta-400">{val}</span>
              </div>
            ))}
            <hr className="border-gray-700" />
            {Object.entries(DesignTokens.colors).map(([key, val]) => (
              <div key={key} className="flex justify-between items-center gap-4">
                <span>{key}:</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: val as string }} />
                  <span className="text-magenta-400">{val}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
