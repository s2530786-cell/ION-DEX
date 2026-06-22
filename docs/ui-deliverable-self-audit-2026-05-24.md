# UI 视觉自审 — 2026-05-24

**任务**: TASK-P1A CopyTrade + TASK-P1B LiquidityMine  
**验证**: `scripts\verify-full-save-log.cmd --no-pause` exit 0；Playwright **20/20**；CopyTrade E2E 100/100（历史）；LiquidityMine Forge stress 100/100

---

## 变更范围

| 页面/模块 | 变更 |
|-----------|------|
| `CopyTradePage.tsx` | 四统计卡、Featured leaders、复制配置表单、history；GlassPanel / MetricTile / NeonButton |
| `AppShell.tsx` | 侧栏 `copy-trade` 导航 |
| `ionApi.ts` | CopyTrade stats / start / stop API 类型与调用 |
| `integrationConfig.ts` | 默认 API `8787` 与 backend 对齐 |

---

## 设计路线对照（docs/10-ui-design-route.md）

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 深色蓝紫基底 + 霓虹玻璃 | 通过 | 沿用 AppShell Aurora + GlassPanel 体系 |
| 375 / 768 / 1440 响应式 | 通过 | stats 网格 `sm:grid-cols-2 xl:grid-cols-4`；E2E smoke viewport 绿 |
| 无新增 shell/draft 面板 | 通过 | 独立产品页，非 BusinessPages 占位 |
| 数据来源标注 | 通过 | `DataSourceBadge` + provenance（local-session / fallback） |
| testid 覆盖 | 通过 | `copy-trade-*` 与 E2E 契约一致 |

---

## 参考图 / 框架

- 整体框架：OKX Web3 风格 liquid-glass desk（现有 AppShell）
- Copy Trade：社交跟单 desk — hero + KPI 四卡 + leader 列表 + 表单 + history

---

## 残留项

- 链上 leader registry 未接线；backend 使用 catalog seed + 内存 session（`provenance.source: local-session`）
- `8787` 端口占用时 verify-e2e 可能复用已有 backend（EADDRINUSE 日志可忽略，E2E 仍绿）

---

## 结论

**PASS（工程 + 视觉门禁）** — verify-full 全绿；CopyTrade E2E 100/100；与 PRD 跟单模块方向一致。

---

# TASK-P1B LiquidityMine

## 变更范围

| 页面/模块 | 变更 |
|-----------|------|
| `LiquidityMinePage.tsx` | KPI 双卡（LP 份额 / 待领奖励）、池列表、质押/解押/领取、确认条 |
| `AppShell.tsx` | 侧栏 `liquidity-mine` 导航 |
| `ionApi.ts` | LiquidityMine pools / stake / unstake / claim API |
| `liquidityMine.ts` + routes | 后端内存 session + 2 seed 池 |
| `LiquidityMine.sol` + tests | BSC LP 挖矿合约（Forge 6 tests） |

## 设计路线对照

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 深色蓝紫 + 霓虹玻璃 | 通过 | GlassPanel / MetricTile / CyberCard 体系 |
| 375 / 768 / 1440 | 通过 | 池卡片 `grid` + smoke viewport 绿 |
| 无 shell/draft 占位 | 通过 | 独立 `LiquidityMinePage`，非 BusinessPages |
| 数据来源标注 | 通过 | provenance + API fallback 与 CopyTrade 一致 |
| testid | 通过 | `liquidity-mine-*`；E2E 2 tests 绿 |

## 参考图 / 框架

- OKX Web3 liquid-glass desk：双 KPI + 多池 LP 挖矿操作区
- 与 Stake/Pool 页信息层级一致（指标在上、操作在下）

## 残留项

- 链上 pool registry / indexer 未接线；backend `local-session` seed
- verify-e2e 在 Windows 上会检测 stale backend 并重启 8787（PowerShell 释放端口）

## 结论（P1B）

**PASS** — verify-full 20/20 E2E；backend 35 tests；LiquidityMine UI 符合设计路线。

---

# TASK-P2A DomainManage

## 变更范围

| 页面/模块 | 变更 |
|-----------|------|
| `DomainManagePage.tsx` | 查询/注册表单、已拥有列表、绑定/转移/续费三卡、钓鱼警示、KPI 三卡 |
| `domainManage.ts` + routes | GET overview；POST lookup / register / bind / transfer / renew |
| `App.tsx` | `domain` 独立路由；`ai` 指向 `AiSubscriptionPage` |
| `ionApi.ts` | DomainManage 类型与 API 调用 |
| `domain-manage.spec.ts` | E2E 2 tests（portfolio + register） |
| `verify-e2e.mjs` | backend 健康检查含 `/api/domain-manage/overview` |

