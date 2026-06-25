import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { swapHistoryManager } from '../lib/localStorage';
import './SwapHistory.css';

/**
 * 交易历史组件
 * - 显示用户的完整交易记录
 * - 按状态过滤（完成/待处理/失败）
 * - 实时更新与刷新
 * - 支持 localStorage 持久化
 */
export function SwapHistory() {
  const { wallet } = useWallet();
  const [trades, setTrades] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'completed' | 'pending' | 'failed'
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 从 localStorage 加载交易历史
    loadTrades();
  }, [wallet.address]);

  const loadTrades = () => {
    try {
      setIsLoading(true);
      const storedTrades = swapHistoryManager.getAllTrades();
      setTrades(storedTrades);
    } catch (error) {
      console.error('Failed to load trades:', error);
      setTrades([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadTrades();
  };

  const handleExportCSV = () => {
    try {
      const csv = swapHistoryManager.exportToCSV();
      swapHistoryManager.downloadCSV(csv);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

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
        <div className="header-actions">
          <button
            className="export-btn"
            onClick={handleExportCSV}
            title="导出为 CSV"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={isLoading}
            title="刷新交易历史"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
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
