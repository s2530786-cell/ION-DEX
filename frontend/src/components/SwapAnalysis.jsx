import React, { useMemo, useState } from 'react';
import './SwapAnalysis.css';

/**
 * 高级图表分析组件
 * - 实时价格图表
 * - 技术分析指标
 * - 市场数据可视化
 */
export function SwapAnalysis({
  pair = 'ION/USDT',
  priceHistory = [],
  volatility = 0,
  rsi = null,
  volume24h = 0,
  liquidity = 0,
}) {
  const [timeframe, setTimeframe] = useState('1H'); // 1H, 4H, 1D, 1W
  const [indicator, setIndicator] = useState('price'); // price, volume, rsi, volatility

  // 规范化数据以便绘制图表
  const chartData = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) return null;

    const data = priceHistory.map((item, index) => ({
      x: index,
      y: item.price || 0,
      timestamp: item.timestamp,
    }));

    // 计算最小值和最大值用于缩放
    const prices = data.map((d) => d.y);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;

    return {
      data,
      min: minPrice,
      max: maxPrice,
      range,
      current: data[data.length - 1]?.y || 0,
      change:
        data.length > 1
          ? (
              ((data[data.length - 1].y - data[0].y) / data[0].y) *
              100
            ).toFixed(2)
          : 0,
    };
  }, [priceHistory]);

  // 生成 SVG 路径
  const generatePath = useMemo(() => {
    if (!chartData) return '';

    const width = 400;
    const height = 200;
    const padding = 20;

    const xScale = (width - padding * 2) / (chartData.data.length - 1 || 1);
    const yScale = (height - padding * 2) / chartData.range;

    let path = `M ${padding} ${height - padding - (chartData.data[0].y - chartData.min) * yScale}`;

    for (let i = 1; i < chartData.data.length; i++) {
      const x = padding + i * xScale;
      const y =
        height -
        padding -
        (chartData.data[i].y - chartData.min) * yScale;
      path += ` L ${x} ${y}`;
    }

    return path;
  }, [chartData]);

  // 计算 RSI 颜色
  const getRSIColor = () => {
    if (!rsi) return '#999';
    if (rsi > 70) return '#ef4444'; // 红色 - 过热
    if (rsi < 30) return '#10b981'; // 绿色 - 过冷
    return '#f59e0b'; // 橙色 - 中性
  };

  // 计算波动率颜色
  const getVolatilityColor = () => {
    if (volatility > 5) return '#ef4444'; // 红色 - 高波动
    if (volatility > 2) return '#f59e0b'; // 橙色 - 中波动
    return '#10b981'; // 绿色 - 低波动
  };

  return (
    <div className="swap-analysis">
      {/* Header */}
      <div className="analysis-header">
        <h3 className="analysis-title">{pair} 分析</h3>
        <div className="header-controls">
          <div className="timeframe-selector">
            {['1H', '4H', '1D', '1W'].map((tf) => (
              <button
                key={tf}
                className={`timeframe-btn ${timeframe === tf ? 'active' : ''}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
          <button className="refresh-btn" title="刷新数据">
            🔄
          </button>
        </div>
      </div>

      {/* 价格摘要 */}
      {chartData && (
        <div className="price-summary">
          <div className="summary-item">
            <span className="summary-label">当前价格</span>
            <span className="summary-value">${chartData.current.toFixed(2)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">24h 变化</span>
            <span
              className="summary-value"
              style={{
                color: parseFloat(chartData.change) >= 0 ? '#10b981' : '#ef4444',
              }}
            >
              {parseFloat(chartData.change) >= 0 ? '+' : ''}
              {chartData.change}%
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">高/低</span>
            <span className="summary-value">
              ${chartData.max.toFixed(2)} / ${chartData.min.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* 主图表区域 */}
      <div className="chart-container">
        {chartData && generatePath ? (
          <svg width="100%" height="200" className="price-chart" viewBox="0 0 400 200">
            {/* 背景网格 */}
            <defs>
              <linearGradient
                id="priceGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  stopColor="rgba(6, 182, 212, 0.3)"
                />
                <stop offset="100%" stopColor="rgba(6, 182, 212, 0.05)" />
              </linearGradient>
            </defs>

            {/* 网格线 */}
            {[0, 50, 100, 150, 200].map((y) => (
              <line
                key={`grid-${y}`}
                x1="0"
                y1={y}
                x2="400"
                y2={y}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
              />
            ))}

            {/* 填充区域 */}
            <path
              d={`${generatePath} L 400 200 L 20 200 Z`}
              fill="url(#priceGradient)"
            />

            {/* 价格线 */}
            <path
              d={generatePath}
              stroke="#06b6d4"
              strokeWidth="2"
              fill="none"
              className="price-line"
            />

            {/* 当前价格点 */}
            {chartData.data.length > 0 && (
              <circle
                cx={20 + ((400 - 40) / (chartData.data.length - 1)) * (chartData.data.length - 1)}
                cy={200 - 20 - ((chartData.current - chartData.min) / chartData.range) * 160}
                r="4"
                fill="#06b6d4"
                className="current-point"
              />
            )}
          </svg>
        ) : (
          <div className="chart-empty">
            <span>暂无数据</span>
          </div>
        )}
      </div>

      {/* 指标选择 */}
      <div className="indicator-selector">
        {['price', 'volume', 'rsi', 'volatility'].map((ind) => (
          <button
            key={ind}
            className={`indicator-btn ${indicator === ind ? 'active' : ''}`}
            onClick={() => setIndicator(ind)}
          >
            {ind.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 技术指标面板 */}
      <div className="indicators-panel">
        {/* RSI 指标 */}
        <div className="indicator-item">
          <div className="indicator-label">RSI (14)</div>
          {rsi !== null ? (
            <div className="indicator-content">
              <div className="rsi-gauge">
                <div
                  className="rsi-bar"
                  style={{
                    width: `${rsi}%`,
                    backgroundColor: getRSIColor(),
                  }}
                />
              </div>
              <div className="rsi-value" style={{ color: getRSIColor() }}>
                {rsi.toFixed(2)}
              </div>
              <div className="rsi-label">
                {rsi > 70
                  ? '过热 🔥'
                  : rsi < 30
                  ? '过冷 ❄️'
                  : '中性 😐'}
              </div>
            </div>
          ) : (
            <div className="indicator-empty">计算中...</div>
          )}
        </div>

        {/* 波动率指标 */}
        <div className="indicator-item">
          <div className="indicator-label">波动率</div>
          <div className="indicator-content">
            <div className="volatility-display" style={{ color: getVolatilityColor() }}>
              {volatility.toFixed(2)}%
            </div>
            <div className="volatility-label">
              {volatility > 5
                ? '高'
                : volatility > 2
                ? '中'
                : '低'}
            </div>
          </div>
        </div>

        {/* 流动性指标 */}
        <div className="indicator-item">
          <div className="indicator-label">流动性</div>
          <div className="indicator-content">
            <div className="liquidity-value">
              ${(liquidity / 1000000).toFixed(2)}M
            </div>
          </div>
        </div>

        {/* 交易量指标 */}
        <div className="indicator-item">
          <div className="indicator-label">24h 交易量</div>
          <div className="indicator-content">
            <div className="volume-value">
              ${(volume24h / 1000000).toFixed(2)}M
            </div>
          </div>
        </div>
      </div>

      {/* 市场分析建议 */}
      <div className="market-analysis">
        <h4 className="analysis-subtitle">市场分析</h4>
        <div className="analysis-content">
          {rsi && (
            <div className="analysis-item">
              <span className="analysis-icon">📊</span>
              <span>
                RSI 为 {rsi.toFixed(2)}，
                {rsi > 70
                  ? '市场过热，建议谨慎入场'
                  : rsi < 30
                  ? '市场过冷，可能存在反弹机会'
                  : '市场处于中性，继续观察'}
              </span>
            </div>
          )}
          <div className="analysis-item">
            <span className="analysis-icon">📈</span>
            <span>
              波动率 {volatility.toFixed(2)}%，
              {volatility > 5
                ? '高波动性，风险增加'
                : volatility > 2
                ? '中等波动性'
                : '低波动性，市场稳定'}
            </span>
          </div>
          <div className="analysis-item">
            <span className="analysis-icon">💧</span>
            <span>
              流动性 ${(liquidity / 1000000).toFixed(2)}M，
              {liquidity > 10000000
                ? '流动性充足，滑点较小'
                : '流动性一般，需注意滑点'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SwapAnalysis;