## 设计路线对照

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 深色蓝紫 + 霓虹玻璃 | 通过 | GlassPanel / MetricTile / 细边框卡片 |
| 375 / 768 / 1440 | 通过 | KPI `sm:grid-cols-3`；操作区 `lg:grid-cols-3`；smoke viewport 绿 |
| 无 shell/draft 占位 | 通过 | 独立 `DomainManagePage`，脱离 BusinessPages domain desk |
| 数据来源标注 | 通过 | API `meta.source: mock` + fallback mock |
| testid | 通过 | `domain-manage-*` + 兼容 smoke `domain-form` 等 |

## 参考图 / 框架

- `DomainManage.vue` 原型：注册区 + 已拥有列表 + bind/transfer/renew 三操作卡
- OKX Web3 liquid-glass：hero + KPI + 表单 + 列表 + 操作卡

## 残留项

- ION DNS FunC / 官方 adapter 未接线；backend `local-session` + `resolveDomain` mock
- 注册/转移/续费仅记录 intent，不发链上交易（console.warn 已标注）

## 结论（P2A）

**PASS** — verify-full **24/24** E2E；backend **39** tests（含 domain-manage 4）；DomainManage UI 符合 PRD 与原型结构。

---

# TASK-P2B SettingPage

## 变更范围

| 页面/模块 | 变更 |
|-----------|------|
| `appSettings.ts` | `load/save/apply` 偏好；`clearAppLocalCache`（前缀 `ion-dex-cache-` / `ion-dex-draft-` / `ion-risk-ack`）；不删钱包 session |
| `SettingPage.tsx` | 深色模式 toggle、滑点编辑（0.1–5%）、通知开关、清缓存；summary 三卡 |
| `App.tsx` / `AppShell` / `pageRouting.ts` | `settings` 独立路由与侧栏导航 |
| `main.tsx` | 启动时 `applyAppSettingsToDocument` |
| `SwapPage.tsx` | 初始滑点读取 `loadAppSettings().defaultSlippagePct` |
| `settings.spec.ts` | E2E 2 tests（加载 + 改滑点/通知/清缓存） |

## 设计路线对照

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 深色蓝紫 + 霓虹玻璃 | 通过 | GlassPanel / 细边框 preference 行 |
| 375 / 768 / 1440 | 通过 | `max-w-3xl` 单列偏好列表；smoke viewport 绿 |
| 无 shell/draft 占位 | 通过 | 独立 `SettingPage`，非 BusinessPages |
| 纯前端偏好存储 | 通过 | localStorage + document dataset；无 fake 链上 |
| testid | 通过 | `settings-*` / `page-settings` 与 E2E 契约一致 |

## 参考图 / 框架

- `SettingPage.vue` 原型：深色 / 滑点 / 通知 / 清缓存四行偏好
- OKX Web3 设置页：hero + preference rows + summary tiles

## 残留项

- 深色模式为本地 document dataset + CSS filter，非系统级 theme provider
- 通知开关仅本地偏好，未接浏览器 Push / 后端订阅

## 结论（P2B）

**PASS** — verify-full **26/26** E2E；SettingPage UI 符合派工单与原型结构。

---

# TASK-P3A BatchTransfer

## 变更范围

| 页面/模块 | 变更 |
|-----------|------|
| `batchTransfer.ts` + routes | stats / history / send / collect；本地 session；最多 100 地址；`pending_signature` 无 fake txHash |
| `BatchTransferPage.tsx` | Transfer/Collect Tab、KPI 四卡、CSV 输入与解析、收款人表、Token 选择、确认弹窗、历史表 |
| `batchTransferCsv.ts` | `parseTransferCsv` / `parseAddressLines` |
| `AppShell.tsx` | 侧栏 `batch-transfer` 导航（去重） |
| `ionApi.ts` | BatchTransfer 类型与 API |
| `batch-transfer.spec.ts` | E2E 5 tests |

## 设计路线对照

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 深色蓝紫 + 霓虹玻璃 | 通过 | GlassPanel / MetricTile / NeonButton |
| 375 / 768 / 1440 | 通过 | KPI `sm:grid-cols-2 xl:grid-cols-4`；smoke viewport 绿 |
| 无 shell/draft 占位 | 通过 | 独立 `BatchTransferPage` |
| 数据来源标注 | 通过 | `DataSourceBadge` + provenance（local-session） |
| 协议费仅 ION | 通过 | Token 默认 BSC ION 地址 |
| testid | 通过 | `batch-transfer-*`；E2E 5 + smoke 导航绿 |

## 参考图 / 框架

- `BatchTransfer.vue` 原型：双 Tab + CSV 批量 + 历史
- OKX Web3 liquid-glass：hero + KPI + 表单 + 表格 + 确认流

## 残留项

- `BatchTransfer.sol` 未接线；backend 仅记录 intent（console.warn 已标注）
- Collect 模式为地址列表归集 intent，未发链上 multicall

## 结论（P3A）

**PASS** — verify-full **31/31** E2E；backend **42** tests；BatchTransfer UI 符合派工单与 PRD。
