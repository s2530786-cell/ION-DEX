# 🎯 ION DEX 自动工作流 — 全自动修复 & 验证

> 出发时间：2026-05-23 22:15
> 规则：**每项任务完成必须通过 100 次验证（每次全绿）才进入下一步**
> 如 100 次验证中间有任意 1 红 → 回到上一步排查修复，不跳过

---

## 🚦 执行顺序（不跳步，不提前）

### 阶段一：后端真实数据修复（P0）

**TASK 1 — 配好 backend/.env 环境变量**

目标：确保后端所有外部数据源配置正确。

- [x] CMC_API_KEY = `342475df9fa5451aafbb3346be049f03`
- [x] BSC_ION_TOKEN_ADDRESS = `0xe1ab61f7b093435204df32f5b3a405de55445ea8`
- [x] BSC_RPC_URL = `https://bsc-dataseed.binance.org/`
- [ ] 启动后端 `cd backend && node -r dotenv/config dist/src/server.js`
- [ ] 验证所有端点返回非 mock 数据

验证：
```
curl http://localhost:8787/api/config/public    # 应返回 healthy
curl http://localhost:8787/api/markets/tickers   # 应返回 CMC 真实价格
curl http://localhost:8787/api/burn/summary      # 应返回 BSC 链上真实燃烧数
```

---

**TASK 2 — 修后端 quotes.ts 价格从 hardcoded 改成 GeckoTerminal 实时**

当前问题：`backend/src/services/quotes.ts` 里 ION=$6.02、BNB=$642.20，实际 ION=$0.000139。

改动范围（ONLY 改以下文件，不要碰其他）：
1. `backend/src/services/quotes.ts` — 去掉 hardcoded seed prices
2. 新增 `backend/src/upstream/geckoterminal.ts` — 封装 GeckoTerminal API
3. `backend/src/services/quotes.ts` — 用 GeckoTerminal 替代 local-seed

GeckoTerminal API 示例：
```
https://api.geckoterminal.com/api/v2/networks/bsc/pools/0x6487725b383954e05cA56F3c2B93a104B3DD2C25
```
返回包含 `attributes.base_token_price_usd` 和 `attributes.volume_usd.h24`。

ION 主池（BSC PancakeSwap）：`0x6487725b383954e05cA56F3c2B93a104B3DD2C25`

验证：100 次 `node -e "require('./dist/src/services/quotes').getQuote('ION')"` 返回接近 $0.000139 的价格。

---

**TASK 3 — 前端 SwapPage fallback 价格移除 hardcoded 值**

当前问题：`frontend/src/pages/SwapPage.tsx` 的 `fallbackRates: BNB=642.2, ION=6.02`

改动范围（ONLY）：
1. `frontend/src/pages/SwapPage.tsx` — 把 fallbackRates 改为 `ION=0.000139, BNB=600`
2. 或直接从后端 API `/api/markets/tickers` 获取价格（建议这样做）

验证：页面打开后 ION 显示 $0.000139 而不是 $6.02。

---

### 阶段二：合约层精度修复（P0）

**TASK 4 — pool.fc 加 protocol fee 累计逻辑**

当前问题：LP fee（0.30%）在 swap 时自动扣除，但 protocol fee（0.25%）不是每次 swap 累计，而是 collect_fees 时从储备金扣 0.05%，设计不一致。

改动范围（ONLY `contracts/ion/pool.fc`）：
1. 在 `handle_swap()` 中增加 protocol fee 累计：每笔 swap 输入中扣出 25bp 存到 `storage::protocol_fee_accumulated`
2. `handle_collect_fees()` 改为从 `storage::protocol_fee_accumulated` 发出而不是从储备金扣
3. 新增状态变量 `global int storage::protocol_fee_accumulated`

验证：100 次编译 `func -o build/pool.fif -SPA stdlib.fc common/gas.fc common/common.fc contracts/ion/pool.fc` 全绿。

---

**TASK 5 — pool.fc muldiv 加 overflow 检查**

当前问题：FunC int257 溢出时 wrap（模运算）而非 revert，需要加保护。

改动范围（ONLY `contracts/ion/pool.fc` 或 `contracts/ion/common/common.fc`）：
1. 在 `math::mul_div` 函数中加入 `throw_unless(error::overflow, result >= 0)`

验证：100 次编译 + 100 次压力测试全绿。

---

### 阶段三：前端 UI 修复（P1）

**TASK 6 — 前端 UI 装修：ION 品牌色系**

