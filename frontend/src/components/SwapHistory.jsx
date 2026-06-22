import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useSwapHistoryStorage } from '../hooks/useLocalStorage';
import './SwapHistory.css';

/**
 * 交易历史组件
 * - 显示用户的完整交易记录
 * - 按状态过滤（完成/待处理/失败）
 * - 本地持久化存储
 * - 导出功能 (CSV/JSON)
 */
export function SwapHistory() {
  const { wallet } = useWallet();
  const {
    trades: savedTrades,
    addTrade,
    updateTradeStatus,
    getTradesByStatus,
    getStats,
    exportAsCSV,
    exportAsJSON,
    clearHistory,
  } = useSwapHistoryStorage();

  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Mock 交易历史数据（初始化时使用）
  const mockTrades = [
    {
      id: '0x123abc...',
      from: 'ION',
      to: 'USDT',
      inputAmount: 100,
      outputAmount: 482,
      rate: 4.82,
      slippage: 0.5,
      priceImpact: 0.08,
      fee: 1.44,
      status: 'completed',
      timestamp: Date.now() - 3600000, // 1 小时前
      txHash: '0x123abc456def789...',
    },
    {
      id: '0x456def...',
      from: 'BNB',
      to: 'USDT',
      inputAmount: 0.5,
      outputAmount: 305.25,
      rate: 610.5,
      slippage: 1.0,
      priceImpact: 0.12,
      fee: 0.92,
      status: 'completed',
      timestamp: Date.now() - 7200000, // 2 小时前
      txHash: '0x456def789abc...',
    },
    {
      id: '0x789ghi...',
      from: 'WBTC',
      to: 'WION',
      inputAmount: 1.5,
      outputAmount: 12.3,
      rate: 8.2,
      slippage: 0.5,
      priceImpact: 0.05,
      fee: 0.037,
      status: 'pending',
      timestamp: Date.now() - 300000, // 5 分钟前
      txHash: null,
    },
    {
      id: '0x101112...',
      from: 'ETH',
      to: 'USDT',
      inputAmount: 2,
      outputAmount: 4500,
      rate: 2250,
      slippage: 2.0,
      priceImpact: 1.8,
      fee: 13.5,
      status: 'failed',
      timestamp: Date.now() - 86400000, // 1 天前
      txHash: '0x101112abc...',
    },
  ];

  useEffect(() => {
    // 模拟加载交易历史
    setIsLoading(true);
    const timer = setTimeout(() => {
      setTrades(mockTrades);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [wallet.address]);

  // 过滤交易
  const filteredTrades = filter === 'all' 
    ? trades 
    : trades.filter(t => t.status === filter);

  // 格式化时间戳
  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return new Date(timestamp).toLocaleDateString();
  };

  // 获取状态徽章颜色
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'pending';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  // 获取状态标签
  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return '✓ 已完成';
      case 'pending':
        return '⏳ 待处理';
      case 'failed':
        return '✕ 失败';
      default:
        return status;
    }
  };

  return (
    <div className="swap-history">
      {/* Header */}
      <div className="history-header">
        <h3 className="history-title">交易历史</h3>
        <button
          className="refresh-btn"
          onClick={() => {
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 500);
          }}
          disabled={isLoading}
          title="刷新交易历史"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {['all', 'completed', 'pending', 'failed'].map((status) => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
            data-testid={`filter-${status}`}
          >
            {status === 'all' ? '全部' : status === 'completed' ? '已完成' : status === 'pending' ? '待处理' : '失败'}
            <span className="count">
              {status === 'all' 
                ? trades.length 
                : trades.filter(t => t.status === status).length
              }
            </span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <span className="text-sm">加载中...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredTrades.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p className="empty-title">暂无交易记录</p>
          <p className="empty-subtitle">
            {filter === 'all' ? '开始进行 Swap 交易' : `没有${getStatusLabel(filter).split(' ')[1]}的交易`}
          </p>
        </div>
      )}

      {/* Trades List */}
      {!isLoading && filteredTrades.length > 0 && (
        <div className="trades-list">
          {filteredTrades.map((trade) => (
            <div key={trade.id} className={`trade-item status-${trade.status}`}>
              {/* Left: Token Pair */}
              <div className="trade-pair">
                <div className="pair-icons">
                  <div className="icon from">{trade.from.charAt(0)}</div>
                  <div className="icon to">{trade.to.charAt(0)}</div>
                </div>
                <div className="pair-info">
                  <span className="pair-name">
                    {trade.from} → {trade.to}
                  </span>
                  <span className="pair-time">{formatTime(trade.timestamp)}</span>
                </div>
              </div>

              {/* Center: Amount Details */}
              <div className="trade-amounts">
                <span className="amount-from">{trade.inputAmount.toFixed(4)} {trade.from}</span>
                <span className="amount-arrow">→</span>
                <span className="amount-to">{trade.outputAmount.toFixed(4)} {trade.to}</span>
              </div>

              {/* Right: Status & Info */}
              <div className="trade-status">
                <span className={`status-badge status-${trade.status}`}>
                  {getStatusLabel(trade.status)}
                </span>
                <button
                  className="trade-details-btn"
                  title="查看详情"
                  onClick={() => {
                    // 这里可以打开详情模态框
                    console.log('View trade details:', trade);
                  }}
                >
                  →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trade Details Modal (on demand) */}
      {/* 可在这里添加可扩展的详情显示面板 */}
    </div>
  );
}

export default SwapHistory;
