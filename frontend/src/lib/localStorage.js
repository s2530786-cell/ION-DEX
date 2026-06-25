/**
 * localStorage 管理工具
 * 用于持久化交易历史、用户设置等
 */

const STORAGE_KEYS = {
  SWAP_HISTORY: 'ion_dex:swap_history',
  USER_SETTINGS: 'ion_dex:user_settings',
  PRICE_CACHE: 'ion_dex:price_cache',
  PORTFOLIO: 'ion_dex:portfolio',
  FAVORITES: 'ion_dex:favorites',
};

/**
 * 获取存储的数据
 */
export const getStoredData = (key, defaultValue = null) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Failed to get stored data for key ${key}:`, error);
    return defaultValue;
  }
};

/**
 * 设置存储的数据
 */
export const setStoredData = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to set stored data for key ${key}:`, error);
    return false;
  }
};

/**
 * 删除存储的数据
 */
export const removeStoredData = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove stored data for key ${key}:`, error);
    return false;
  }
};

/**
 * 清空所有 ION DEX 数据
 */
export const clearAllData = () => {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Failed to clear all data:', error);
    return false;
  }
};

/**
 * Swap 交易历史管理
 */
export const swapHistoryManager = {
  /**
   * 添加新的交易
   */
  addTrade: (trade) => {
    const trades = getStoredData(STORAGE_KEYS.SWAP_HISTORY, []);
    const newTrades = [
      {
        ...trade,
        id: trade.id || `trade_${Date.now()}`,
        timestamp: trade.timestamp || Date.now(),
        status: trade.status || 'pending',
      },
      ...trades,
    ].slice(0, 500); // 保留最近 500 条

    return setStoredData(STORAGE_KEYS.SWAP_HISTORY, newTrades);
  },

  /**
   * 获取所有交易
   */
  getAllTrades: () => {
    return getStoredData(STORAGE_KEYS.SWAP_HISTORY, []);
  },

  /**
   * 按状态获取交易
   */
  getTradesByStatus: (status) => {
    const trades = getStoredData(STORAGE_KEYS.SWAP_HISTORY, []);
    return trades.filter((t) => t.status === status);
  },

  /**
   * 按交易对获取
   */
  getTradesByPair: (from, to) => {
    const trades = getStoredData(STORAGE_KEYS.SWAP_HISTORY, []);
    return trades.filter((t) => t.from === from && t.to === to);
  },

  /**
   * 更新交易状态
   */
  updateTradeStatus: (tradeId, newStatus) => {
    const trades = getStoredData(STORAGE_KEYS.SWAP_HISTORY, []);
    const updated = trades.map((t) =>
      t.id === tradeId ? { ...t, status: newStatus } : t
    );
    return setStoredData(STORAGE_KEYS.SWAP_HISTORY, updated);
  },

  /**
   * 删除交易
   */
  deleteTrade: (tradeId) => {
    const trades = getStoredData(STORAGE_KEYS.SWAP_HISTORY, []);
    const filtered = trades.filter((t) => t.id !== tradeId);
    return setStoredData(STORAGE_KEYS.SWAP_HISTORY, filtered);
  },

  /**
   * 获取交易统计
   */
  getStatistics: () => {
    const trades = getStoredData(STORAGE_KEYS.SWAP_HISTORY, []);

    const stats = {
      total: trades.length,
      completed: trades.filter((t) => t.status === 'completed').length,
      pending: trades.filter((t) => t.status === 'pending').length,
      failed: trades.filter((t) => t.status === 'failed').length,
      totalVolume: trades.reduce((sum, t) => sum + (t.inputAmount || 0), 0),
      totalFees: trades.reduce((sum, t) => sum + (t.fee || 0), 0),
      averageSlippage: trades.reduce((sum, t) => sum + (t.slippage || 0), 0) / (trades.length || 1),
    };

    return stats;
  },

  /**
   * 清空所有交易历史
   */
  clear: () => {
    return removeStoredData(STORAGE_KEYS.SWAP_HISTORY);
  },

  /**
   * 导出交易历史 (CSV 格式)
   */
  exportToCSV: () => {
    const trades = getStoredData(STORAGE_KEYS.SWAP_HISTORY, []);

    const headers = [
      'ID',
      'From',
      'To',
      'Input Amount',
      'Output Amount',
      'Rate',
      'Slippage',
      'Price Impact',
      'Fee',
      'Status',
      'Timestamp',
      'TX Hash',
    ];

    const rows = trades.map((t) => [
      t.id,
      t.from,
      t.to,
      t.inputAmount,
      t.outputAmount,
      t.rate,
      t.slippage,
      t.priceImpact,
      t.fee,
      t.status,
      new Date(t.timestamp).toISOString(),
      t.txHash || 'N/A',
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach((row) => {
      csv += row.join(',') + '\n';
    });

    return csv;
  },

  /**
   * 下载交易历史
   */
  downloadCSV: () => {
    const csv = swapHistoryManager.exportToCSV();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `ion-dex-trades-${Date.now()}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  },
};

