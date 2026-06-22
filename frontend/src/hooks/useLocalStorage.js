import { useState, useEffect, useCallback } from 'react';

/**
 * localStorage 持久化管理 Hook
 * 支持本地存储交易历史、用户偏好设置等
 */
export function useLocalStorage(key, initialValue = null) {
  // 初始化状态
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = typeof window !== 'undefined' 
        ? window.localStorage.getItem(key)
        : null;
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // 更新 localStorage 值
  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // 移除值
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing from localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * 交易历史管理
 */
export function useSwapHistoryStorage() {
  const [trades, setTrades, removeTrades] = useLocalStorage('swapHistory', []);
  const [lastSync, setLastSync, removeLastSync] = useLocalStorage('lastSwapSync', null);

  /**
   * 添加新交易
   */
  const addTrade = useCallback((trade) => {
    setTrades(prev => [
      {
        ...trade,
        id: trade.id || `tx-${Date.now()}`,
        addedAt: trade.addedAt || Date.now(),
      },
      ...prev,
    ]);
  }, [setTrades]);

  /**
   * 更新交易状态
   */
  const updateTradeStatus = useCallback((tradeId, newStatus) => {
    setTrades(prev =>
      prev.map(trade =>
        trade.id === tradeId
          ? { ...trade, status: newStatus, updatedAt: Date.now() }
          : trade
      )
    );
  }, [setTrades]);

  /**
   * 删除交易
   */
  const deleteTrade = useCallback((tradeId) => {
    setTrades(prev => prev.filter(t => t.id !== tradeId));
  }, [setTrades]);

  /**
   * 按状态过滤
   */
  const getTradesByStatus = useCallback((status) => {
    if (status === 'all') return trades;
    return trades.filter(t => t.status === status);
  }, [trades]);

  /**
   * 获取统计数据
   */
  const getStats = useCallback(() => {
    return {
      total: trades.length,
      completed: trades.filter(t => t.status === 'completed').length,
      pending: trades.filter(t => t.status === 'pending').length,
      failed: trades.filter(t => t.status === 'failed').length,
      totalVolume: trades
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.outputAmount || 0), 0),
    };
  }, [trades]);

  /**
   * 导出为 CSV
   */
  const exportAsCSV = useCallback(() => {
    const headers = ['ID', 'From', 'To', 'Input Amount', 'Output Amount', 'Rate', 'Slippage', 'Status', 'Date'];
    const rows = trades.map(t => [
      t.id,
      t.from,
      t.to,
      t.inputAmount,
      t.outputAmount,
      t.rate,
      t.slippage,
      t.status,
      new Date(t.timestamp).toLocaleString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(r => r.join(',')),
    ].join('\n');

    return csv;
  }, [trades]);

  /**
   * 导出为 JSON
   */
  const exportAsJSON = useCallback(() => {
    return JSON.stringify(trades, null, 2);
  }, [trades]);

  /**
   * 清空历史
   */
  const clearHistory = useCallback(() => {
    removeTrades();
    removeLastSync();
  }, [removeTrades, removeLastSync]);

  return {
    trades,
    lastSync,
    addTrade,
    updateTradeStatus,
    deleteTrade,
    getTradesByStatus,
    getStats,
    exportAsCSV,
    exportAsJSON,
    clearHistory,
  };
}

/**
 * 用户偏好设置存储
 */
export function useUserPreferences() {
  const [preferences, setPreferences, removePreferences] = useLocalStorage('userPreferences', {
    slippageMode: 'auto',
    customSlippage: 0.5,
    defaultFromToken: 'ION',
    defaultToToken: 'USDT',
    showAdvancedMode: false,
    theme: 'dark',
  });

  /**
   * 更新偏好设置
   */
  const updatePreference = useCallback((key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  }, [setPreferences]);

  /**
   * 批量更新
   */
  const updatePreferences = useCallback((updates) => {
    setPreferences(prev => ({
      ...prev,
      ...updates,
    }));
  }, [setPreferences]);

  /**
   * 重置为默认值
   */
  const resetPreferences = useCallback(() => {
    removePreferences();
  }, [removePreferences]);

  return {
    preferences,
    updatePreference,
    updatePreferences,
    resetPreferences,
  };
}

/**
 * 价格缓存管理
 */
export function usePriceCache() {
  const [cache, setCache, removeCache] = useLocalStorage('priceCache', {});

  /**
   * 获取缓存价格
   */
  const getCachedPrice = useCallback((pair, maxAge = 60000) => {
    const cached = cache[pair];
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > maxAge) {
      // 缓存过期
      return null;
    }

    return cached.price;
  }, [cache]);

  /**
   * 设置缓存价格
   */
  const setCachedPrice = useCallback((pair, price) => {
    setCache(prev => ({
      ...prev,
      [pair]: {
        price,
        timestamp: Date.now(),
      },
    }));
  }, [setCache]);

  /**
   * 清空缓存
   */
  const clearCache = useCallback(() => {
    removeCache();
  }, [removeCache]);

  /**
   * 清理过期缓存
   */
  const cleanupExpired = useCallback((maxAge = 3600000) => {
    const now = Date.now();
    const cleaned = Object.fromEntries(
      Object.entries(cache).filter(
        ([_, data]) => (now - data.timestamp) <= maxAge
      )
    );
    setCache(cleaned);
  }, [cache, setCache]);

  return {
    getCachedPrice,
    setCachedPrice,
    clearCache,
    cleanupExpired,
  };
}

export default useLocalStorage;
