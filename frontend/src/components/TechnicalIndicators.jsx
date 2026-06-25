import React, { useMemo } from 'react';
import './TechnicalIndicators.css';

/**
 * 技术指标组件
 * 显示多种技术分析指标
 */
export function TechnicalIndicators({
  pair = 'ION/USDT',
  rsi = null,
  volatility = 0,
  macd = null,
  bollingerBands = null,
  movingAverages = null,
}) {
  // RSI 解释
  const getRSIInterpretation = useMemo(() => {
    if (!rsi) return null;

    if (rsi > 70) {
      return {
        status: '超买',
        color: '#ef4444',
        description: '资产可能被过度买入，可能会出现反转',
        signal: '卖出信号',
      };
    } else if (rsi < 30) {
      return {
        status: '超卖',
        color: '#10b981',
        description: '资产可能被过度卖出，可能会出现反弹',
        signal: '买入信号',
      };
    } else {
      return {
        status: '中性',
        color: '#f59e0b',
        description: '市场处于平衡状态，继续观察',
        signal: '观望',
      };
    }
  }, [rsi]);

  // 波动率级别
  const getVolatilityLevel = useMemo(() => {
    if (volatility > 5) {
      return {
        level: '极高',
        color: '#ef4444',
        description: '市场波动性非常高，风险大幅增加',
      };
    } else if (volatility > 3) {
      return {
        level: '高',
        color: '#f59e0b',
        description: '市场波动性较高，建议调整交易量',
      };
    } else if (volatility > 1) {
      return {
        level: '中',
        color: '#f59e0b',
        description: '市场波动性适中，正常交易',
      };
    } else {
      return {
        level: '低',
        color: '#10b981',
        description: '市场波动性低，市场稳定',
      };
    }
  }, [volatility]);

  // MACD 信号
  const getMACD = useMemo(() => {
    if (!macd) return null;

    const signal = macd.line > macd.signal ? 'bullish' : 'bearish';
    const histogram = macd.line - macd.signal;

    return {
      line: macd.line.toFixed(4),
      signal: macd.signal.toFixed(4),
      histogram: histogram.toFixed(4),
      trend: signal,
      strength: Math.abs(histogram).toFixed(4),
    };
  }, [macd]);

  // 布林格带信号
  const getBollingerBandSignal = useMemo(() => {
    if (!bollingerBands) return null;

    const { upper, middle, lower, close } = bollingerBands;
    const position = (close - lower) / (upper - lower);

    let signal = '中性';
    let color = '#f59e0b';

    if (position > 0.8) {
      signal = '接近上轨 (卖出信号)';
      color = '#ef4444';
    } else if (position < 0.2) {
      signal = '接近下轨 (买入信号)';
      color = '#10b981';
    }

    return {
      upper: upper.toFixed(2),
      middle: middle.toFixed(2),
      lower: lower.toFixed(2),
      position: (position * 100).toFixed(0),
      signal,
      color,
    };
  }, [bollingerBands]);

  return (
    <div className="technical-indicators">
      <h3 className="indicators-header">技术指标分析</h3>

      {/* RSI 指标 */}
      <div className="indicator-section">
        <div className="section-title">相对强弱指数 (RSI)</div>
        {rsi !== null ? (
          <div className="indicator-content">
            <div className="rsi-display">
              <div className="rsi-gauge-large">
                <svg width="120" height="60" viewBox="0 0 120 60">
                  {/* 背景 */}
                  <rect
                    x="10"
                    y="10"
                    width="100"
                    height="40"
                    fill="rgba(255, 255, 255, 0.05)"
                    rx="5"
                  />

                  {/* 区域标记 */}
                  <rect
                    x="10"
                    y="10"
                    width="20"
                    height="40"
                    fill="rgba(239, 68, 68, 0.1)"
                    rx="5"
                  />
                  <rect
                    x="30"
                    y="10"
                    width="60"
                    height="40"
                    fill="rgba(245, 158, 11, 0.1)"
                    rx="5"
                  />
                  <rect
                    x="90"
                    y="10"
                    width="20"
                    height="40"
                    fill="rgba(239, 68, 68, 0.1)"
                    rx="5"
                  />

                  {/* 指针 */}
                  <circle
                    cx={10 + (rsi / 100) * 100}
                    cy="30"
                    r="4"
                    fill={getRSIInterpretation?.color || '#999'}
                  />

                  {/* 标签 */}
                  <text
                    x="20"
                    y="55"
                    fontSize="10"
                    fill="#666"
                    textAnchor="middle"
                  >
                    0
                  </text>
                  <text
                    x="60"
                    y="55"
                    fontSize="10"
                    fill="#666"
                    textAnchor="middle"
                  >
                    50
                  </text>
                  <text
                    x="100"
                    y="55"
                    fontSize="10"
                    fill="#666"
                    textAnchor="middle"
                  >
                    100
                  </text>
                </svg>
              </div>

              <div className="rsi-info">
                <div className="rsi-value" style={{ color: getRSIInterpretation?.color }}>
                  {rsi.toFixed(2)}
                </div>
                <div className="rsi-status" style={{ color: getRSIInterpretation?.color }}>
                  {getRSIInterpretation?.status}
                </div>
                <div className="rsi-signal">{getRSIInterpretation?.signal}</div>
                <div className="rsi-description">{getRSIInterpretation?.description}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="indicator-empty">计算中...</div>
        )}
      </div>

      {/* 波动率指标 */}
      <div className="indicator-section">
        <div className="section-title">波动率分析</div>
        <div className="indicator-content">
          <div className="volatility-display">
            <div
              className="volatility-bar"
              style={{
                width: `${Math.min(volatility * 10, 100)}%`,
                backgroundColor: getVolatilityLevel.color,
              }}
            />
          </div>
          <div className="volatility-info">
            <div className="volatility-value" style={{ color: getVolatilityLevel.color }}>
              {volatility.toFixed(2)}%
            </div>
            <div className="volatility-level" style={{ color: getVolatilityLevel.color }}>
              {getVolatilityLevel.level}
            </div>
            <div className="volatility-description">{getVolatilityLevel.description}</div>
          </div>
        </div>
      </div>

      {/* MACD 指标 */}
      {getMACD && (
        <div className="indicator-section">
          <div className="section-title">MACD (移动平均收敛散度)</div>
          <div className="indicator-content macd-content">
            <div className="macd-item">
              <span className="label">MACD 线</span>
              <span className="value">{getMACD.line}</span>
            </div>
            <div className="macd-item">
              <span className="label">信号线</span>
              <span className="value">{getMACD.signal}</span>
            </div>
            <div className="macd-item">
              <span className="label">柱状线</span>
              <span
                className="value"
                style={{
                  color: getMACD.trend === 'bullish' ? '#10b981' : '#ef4444',
                }}
              >
                {getMACD.histogram}
              </span>
            </div>
            <div className="macd-signal">
              <span
                style={{
                  color: getMACD.trend === 'bullish' ? '#10b981' : '#ef4444',
                }}
              >
                {getMACD.trend === 'bullish' ? '看涨' : '看跌'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 布林格带 */}
      {getBollingerBandSignal && (
        <div className="indicator-section">
          <div className="section-title">布林格带 (Bollinger Bands)</div>
          <div className="indicator-content">
            <div className="bollingerbands-display">
              <div className="bb-band">
                <span className="bb-label">上轨</span>
                <span className="bb-value">${getBollingerBandSignal.upper}</span>
              </div>
              <div className="bb-band middle">
                <span className="bb-label">中轨</span>
                <span className="bb-value">${getBollingerBandSignal.middle}</span>
              </div>
              <div className="bb-band">
                <span className="bb-label">下轨</span>
                <span className="bb-value">${getBollingerBandSignal.lower}</span>
              </div>
            </div>
            <div className="bb-position">
              <div className="bb-pos-bar">
                <div
                  className="bb-pos-fill"
                  style={{ width: `${getBollingerBandSignal.position}%` }}
                />
              </div>
              <div className="bb-pos-label">
                <span style={{ color: getBollingerBandSignal.color }}>
                  {getBollingerBandSignal.signal}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 交易建议 */}
      <div className="trading-recommendations">
        <h4 className="rec-title">📊 交易建议</h4>
        <ul className="rec-list">
          {getRSIInterpretation?.status === '超买' && (
            <li className="rec-item warning">
              ⚠️ RSI 超买，考虑减少头寸或等待回调
            </li>
          )}
          {getRSIInterpretation?.status === '超卖' && (
            <li className="rec-item success">
              ✓ RSI 超卖，可能存在反弹机会
            </li>
          )}
          {getVolatilityLevel.level === '极高' && (
            <li className="rec-item warning">
              ⚠️ 高波动性，建议降低交易杠杆
            </li>
          )}
          {getVolatilityLevel.level === '低' && (
            <li className="rec-item success">
              ✓ 市场稳定，适合执行交易计划
            </li>
          )}
          {getMACD?.trend === 'bullish' && (
            <li className="rec-item success">
              ✓ MACD 看涨信号
            </li>
          )}
          {getMACD?.trend === 'bearish' && (
            <li className="rec-item warning">
              ⚠️ MACD 看跌信号
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default TechnicalIndicators;