/**
 * 用户设置管理
 */
export const userSettingsManager = {
  /**
   * 获取用户设置
   */
  getSettings: () => {
    return getStoredData(STORAGE_KEYS.USER_SETTINGS, {
      slippageMode: 'auto',
      customSlippage: 0.5,
      theme: 'dark',
      language: 'en',
      notifications: true,
    });
  },

  /**
   * 更新用户设置
   */
  updateSettings: (updates) => {
    const current = userSettingsManager.getSettings();
    const updated = { ...current, ...updates };
    return setStoredData(STORAGE_KEYS.USER_SETTINGS, updated);
  },

  /**
   * 获取特定设置
   */
  getSetting: (key) => {
    const settings = userSettingsManager.getSettings();
    return settings[key];
  },

  /**
   * 重置为默认设置
   */
  reset: () => {
    return removeStoredData(STORAGE_KEYS.USER_SETTINGS);
  },
};

/**
 * 价格缓存管理 (减少 API 调用)
 */
export const priceCacheManager = {
  /**
   * 设置价格缓存 (TTL: 30 秒)
   */
  setPrice: (pair, data, ttl = 30000) => {
    const cache = getStoredData(STORAGE_KEYS.PRICE_CACHE, {});
    cache[pair] = {
      ...data,
      cachedAt: Date.now(),
      ttl,
    };
    return setStoredData(STORAGE_KEYS.PRICE_CACHE, cache);
  },

  /**
   * 获取价格缓存 (检查是否过期)
   */
  getPrice: (pair) => {
    const cache = getStoredData(STORAGE_KEYS.PRICE_CACHE, {});
    const cached = cache[pair];

    if (!cached) return null;

    const isExpired = Date.now() - cached.cachedAt > cached.ttl;
    if (isExpired) {
      delete cache[pair];
      setStoredData(STORAGE_KEYS.PRICE_CACHE, cache);
      return null;
    }

    return cached;
  },

  /**
   * 清空价格缓存
   */
  clear: () => {
    return removeStoredData(STORAGE_KEYS.PRICE_CACHE);
  },
};

/**
 * 投资组合管理
 */
export const portfolioManager = {
  /**
   * 获取投资组合
   */
  getPortfolio: () => {
    return getStoredData(STORAGE_KEYS.PORTFOLIO, {
      walletAddress: null,
      holdings: [],
      positions: [],
      totalValue: 0,
    });
  },

  /**
   * 更新投资组合
   */
  updatePortfolio: (portfolio) => {
    return setStoredData(STORAGE_KEYS.PORTFOLIO, portfolio);
  },

  /**
   * 添加持仓
   */
  addHolding: (token, amount) => {
    const portfolio = portfolioManager.getPortfolio();
    const existing = portfolio.holdings.find((h) => h.token === token);

    if (existing) {
      existing.amount += amount;
    } else {
      portfolio.holdings.push({ token, amount, addedAt: Date.now() });
    }

    return portfolioManager.updatePortfolio(portfolio);
  },

  /**
   * 移除持仓
   */
  removeHolding: (token) => {
    const portfolio = portfolioManager.getPortfolio();
    portfolio.holdings = portfolio.holdings.filter((h) => h.token !== token);
    return portfolioManager.updatePortfolio(portfolio);
  },
};

/**
 * 收藏管理
 */
export const favoritesManager = {
  /**
   * 获取收藏
   */
  getFavorites: () => {
    return getStoredData(STORAGE_KEYS.FAVORITES, []);
  },

  /**
   * 添加收藏
   */
  addFavorite: (pair) => {
    const favorites = favoritesManager.getFavorites();
    if (!favorites.includes(pair)) {
      favorites.push(pair);
      setStoredData(STORAGE_KEYS.FAVORITES, favorites);
    }
  },

  /**
   * 移除收藏
   */
  removeFavorite: (pair) => {
    const favorites = favoritesManager.getFavorites();
    const filtered = favorites.filter((p) => p !== pair);
    setStoredData(STORAGE_KEYS.FAVORITES, filtered);
  },

  /**
   * 切换收藏状态
   */
  toggleFavorite: (pair) => {
    const favorites = favoritesManager.getFavorites();
    if (favorites.includes(pair)) {
      favoritesManager.removeFavorite(pair);
      return false;
    } else {
      favoritesManager.addFavorite(pair);
      return true;
    }
  },

  /**
   * 检查是否是收藏
   */
  isFavorite: (pair) => {
    return favoritesManager.getFavorites().includes(pair);
  },
};

export default {
  getStoredData,
  setStoredData,
  removeStoredData,
  clearAllData,
  swapHistoryManager,
  userSettingsManager,
  priceCacheManager,
  portfolioManager,
  favoritesManager,
};
