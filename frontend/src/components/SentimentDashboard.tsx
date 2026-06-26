import React from 'react';

/**
 * @file SentimentDashboard.tsx
 * @description High-fidelity UI for social sentiment and market heat tracking.
 * Utilizes the ION DEX NeonGlassCard container for visual consistency.
 */

interface SentimentDashboardProps {
  score: number; // 0-100 (Fear to Greed) — supplied by the caller from real sentiment API
  trend: "BULLISH" | "BEARISH" | "NEUTRAL";
  hotTags?: string[];
}

export const SentimentDashboard: React.FC<SentimentDashboardProps> = ({
  score,
  trend,
  hotTags = []
}) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div 
      className="w-full h-full p-5 rounded-[24px] border border-white/10 flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        backgroundColor: 'rgba(5, 8, 17, 0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* Header */}
      <div className="absolute top-4 left-6 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF007A] animate-pulse" />
        <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Social Sentiment</span>
      </div>

      {/* Radial Gauge */}
      <div className="relative w-32 h-32 mb-4 mt-6">
        <svg className="w-full h-full transform -rotate-90">
          <circle 
            cx="64" cy="64" r={radius} 
            stroke="rgba(255, 255, 255, 0.05)" 
            strokeWidth="10" fill="none" 
          />
          <circle 
            cx="64" cy="64" r={radius} 
            stroke="#FF007A" strokeWidth="10" fill="none" 
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ filter: 'drop-shadow(0 0 8px rgba(255, 0, 122, 0.5))' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-mono font-bold text-white tracking-tighter">{score}</span>
          <span className="text-[8px] text-slate-500 uppercase font-mono">Index</span>
        </div>
      </div>
      
      {/* Trend Indicator */}
      <div className="text-center space-y-1">
        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em]">Market Status</div>
        <div className={`text-xl font-bold font-mono ${trend === 'BULLISH' ? 'text-[#00FF66]' : 'text-[#FF4466]'}`}>
          {trend}
        </div>
      </div>

      {/* Heat Radar Tags */}
      <div className="w-full mt-6 space-y-2">
         {hotTags.map(tag => (
           <div key={tag} className="flex justify-between items-center bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-xl transition-hover hover:bg-white/[0.06]">
             <span className="text-[10px] font-mono text-slate-300">{tag}</span>
             <div className="flex items-center gap-1.5">
               <span className="text-[9px] font-mono text-cyan-400 font-bold italic tracking-tighter">🔥 HOT</span>
               <div className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
             </div>
           </div>
         ))}
      </div>

      {/* Bottom Visual Noise */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF007A]/30 to-transparent" />
    </div>
  );
};
