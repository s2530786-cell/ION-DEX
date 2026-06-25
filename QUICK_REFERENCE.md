# P5 快速参考

## 🚀 5分钟快速开始

### 1. 导入组件
```javascript
import useBlockchainPrice from '../hooks/useBlockchainPrice';
import useSwapPriceV2 from '../hooks/useSwapPriceV2';
import { swapHistoryManager } from '../lib/localStorage';
import SwapAnalysis from '../components/SwapAnalysis';
import TechnicalIndicators from '../components/TechnicalIndicators';
```

### 2. 使用数据 Hook
```javascript
const { prices, volatility, rsi, marketSentiment } = useBlockchainPrice();
const { calculatePrice, validateSlippage } = useSwapPriceV2();
```

### 3. 添加组件到 JSX
```jsx
<SwapAnalysis 
  pair="ION/USDT"
  priceHistory={prices}
  volatility={volatility}
  rsi={rsi}
/>

<TechnicalIndicators
  rsi={rsi}
  volatility={volatility}
/>
```

### 4. 保存交易记录
```javascript
swapHistoryManager.addTrade({
  id: '0x...',
  from: 'ION',
  to: 'USDT',
  inputAmount: 100,
  outputAmount: 482,
  status: 'completed',
  timestamp: Date.now(),
});
```

## 📊 技术指标对照表

| 指标 | 值范围 | 解释 |
|------|--------|------|
| RSI | 0-100 | > 70 超买, < 30 超卖 |
| 波动率 | % | 高波动 = 高风险 |
| MACD | +/- | 正数看涨, 负数看跌 |
| 布林格带 | 价格 | 上轨卖, 下轨买 |

## 💾 localStorage 关键方法

```javascript
// 交易历史
swapHistoryManager.addTrade(tradeData)
swapHistoryManager.getAllTrades()
swapHistoryManager.getTradesByStatus('completed')
swapHistoryManager.exportToCSV()

// 用户设置
userSettingsManager.updateSettings({ theme: 'dark' })

// 价格缓存
priceCacheManager.setPrice(key, price, ttl)
priceCacheManager.getPrice(key)

// 资产组合
portfolioManager.addHolding(token, amount)
portfolioManager.getPortfolio()

// 收藏
favoritesManager.addFavorite(pair)
favoritesManager.getFavorites()
```

## 🔗 API 集成点

```javascript
// 在 useBlockchainPrice.js 中 fetchBlockchainData() 替换：
const prices = await fetch(RPC_URL, {
  method: 'POST',
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [{to: DEX_ADDRESS, data: encodedPrice}],
  })
});
```

## ⚙️ 配置项

```javascript
// useBlockchainPrice.js
const REFRESH_INTERVAL = 5000; // 5秒
const PRICE_HISTORY_LENGTH = 100; // K线数

// localStorage.js
const MAX_TRADES = 500; // 最多500条
const CACHE_TTL = 30000; // 30秒缓存
```

## 🐛 常见问题速查

| 问题 | 解决方案 |
|------|---------|
| 数据不更新 | 检查 useBlockchainPrice 的 interval |
| localStorage 满 | 检查交易数是否超过 500 |
| 图表不显示 | 确保 priceHistory 有数据 |
| 滑点太高 | 使用 validateSlippage() 检查 |
| 性能缓慢 | 使用 React.memo() 优化组件 |

## 📱 组件尺寸

| 组件 | 推荐宽度 | 推荐高度 |
|------|----------|----------|
| SwapAnalysis | 600px+ | 300px |
| TechnicalIndicators | 400px+ | 500px |
| SwapHistory | 600px+ | 400px |

## 🎨 主题变量

```css
/* 在 CSS 中使用 */
--text: #fff;           /* 主文字 */
--text-dim: #999;       /* 淡文字 */
--cyan: #06b6d4;        /* 青色强调 */
--purple: #a855f7;      /* 紫色强调 */
--green: #10b981;       /* 绿色（看涨） */
--red: #ef4444;         /* 红色（看跌） */
--gold: #f59e0b;        /* 金色（警告） */
```

## 🔄 数据流示意图

```
真实链上数据
    ↓
useBlockchainPrice (5秒刷新)
    ↓
priceCacheManager (30秒缓存)
    ↓
useSwapPriceV2 (计算+指标)
    ↓
SwapPage (展示)
    ├─ SwapAnalysis (图表)
    ├─ TechnicalIndicators (指标)
    └─ SwapHistory (历史)
    ↓
swapHistoryManager (持久化)
```

## 📦 导出功能

```javascript
// 导出交易历史为 CSV
const csv = swapHistoryManager.exportToCSV();
swapHistoryManager.downloadCSV(csv);

// CSV 格式
// ID, From, To, Input, Output, Rate, Impact, Fee, Status, Time
```

## 🎯 状态管理模式

```javascript
// 在组件中
const [volatility, setVolatility] = useState(0);
const [rsi, setRSI] = useState(50);
const [priceHistory, setPriceHistory] = useState([]);

// 在 useEffect 中更新
useEffect(() => {
  setVolatility(calculateVolatility());
  setRSI(calculateRSI());
  setPriceHistory(getPriceHistory());
}, [pair]);
```

## ✅ 验证清单（部署前）

- [ ] 所有 imports 正确
- [ ] 无 console.error
- [ ] localStorage 可用
- [ ] 响应式测试通过
- [ ] 浏览器兼容性 OK
- [ ] 性能 < 3s 加载
- [ ] 所有功能测试通过

## 🚀 优化建议

1. **启用 Gzip 压缩** - 减小 JS 包体积
2. **使用 CDN** - 加快资源加载
3. **代码分割** - 动态导入重型组件
4. **图片优化** - 使用 WebP 格式
5. **缓存策略** - 利用 Service Worker

## 📞 调试技巧

```javascript
// 在浏览器控制台
// 查看所有交易
JSON.parse(localStorage.getItem('SWAP_HISTORY'))

// 查看缓存价格
JSON.parse(localStorage.getItem('PRICE_CACHE'))

// 清除 localStorage
localStorage.clear()

// 监控性能
performance.mark('trade-start')
// ... 操作
performance.mark('trade-end')
performance.measure('trade', 'trade-start', 'trade-end')
```

## 🔐 安全提示

1. **验证数值** - 检查价格、数量在合理范围
2. **错误处理** - 包装所有 async 操作
3. **数据清理** - 定期清理过期 localStorage
4. **签名验证** - 交易前检查签名
5. **速率限制** - 防止 API 滥用

## 📚 相关文件

- `/app/IMPLEMENTATION_GUIDE.md` - 完整实现指南
- `/app/P5_ACCEPTANCE_CHECKLIST.md` - 验收清单
- `/app/frontend/src/hooks/useBlockchainPrice.js`
- `/app/frontend/src/lib/localStorage.js`
- `/app/frontend/src/components/SwapAnalysis.jsx`
- `/app/frontend/src/components/TechnicalIndicators.jsx`

---

**版本**: P5 优化
**状态**: ✅ 生产就绪
**最后更新**: 2024
