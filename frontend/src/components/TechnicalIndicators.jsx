import React, { useMemo } from 'react';
import './TechnicalIndicators.css';

/**
 * 简化的技术指标组件
 * 用于快速显示关键指标和交易信号
 */
export function TechnicalIndicators({ priceHistory, pair = 'ION/USDT' }) {
  const indicators = useMemo(() => {
    if (!priceHistory || priceHistory.length < 2) return null;

    const closes = priceHistory.map(p => p.close);
    const volumes = priceHistory.map(p => p.volume);

    // MA
    const ma7 = closes.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const ma25 = closes.slice(-25).reduce((a, b) => a + b, 0) / Math.min(25, closes.length);

    // RSI
    let gains = 0,
      losses = 0;
    for (let i = Math.max(0, closes.length - 15); i < closes.length - 1; i++) {
      const change = closes[i + 1] - closes[i];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    const rsi = 100 - (100 / (1 + gains / losses));

    // VWAP
    const vwap =
      priceHistory
        .slice(-24)
        .reduce((sum, p, i) => sum + p.close * volumes[Math.max(0, closes.length - 24 + i)], 0) /
      volumes.slice(-24).reduce((a, b) => a + b, 0);

    // 价格变化
    const current = closes[closes.length - 1];
    const change24h = ((current - closes[0]) / closes[0]) * 100;

    return {
      ma7: ma7.toFixed(4),
      ma25: ma25.toFixed(4),
      rsi: rsi.toFixed(1),
      vwap: vwap.toFixed(4),
      current: current.toFixed(4),
      change24h: change24h.toFixed(2),
    };
  }, [priceHistory]);

  if (!indicators) return null;

  const rsiTrend =
    indicators.rsi < 30 ? '超卖' : indicators.rsi > 70 ? '超买' : '中性';
  const priceTrend = indicators.change24h > 0 ? '上升' : '下降';
  const maTrend = indicators.current > indicators.ma25 ? '看涨' : '看跌';

  return (
    <div className="technical-indicators">
      <div className="indicators-mini">
        {/* 快速指标卡 */}
        <div className="indicator-mini-card">
          <span className="mini-label">RSI (14)</span>
          <span className={`mini-value rsi-${rsiTrend === '超卖' ? 'oversold' : rsiTrend === '超买' ? 'overbought' : 'neutral'}`}>
            {indicators.rsi}
          </span>
          <span className="mini-status">{rsiTrend}</span>
        </div>

        <div className="indicator-mini-card">
          <span className="mini-label">MA 交叉</span>
          <span className={`mini-value ${maTrend === '看涨' ? 'bullish' : 'bearish'}`}>
            {maTrend}
          </span>
          <span className="mini-status">
            {indicators.current} vs {indicators.ma25}
          </span>
        </div>

        <div className="indicator-mini-card">
          <span className="mini-label">24H 趋势</span>
          <span className={`mini-value ${priceTrend === '上升' ? 'bullish' : 'bearish'}`}>
            {priceTrend}
          </span>
          <span className="mini-status">{indicators.change24h}%</span>
        </div>

        <div className="indicator-mini-card">
          <span className="mini-label">VWAP</span>
          <span className={`mini-value ${indicators.current > indicators.vwap ? 'bullish' : 'bearish'}`}>
            {indicators.current > indicators.vwap ? '上方' : '下方'}
          </span>
          <span className="mini-status">{indicators.vwap}</span>
        </div>
      </div>

      {/* 快速建议 */}
      <div className="quick-signals">
        {indicators.rsi < 30 && (
          <div className="signal-badge oversold">💡 超卖 - 买入机会</div>
        )}
        {indicators.rsi > 70 && (
          <div className="signal-badge overbought">💡 超买 - 卖出机会</div>
        )}
        {maTrend === '看涨' && (
          <div className="signal-badge bullish">✅ 趋势看涨</div>
        )}
        {maTrend === '看跌' && (
          <div className="signal-badge bearish">⚠️ 趋势看跌</div>
        )}
      </div>
    </div>
  );
}

/**
 * 指标图例说明
 */
export function IndicatorLegend() {
  return (
    <div className="indicator-legend">
      <h4 className="legend-title">📊 技术指标说明</h4>
      <div className="legend-grid">
        <div className="legend-item">
          <span className="legend-label">RSI (相对强弱指数)</span>
          <span className="legend-desc">
            0-30 超卖，30-70 中性，70-100 超买
          </span>
        </div>
        <div className="legend-item">
          <span className="legend-label">MA (移动平均线)</span>
          <span className="legend-desc">价格在 MA 上方 = 看涨，下方 = 看跌</span>
        </div>
        <div className="legend-item">
          <span className="legend-label">VWAP (成交量加权)</span>
          <span className="legend-desc">
            价格在 VWAP 上方 = 看涨，下方 = 看跌
          </span>
        </div>
        <div className="legend-item">
          <span className="legend-label">24H 趋势</span>
          <span className="legend-desc">24 小时内价格变化方向</span>
        </div>
      </div>
    </div>
  );
}

export default TechnicalIndicators;
