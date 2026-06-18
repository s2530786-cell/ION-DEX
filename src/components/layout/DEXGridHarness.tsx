import React from 'react';

/**
 * DEXGridHarness — ION-DEX 仪表盘强制栅格底座
 * 
 * 铁律：所有页面必须包裹在此组件中，使用 Grid 布局。
 * 禁止使用 fixed/absolute 进行页面排版。
 * 
 * 布局：左侧栏 350px | 中间内容区 1fr | 右侧栏 300px
 */
export const DEXGridHarness: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="grid min-h-screen p-6"
    style={{
      display: 'grid',
      gridTemplateColumns: '350px 1fr 300px',
      gridTemplateRows: 'auto 1fr',
      gap: '20px',
      background: 'radial-gradient(circle at center, #1e0a3c 0%, #000 100%)',
    }}
  >
    {children}
  </div>
);
