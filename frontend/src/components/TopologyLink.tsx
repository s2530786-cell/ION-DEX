import React, { useMemo } from 'react';

/**
 * @file TopologyLink.tsx
 * @description Core visual component for ION DEX Topology Engine.
 * Implements Cubic Bezier path calculation and GPU-accelerated particle flow effects.
 */

export type LinkStatus = 'pending' | 'active' | 'finalized';

interface TopologyLinkProps {
  id: string;
  source: { x: number, y: number };
  target: { x: number, y: number };
  status: LinkStatus;
  tokenSymbol?: string;
  amount?: string;
}

export const TopologyLink: React.FC<TopologyLinkProps> = ({ 
  source, 
  target, 
  status, 
  tokenSymbol, 
  amount 
}) => {
  // 1. Path Calculation: Cubic Bezier curve for organic connection feel
  const pathData = useMemo(() => {
    const dx = Math.abs(target.x - source.x);
    // Dynamic offset: Adjust curve intensity based on horizontal distance
    const horizontalOffset = Math.min(dx / 2, 150); 
    
    return `M ${source.x} ${source.y} 
            C ${source.x + horizontalOffset} ${source.y}, 
              ${target.x - horizontalOffset} ${target.y}, 
              ${target.x} ${target.y}`;
  }, [source, target]);

  // 2. Status Style Mapping: Aurora Cyan for Active, Neon Magenta for Finalized
  const strokeColor = status === 'finalized' ? '#FF007A' : status === 'active' ? '#00FFFF' : '#F59E0B';
  const glowOpacity = status === 'active' ? 0.6 : 0.3;

  return (
    <g className="topology-link-group">
      <defs>
        <filter id="link-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
        </filter>
      </defs>

      {/* Underglow Layer: Provides the atmospheric neon bleed */}
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth="6"
        strokeLinecap="round"
        className="pointer-events-none"
        style={{ opacity: 0.1, filter: 'url(#link-blur)' }}
      />

      {/* Main Path: The primary glass-wire structure */}
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        className="transition-all duration-500"
        style={{ 
          opacity: glowOpacity,
        }}
      />

      {/* 3. Particle Flow Layer: Animated dash-array for real-time liquidity flow */}
      {status !== 'finalized' && (
        <path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="10 40"
          className={status === 'active' ? 'animate-flow-fast' : 'animate-flow-slow'}
          style={{
            filter: status === 'active' ? 'drop-shadow(0 0 5px ' + strokeColor + ')' : 'none'
          }}
        />
      )}

      {/* 4. Payload Badge: Floating metadata for active transfers */}
      {status === 'active' && amount && (
        <foreignObject 
          x={(source.x + target.x) / 2 - 40} 
          y={(source.y + target.y) / 2 - 25} 
          width="80" 
          height="24"
          className="pointer-events-none overflow-visible"
        >
          <div className="flex items-center justify-center bg-black/90 border border-cyan-500/30 rounded-lg px-2 py-0.5 text-[9px] font-mono text-cyan-400 backdrop-blur-md shadow-lg">
            {amount} {tokenSymbol}
          </div>
        </foreignObject>
      )}

      <style>{`
        .animate-flow-fast {
          animation: flow 1.5s linear infinite;
          stroke-opacity: 0.9;
        }
        .animate-flow-slow {
          animation: flow 4s linear infinite;
          stroke-opacity: 0.5;
        }
        @keyframes flow {
          from { stroke-dashoffset: 100; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </g>
  );
};
