# AI 触碰红线标准 — Master 钦定（永久）

> 旺财总经理传达，Master 钦定。与铁律同级，每次会话自动加载。  
> 写入日期：2026-05-19

---

## 红线一：严禁撒谎（No False Claims）

**禁止：**

- 口头上说「已完成」「已通过」「已部署」「已测试」，但仓库/链上/终端里**查不到证据**。
- 只空谈计划、不写文件、不跑命令，却汇报「已经做完」。
- 把「打算做」「部分做了」说成「全部完成」。
- 编造 exit code、测试条数、commit hash、交易 hash、合约地址。

**必须：**

- **先干再说**：改文件 → 跑命令 → 读输出 → 再向 Master 汇报。
- 汇报格式带**可核对证据**（命令 + 关键输出一行，或文件路径 + 行号）：

```text
[TOOL] node scripts/dual-chain-audit.mjs → exit 0 | ION 1500/1500 BSC 1500/1500
[FILE] backend/src/services/markets.ts — 仍 mock，未接 RPC（诚实标注）
```

- 做不到（无 shell、无密钥、阻塞）→ **明确写 BLOCKED**，不写「已完成」。
- 1499 绿 + 1 红 = **FAIL**，不得声称通过。

---

## 红线二：禁止空代码、禁止空数据（Real Chain, Real Function）

**禁止：**

- 占位符业务逻辑：`return mockData`、`TODO` 当功能交付、`status: "mock"` 冒充生产。
- 硬编码价格/TVL/余额/桥状态，却对外称「实时链上数据」。
- 前端按钮可点但**无钱包签名、无广播、无 tx hash**，却称「Swap 已完成」。
- 合约/接口字段与链上事件、表结构**对不上**（字段名随意、单位错误、链 ID 混用）。

**必须：**

- 数据路径可追溯：`RPC / indexer / CMC` → adapter → API → UI；每一层知道**权威来源**（见 `docs/19-official-integration-data-authority.md`）。
- Mock 仅允许在**显式 dev 模式**且 UI/API 标注 `source: mock` 或 `dataMode: mock`；不得静默冒充主网数据。
- 链上功能交付最低标准：**连接钱包 → 模拟/签名 → 广播（或明确 dry-run）→ 回执/确认数**；缺一不得称「链上已通」。
- 新字段、新 API、新合约事件：与 `docs/12-indexer-and-data-pipeline.md` 或架构表**同步更新**，禁止「只写前端不写后端/索引」。

**当前仓库诚实状态（勿夸大）：**

| 模块 | 现状 |
|------|------|
| Backend 多数 service | 仍 mock，P0-4 未接真实 RPC/CMC |
| Frontend Swap/Pool/Bridge | UI 有，**无真实签名与链上交易** |
| Bridge | `BusinessPages.tsx` 壳，无跨链 tx |
| 合约 | 测试网/编译绿 ≠ 主网已部署 |

---

## 红线三：写代码必须自查（Encoding + Syntax）

**禁止：**

- 中文或标点乱码：`鈫?`、`鈥?`、`鉁?`、`脳`、`??`、未闭合 JSX、假标签（`motionmotionmotionmotiondiv`）。
- UTF-16 / GBK / BOM 文件（项目强制 **UTF-8 without BOM**）。
- 未 import 的组件、大量 `any`、连续 3 行以上空行、拼音占位符。

**每次写完必做（交付前）：**

1. **目视 diff**：扫一遍新增行，有无乱码与垃圾字符串。
2. **编码检查**（能跑终端时）：

```bat
powershell -File scripts\check-encoding.ps1
```

3. **分层验证**（按改动范围）：

```bat
scripts\agent-verify.cmd
REM 或 scripts\verify-full-save-log.cmd --no-pause
```

4. 改 `.md` 含中文时：标点用 `—` `→` `×`，与后文**留空格**；可跑 `node scripts/fix-architecture-audit-encoding.mjs` 修 architecture-audit 漂移。

**不通过 = 不得声称「代码可用」。**

---

## 违反红线的处理

1. 立即停止声称完成。
2. 在 `SESSION_STATE.md` 记录：声称了什么、实际缺什么、修复计划。
3. 先补证据或补实现，再重新汇报。

---

## 关联文档

- `.memory-bank/development-iron-law-preflight.md` — 验证命令与双链 1500
- `.cursor/rules/ion-dex-iron-law.mdc` — 零垃圾、安全优先
- `.cursor/rules/12-factor-agents.mdc` — Factor -1 零垃圾
- `.cursor/skills/ion-dex-memory/SKILL.md` — Encoding self-check
- `docs/17-release-milestones.md` — 能力成熟度（UI / Data / On-chain / Production）
