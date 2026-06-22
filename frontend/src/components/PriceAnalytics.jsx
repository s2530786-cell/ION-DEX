import React, { useState, useEffect, useMemo } from 'react';
import './PriceAnalytics.css';

/**
 * 技术指标计算
 */
function calculateTechnicalIndicators(priceHistory) {
  if (!priceHistory || priceHistory.length < 2) return null;

  const closes = priceHistory.map(p => p.close);
  const highs = priceHistory.map(p => p.high);
  const lows = priceHistory.map(p => p.low);

  // 1. 移动平均线 (MA)
  const calculateMA = (data, period) => {
    return data.slice(-period).reduce((a, b) => a + b, 0) / period;
  };

  const ma7 = calculateMA(closes, Math.min(7, closes.length));
  const ma25 = calculateMA(closes, Math.min(25, closes.length));
  const ma99 = calculateMA(closes, Math.min(99, closes.length));

  // 2. 相对强弱指数 (RSI)
  const calculateRSI = (data, period = 14) => {
    let gains = 0;
    let losses = 0;

    for (let i = Math.max(0, data.length - period - 1); i < data.length - 1; i++) {
      const change = data[i + 1] - data[i];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    const rs = losses === 0 ? 100 : gains / losses;
    const rsi = 100 - (100 / (1 + rs));
    return rsi;
  };

  const rsi = calculateRSI(closes);

  // 3. MACD (动量指标)
  const calculateMACD = (data) => {
    const ema12 = calculateMA(data, 12);
    const ema26 = calculateMA(data, 26);
    const macdLine = ema12 - ema26;
    const signalLine = (emacd12 + ema26 + macdLine) / 3;
    return { macdLine, signalLine, histogram: macdLine - signalLine };
  };

  const emacd12 = calculateMA(closes, 12);
  const macdData = calculateMACD(closes);

  // 4. 布林带 (Bollinger Bands)
  const calculateBollingerBands = (data, period = 20) => {
    const sma = calculateMA(data, period);
    const variance =
      data
        .slice(-period)
        .reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    return {
      upper: sma + stdDev * 2,
      middle: sma,
      lower: sma - stdDev * 2,
    };
  };

  const bollingerBands = calculateBollingerBands(closes);

  // 5. 成交量加权平均价格 (VWAP)
  const volumes = priceHistory.map(p => p.volume);
  const vwap =
    priceHistory
      .reduce((sum, p, i) => sum + p.close * volumes[i], 0) /
    volumes.reduce((a, b) => a + b, 0);

  // 6. 价格变动统计
  const currentPrice = closes[closes.length - 1];
  const change1h = ((currentPrice - closes[Math.max(0, closes.length - 60)]) / closes[Math.max(0, closes.length - 60)]) * 100;
  const change24h = ((currentPrice - closes[0]) / closes[0]) * 100;
  const high24h = Math.max(...highs.slice(-24));
  const low24h = Math.min(...lows.slice(-24));

  return {
    // 移动平均线
    ma7: ma7.toFixed(4),
    ma25: ma25.toFixed(4),
    ma99: ma99.toFixed(4),

    // 相对强弱
    rsi: rsi.toFixed(2),

    // 动量指标
    macd: macdData.macdLine.toFixed(6),
    macdSignal: macdData.signalLine.toFixed(6),
    macdHistogram: macdData.histogram.toFixed(6),

    // 布林带
    bbUpper: bollingerBands.upper.toFixed(4),
    bbMiddle: bollingerBands.middle.toFixed(4),
    bbLower: bollingerBands.lower.toFixed(4),

    // 成交量加权
    vwap: vwap.toFixed(4),

    // 价格统计
    current: currentPrice.toFixed(4),
    change1h: change1h.toFixed(2),
    change24h: change24h.toFixed(2),
    high24h: high24h.toFixed(4),
    low24h: low24h.toFixed(4),
  };
}

/**
 * 高级价格分析组件
 */
export function PriceAnalytics({ priceHistory, pair = 'ION/USDT' }) {
  const [timeframe, setTimeframe] = useState('1h');
  const [showIndicators, setShowIndicators] = useState({
    ma: true,
    rsi: true,
    macd: true,
    bollingerBands: true,
  });

  const indicators = useMemo(() => {
    return calculateTechnicalIndicators(priceHistory);
  }, [priceHistory]);

  if (!indicators) {
    return (
      <div className="price-analytics">
        <div className="analytics-placeholder">
          <p>等待价格数据...</p>
        </div>
      </div>
    );
  }

  // 判断趋势
  const isBullish = indicators.change24h > 0;
  const rsiStatus =
    indicators.rsi < 30 ? 'oversold' : indicators.rsi > 70 ? 'overbought' : 'neutral';
  const macdStatus =
    indicators.macdHistogram > 0 ? 'bullish' : 'bearish';

  return (
    <div className="price-analytics">
      {/* Header */}
      <div className="analytics-header">
        <h3 className="analytics-title">技术分析 - {pair}</h3>
        <div className="analytics-controls">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="timeframe-select"
          >
            <option value="15m">15 分钟</option>
            <option value="1h">1 小时</option>
            <option value="4h">4 小时</option>
            <option value="1d">1 天</option>
          </select>
        </div>
      </div>

      {/* 主要统计 */}
      <div className="analytics-stats">
        <div className="stat-card">
          <span className="stat-label">当前价格</span>
          <span className="stat-value">{indicators.current}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">24H 变化</span>
          <span className={`stat-value ${isBullish ? 'bullish' : 'bearish'}`}>
            {isBullish ? '+' : ''}{indicators.change24h}%
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">24H 高/低</span>
          <span className="stat-value">
            {indicators.high24h} / {indicators.low24h}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">RSI (14)</span>
          <span className={`stat-value rsi-${rsiStatus}`}>{indicators.rsi}</span>
        </div>
      </div>

      {/* 指标显示 */}
      <div className="indicators-grid">
        {/* 移动平均线 */}
        {showIndicators.ma && (
          <div className="indicator-panel">
            <h4 className="indicator-title">📈 移动平均线 (MA)</h4>
            <div className="indicator-content">
              <div className="ma-row">
                <span className="ma-label">MA(7)</span>
                <span className="ma-value">{indicators.ma7}</span>
              </div>
              <div className="ma-row">
                <span className="ma-label">MA(25)</span>
                <span className="ma-value">{indicators.ma25}</span>
              </div>
              <div className="ma-row">
                <span className="ma-label">MA(99)</span>
                <span className="ma-value">{indicators.ma99}</span>
              </div>
            </div>
          </div>
        )}

        {/* RSI 指标 */}
        {showIndicators.rsi && (
          <div className="indicator-panel">
            <h4 className="indicator-title">💪 相对强弱指数 (RSI)</h4>
            <div className="indicator-content">
              <div className="rsi-gauge">
                <div className="rsi-bar">
                  <div
                    className="rsi-indicator"
                    style={{ left: `${indicators.rsi}%` }}
                  ></div>
                </div>
                <div className="rsi-labels">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
              <div className="rsi-status">
                {rsiStatus === 'oversold' && '🔴 超卖 - 可能反弹'}
                {rsiStatus === 'overbought' && '🟢 超买 - 可能回调'}
                {rsiStatus === 'neutral' && '🟡 中性 - 观望'}
              </div>
            </div>
          </div>
        )}

        {/* MACD */}
        {showIndicators.macd && (
          <div className="indicator-panel">
            <h4 className="indicator-title">📊 MACD 动量指标</h4>
            <div className="indicator-content">
              <div className="macd-row">
                <span className="macd-label">MACD</span>
                <span className="macd-value">{indicators.macd}</span>
              </div>
              <div className="macd-row">
                <span className="macd-label">Signal</span>
                <span className="macd-value">{indicators.macdSignal}</span>
              </div>
              <div className="macd-row">
                <span className="macd-label">Histogram</span>
                <span className={`macd-value ${macdStatus}`}>
                  {indicators.macdHistogram}
                </span>
              </div>
              <div className="macd-status">
                {macdStatus === 'bullish' ? '🟢 看涨信号' : '🔴 看跌信号'}
              </div>
            </div>
          </div>
        )}

        {/* 布林带 */}
        {showIndicators.bollingerBands && (
          <div className="indicator-panel">
            <h4 className="indicator-title">🎯 布林带 (Bollinger Bands)</h4>
            <div className="indicator-content">
              <div className="bb-row">
                <span className="bb-label">上轨</span>
                <span className="bb-value">{indicators.bbUpper}</span>
              </div>
              <div className="bb-row">
                <span className="bb-label">中轨</span>
                <span className="bb-value">{indicators.bbMiddle}</span>
              </div>
              <div className="bb-row">
                <span className="bb-label">下轨</span>
                <span className="bb-value">{indicators.bbLower}</span>
              </div>
              <div className="bb-info">
                <small>宽度表示波动率，价格触及边界可能反转</small>
              </div>
            </div>
          </div>
        )}

        {/* VWAP */}
        <div className="indicator-panel">
          <h4 className="indicator-title">💰 成交量加权平均价 (VWAP)</h4>
          <div className="indicator-content">
            <div className="vwap-row">
              <span className="vwap-label">VWAP</span>
              <span className="vwap-value">{indicators.vwap}</span>
            </div>
            <div className="vwap-info">
              <small>
                {parseFloat(indicators.current) > parseFloat(indicators.vwap)
                  ? '价格在 VWAP 上方 - 看涨'
                  : '价格在 VWAP 下方 - 看跌'}
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* 指标切换 */}
      <div className="indicators-toggle">
        <button
          className={`toggle-btn ${showIndicators.ma ? 'active' : ''}`}
          onClick={() =>
            setShowIndicators(prev => ({ ...prev, ma: !prev.ma }))
          }
        >
          MA
        </button>
        <button
          className={`toggle-btn ${showIndicators.rsi ? 'active' : ''}`}
          onClick={() =>
            setShowIndicators(prev => ({ ...prev, rsi: !prev.rsi }))
          }
        >
          RSI
        </button>
        <button
          className={`toggle-btn ${showIndicators.macd ? 'active' : ''}`}
          onClick={() =>
            setShowIndicators(prev => ({ ...prev, macd: !prev.macd }))
          }
        >
          MACD
        </button>
        <button
          className={`toggle-btn ${showIndicators.bollingerBands ? 'active' : ''}`}
          onClick={() =>
            setShowIndicators(prev => ({
              ...prev,
              bollingerBands: !prev.bollingerBands,
            }))
          }
        >
          BB
        </button>
      </div>

      {/* 交易建议 */}
      <div className="trading-signals">
        <h4 className="signals-title">📍 交易信号</h4>
        <div className="signals-list">
          {isBullish && <div className="signal bullish">🟢 价格上升趋势</div>}
          {!isBullish && <div className="signal bearish">🔴 价格下降趋势</div>}

          {indicators.rsi < 30 && (
            <div className="signal oversold">
              💡 RSI 超卖 - 考虑买入机会
            </div>
          )}
          {indicators.rsi > 70 && (
            <div className="signal overbought">
              💡 RSI 超买 - 考虑卖出机会
            </div>
          )}

          {macdStatus === 'bullish' && (
            <div className="signal bullish">
              ✅ MACD 看涨 - 买入信号
            </div>
          )}
          {macdStatus === 'bearish' && (
            <div className="signal bearish">
              ⚠️ MACD 看跌 - 卖出信号
            </div>
          )}

          {parseFloat(indicators.current) > parseFloat(indicators.bbUpper) && (
            <div className="signal overbought">
              ⛔ 价格超过布林上轨 - 可能反转
            </div>
          )}
          {parseFloat(indicators.current) < parseFloat(indicators.bbLower) && (
            <div className="signal oversold">
              ⛔ 价格低于布林下轨 - 可能反弹
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PriceAnalytics;
