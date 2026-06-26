import React, { useState } from 'react';

// ============================================================================
// 【P0 级核心定义】严格契合链上状态的数据模型
// ============================================================================
export type NodeType = 'wallet' | 'pool' | 'bridge' | 'target';
export type ChainType = 'ION' | 'ETH' | 'BSC';
export type RouteStatus = 'completed' | 'active' | 'pending' | 'failed';

export interface TopologyNode {
  id: string;
  type: NodeType;
  chain: ChainType;
  label: string;
  subLabel: string;
  status: RouteStatus;
  x: number; // 相对百分比或固定画布坐标
  y: number;
}

export interface TopologyLink {
  id: string;
  sourceId: string;
  targetId: string;
  status: RouteStatus;
  txHash?: string;
  tokenSymbol: string;
  amount: string;
}

interface RouteTopologyGraphProps {
  nodes: TopologyNode[];
  links: TopologyLink[];
  activeStepIndex: number;
}

export const RouteTopologyGraph: React.FC<RouteTopologyGraphProps> = ({
  nodes,
  links,
  activeStepIndex,
}) => {
  const [hoveredNode, setHoveredNode] = useState<TopologyNode | null>(null);
  const [hoveredLink, setHoveredLink] = useState<TopologyLink | null>(null);

  // 根据链类型返回对应的 Stitch 规范霓虹色彩标记
  const getChainColor = (chain: ChainType) => {
    switch (chain) {
      case 'ION': return '#00FFFF';    // 极光青
      case 'ETH': return '#FF007A';    // 霓虹洋红
      case 'BSC': return '#F3BA2F';    // 币安金
      default: return '#94A3B8';
    }
  };

  const getStatusColor = (status: RouteStatus) => {
    switch (status) {
      case 'completed': return '#00FF66'; // 安全绿
      case 'active': return '#00FFFF';    // 核心流转青
      case 'pending': return 'rgba(255, 255, 255, 0.2)';
      case 'failed': return '#FF4466';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  };

  return (
    <div 
      className="w-full rounded-[24px] border p-6 overflow-hidden relative select-none"
      style={{
        backgroundColor: 'rgba(5, 8, 17, 0.85)', // Deep Space Mesh 底色
        backdropFilter: 'blur(18px) saturate(180%)', // Stitch 增强材质特性
        borderColor: 'rgba(255, 0, 122, 0.15)', // 洋红边缘微光
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), inset 0 1px 2px rgba(255,255,255,0.05)'
      }}
    >
      {/* 注入全局原生 SVG 跑马灯流光动效，拒绝 JS 轮询，确保 60fps 满帧 */}
      <style>{`
        @keyframes kytDash {
          to { stroke-dashoffset: -40; }
        }
        @keyframes neonPulse {
          0%, 100% { filter: drop-shadow(0 0 4px var(--pulse-color)) opacity(0.8); }
          50% { filter: drop-shadow(0 0 12px var(--pulse-color)) opacity(1); }
        }
        .animate-dash {
          stroke-dasharray: 8, 4;
          animation: kytDash 1.2s linear infinite;
        }
        .node-pulse {
          animation: neonPulse 2s ease-in-out infinite;
        }
      `}</style>

      {/* 头部状态显示区 */}
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-sm font-bold tracking-wider font-mono text-white uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Cross-Chain Multi-Hop Router Engine
          </h3>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
            Asynchronous multi-step path virtualization via <span className="text-rose-400">router.fc</span>
          </p>
        </div>
        <div className="flex gap-4 text-[10px] font-mono">
          <span className="flex items-center gap-1.5 text-[#00FF66]"><span className="w-1.5 h-1.5 rounded-full bg-[#00FF66]" /> Finalized</span>
          <span className="flex items-center gap-1.5 text-[#00FFFF]"><span className="w-1.5 h-1.5 rounded-full bg-[#00FFFF]" /> Active Hop</span>
          <span className="flex items-center gap-1.5 text-slate-500"><span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Queued</span>
        </div>
      </div>

      {/* ============================================================================
          【P1 - P9 级核心】SVG 拓扑交互画布容器
         ============================================================================ */}
      <div className="relative w-full aspect-[21/9] bg-[#010104]/60 rounded-xl border border-white/5 overflow-visible">
        <svg 
          viewBox="0 0 1000 400" 
          className="w-full h-full overflow-visible"
        >
          {/* 【P1 阶段】声明发光滤镜全局共享基底 */}
          <defs>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-magenta" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 【P4 & P5 阶段】绘制拓扑连线层 (Links) */}
          {links.map((link) => {
            const source = nodes.find(n => n.id === link.sourceId);
            const target = nodes.find(n => n.id === link.targetId);
            if (!source || !target) return null;

            // 算法处理：计算控制点生成高拟合度的三次贝塞尔曲线 (Cubic Bezier Curves)
            const dx = Math.abs(target.x - source.x) * 0.5;
            const pathData = `M ${source.x} ${source.y} C ${source.x + dx} ${source.y}, ${target.x - dx} ${target.y}, ${target.x} ${target.y}`;
            
            const isLinkActive = link.status === 'active';
            const isLinkCompleted = link.status === 'completed';
            const color = getStatusColor(link.status);

            return (
              <g 
                key={link.id}
                onMouseEnter={() => setHoveredLink(link)}
                onMouseLeave={() => setHoveredLink(null)}
                className="cursor-pointer"
              >
                {/* 隐藏的加粗点击判定轨 */}
                <path d={pathData} fill="none" stroke="transparent" strokeWidth={16} />
                
                {/* 基础管道底层 */}
                <path 
                  d={pathData} 
                  fill="none" 
                  stroke={color} 
                  strokeWidth={isLinkActive ? 3 : 2} 
                  opacity={isLinkActive ? 1 : isLinkCompleted ? 0.7 : 0.15}
                  className={isLinkActive ? "node-pulse" : ""}
                  style={{ '--pulse-color': color } as React.CSSProperties}
                />

                {/* 核心跑马灯粒子流流光层 */}
                {isLinkActive && (
                  <path 
                    d={pathData} 
                    fill="none" 
                    stroke="#00FFFF" 
                    strokeWidth={2.5} 
                    className="animate-dash"
                    filter="url(#glow-cyan)"
                  />
                )}
              </g>
            );
          })}

          {/* 【P2 & P3 阶段】绘制拓扑节点层 (Nodes) */}
          {nodes.map((node) => {
            const isCompleted = node.status === 'completed';
            const isActive = node.status === 'active';
            const brandColor = getChainColor(node.chain);
            const statusColor = getStatusColor(node.status);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer"
              >
                {/* 外部发光呼吸圈 */}
                <circle 
                  r={22} 
                  fill="none" 
                  stroke={statusColor} 
                  strokeWidth={isActive ? 2 : 1}
                  opacity={isActive ? 1 : isCompleted ? 0.4 : 0.1}
                  className={isActive ? "node-pulse" : ""}
                  style={{ '--pulse-color': statusColor } as React.CSSProperties}
                />

                {/* 核心内舱锚点 */}
                <circle 
                  r={16} 
                  fill="#050811" 
                  stroke={isActive ? '#00FFFF' : isCompleted ? brandColor : 'rgba(255,255,255,0.1)'} 
                  strokeWidth={2}
                />

                {/* 根据节点类型渲染图形标志 */}
                {node.type === 'wallet' && (
                  <path d="M-6-5 H6 V5 H-6 Z M-6-2 H6 M-2 1 H2" fill="none" stroke={isActive || isCompleted ? '#fff' : '#64748B'} strokeWidth={1.5} />
                )}
                {node.type === 'pool' && (
                  <circle cx={0} cy={0} r={5} fill="none" stroke={isActive || isCompleted ? '#fff' : '#64748B'} strokeWidth={1.5} />
                )}
                {node.type === 'bridge' && (
                  <path d="M-7-3 L0 -7 L7 -3 L7 4 L0 8 L-7 4 Z" fill="none" stroke={isActive || isCompleted ? '#fff' : '#64748B'} strokeWidth={1.5} />
                )}
                {node.type === 'target' && (
                  <path d="M-5 5 L0 -5 L5 5 Z" fill="none" stroke={isActive || isCompleted ? '#fff' : '#64748B'} strokeWidth={1.5} />
                )}

                {/* 多链所属标签小徽章 */}
                <rect x={10} y={-24} width={28} height={12} rx={3} fill={`${brandColor}15`} stroke={`${brandColor}30`} strokeWidth={0.5} />
                <text x={24} y={-15} textAnchor="middle" fill={brandColor} fontSize={8} fontFamily="JetBrains Mono" fontWeight="bold">
                  {node.chain}
                </text>

                {/* 节点主要文字说明 */}
                <text x={0} y={34} textAnchor="middle" fill={isActive ? '#ffffff' : '#94A3B8'} fontSize={11} fontFamily="JetBrains Mono" fontWeight={isActive ? 'bold' : 'normal'}>
                  {node.label}
                </text>
                <text x={0} y={46} textAnchor="middle" fill="#64748B" fontSize={8} fontFamily="JetBrains Mono">
                  {node.subLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {/* ============================================================================
            【P7 阶段】Cyber-Glass 浮动信息面板卡片 (Hover Tooltip Portal)
           ============================================================================ */}
        {hoveredNode && (
          <div 
            className="absolute p-3 rounded-xl border z-30 font-mono text-xs text-white pointer-events-none transition-all duration-150"
            style={{
              left: `${(hoveredNode.x / 1000) * 100}%`,
              top: `${(hoveredNode.y / 400) * 100 + 12}%`,
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(2, 4, 10, 0.92)',
              borderColor: getChainColor(hoveredNode.chain),
              backdropFilter: 'blur(10px)',
              boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 15px ${getChainColor(hoveredNode.chain)}20`
            }}
          >
            <div className="font-bold border-b border-white/10 pb-1 mb-1 text-cyan-400">
              {hoveredNode.label} ({hoveredNode.chain})
            </div>
            <div className="text-slate-400 text-[10px]">Type: <span className="text-white capitalize">{hoveredNode.type}</span></div>
            <div className="text-slate-400 text-[10px]">Status: <span style={{ color: getStatusColor(hoveredNode.status) }} className="capitalize">{hoveredNode.status}</span></div>
          </div>
        )}

        {hoveredLink && (
          <div 
            className="absolute p-3 rounded-xl border z-30 font-mono text-xs text-white pointer-events-none"
            style={{
              left: '50%',
              bottom: '16px',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(2, 4, 10, 0.95)',
              borderColor: '#FF007A',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="font-bold text-[#FF007A] mb-1 uppercase tracking-wider text-[10px]">Hop Payload Data</div>
            <div className="text-slate-300">Volume: <span className="text-white font-bold">{hoveredLink.amount} {hoveredLink.tokenSymbol}</span></div>
            {hoveredLink.txHash && (
              <div className="text-slate-500 text-[9px] mt-1 break-all">
                Hash: <span className="text-slate-400 select-all">{hoveredLink.txHash}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};