参考 ION 品牌：
- 主色：`#00e5ff`（青色，glow 12px blur）
- 强调色：`#ff3bd4`（品红，glow 8px blur）
- 背景：深色 5D 极光效果（极光绿/紫渐变）
- 玻璃态：`backdrop-filter: blur(20px)` + `border: 1px solid rgba(255,255,255,0.08)`
- 字体：`Inter` + `JetBrains Mono`（等宽数字）
- UI 参考：`https://github.com/DavidHDev/react-bits`（挑组件用）

改动范围：
1. `frontend/src/index.css` — 添加 ION 品牌 CSS 变量、极光背景
2. `frontend/src/components/ui/` — 挑 react-bits 组件替换现有 Tailwind UI
3. `frontend/src/pages/SwapPage.tsx` — 应用新组件

验证：前端 `npm run dev` 不报错，页面显示 ION 品牌风格。

---

**TASK 7 — 前端接后端真实 API 数据**

当前问题：前端直接显示 fallback 数据，不调后端。

改动范围：
1. `frontend/src/lib/ionApi.ts` — 已经写了 fetchApi 但需要确保所有页面使用它而非 fallback
2. 每个页面检查是否用了 `fetchApi` 或仅 fallback

验证：启动前端 + 后端，页面数据不再显示 mock 价格。

---

### 阶段四：AI 模块建设（P1-P2）

**TASK 8 — AI Market 页面基础框架**

改动范围：
1. `frontend/src/pages/AIPage.tsx` — 新建 AI Market 页面
2. `frontend/src/components/ai/` — 新建目录，放 AI 分析组件
3. 路由添加 `/ai-market` 路径

验证：页面能渲染，不报错。

---

**TASK 9 — AI 价格分析组件**

改动范围：
1. `frontend/src/components/ai/AiPriceAnalysis.tsx` — 基于当前 ION 价格+24h 变化显示的 AI 分析框
2. 数据源：调后端 `/api/markets/tickers` 拿 ION 实时价

验证：组件显示 ION 当前价格 + AI 评语（比如 "24h +X.XX%，流动性 Y，建议 Z"）。

---

### 阶段五：生态模块补齐（P2）

**TASK 10 — 域名市场前端页面**

改动范围：
1. `frontend/src/pages/DomainMarketPage.tsx` — 域名查询 + 竞拍页面
2. 后端 domain.ts 从 mock 改为接 `dns.ice.io` 真实 API

---

**TASK 11 — 发币平台前端页面（Token Launch）**

改动范围：
1. `frontend/src/pages/LaunchPage.tsx` — 对标 Pump.fun 的发币页面
2. 表单：名称、代号、供应量、描述、Logo 上传（Pinata IPFS）
3. 调用 deployer.fc 部署合约

---

**TASK 12 — indexer/relayer/sentinel 填充**

改动范围：
1. `indexer/src/index.ts` — ION 链事件索引器
2. `relayer/src/index.ts` — 跨链消息中继
3. `sentinel/src/index.ts` — 安全哨兵

---

## 🛑 验证规则（每步必做）

每完成一个 TASK，必须：

```
# 1. 编译/构建验证 100 次
for ($i=0; $i -lt 100; $i++) {
    func -o build/$name.fif -SPA stdlib.fc common/gas.fc common/common.fc contracts/ion/$name.fc
}
# 或
for ($i=0; $i -lt 100; $i++) {
    cd frontend && npx tsc --noEmit
}

# 2. 功能验证
# - 后端：curl 端点返回预期数据
# - 前端：npm run dev 不报错
# - 合约：测试脚本 100 次 PASS

# 3. 仅当 100 次全绿 → git commit → 进入下一个 TASK
```

**踩过的坑（背下来，一次都不再犯）：**
- .env 不配 → API 503 ❌
- 改了代码不验证 → 假提交触红线 ❌
- 跳过 100 次验证 → 漏 bug → Master 震怒 ❌
- 口头答应不落地 = 撒谎 ❌

---

## 🔗 关键信息

| 项目 | 值 |
|------|-----|
| ION BSC 主池 | `0x6487725b383954e05cA56F3c2B93a104B3DD2C25` |
| 真实 ION 价格 | ~$0.000139 |
| 真实 BNB 价格 | ~$600 |
| GeckoTerminal API | `https://api.geckoterminal.com/api/v2` |
| CMC API Key | `342475df9fa5451aafbb3346be049f03` |
| BSC RPC | `https://bsc-dataseed.binance.org/` |
| ION 链 RPC | `https://api.mainnet.ice.io/http/v2/` |
| BSC ION 合约 | `0xe1ab61f7b093435204df32f5b3a405de55445ea8` |
| 品牌主色 | `#00e5ff` glow 12px / `#ff3bd4` glow 8px |
| 无参考 UI | `https://github.com/DavidHDev/react-bits` |
