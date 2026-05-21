# ION DEX 工程交付标准 (Engineering Standards)

> 本文是项目最高级别的工程规则。任何代码改动、任何 PR、任何交付物必须满足本文的每一条。
> 违反本文 = 改动不予合并 = 不予交付。

---

## 0.1 官方源码铁律 (Official Source Authority)

| 规则 | 强制等级 |
|------|----------|
| 写桥/销毁/钱包/代币逻辑前，必须先查阅 `ice-blockchain/*` 官方仓库或 `docs/ion-official-canonical-addresses.md` | 阻断 |
| 官方已有实现或已确认链上地址时，禁止臆造（如 wION、假 wrapper、假 burn 路径） | 阻断 |
| BSC ION / BSC 销毁地址必须使用共享常量文件，禁止散落魔法字符串 | 警告 |

已确认 BSC 常量见 `docs/ion-official-canonical-addresses.md`。

---

## 0. 编码规范 (Encoding Discipline)

| 规则 | 强制等级 |
|---|---|
| 所有源文件必须 **UTF-8 without BOM** | 阻断 |
| 严禁 UTF-16 LE/BE、GBK、ANSI、带 BOM 的 UTF-8 | 阻断 |
| 严禁源文件含 `\u0000` (NUL) 字符 | 阻断 |
| 行尾统一 **LF** (Unix)，禁止 CRLF (Windows) | 警告 |
| 缩进统一 **2 空格** (Solidity / Tact 例外，按官方标准) | 警告 |

**强制机制**：
- `scripts/check-encoding.ps1` / `scripts/check-encoding.sh` — 扫描全仓库
- Git pre-commit hook 调用上述脚本，发现违规直接拒绝提交
- CI 流水线第一步即跑编码检查，失败即终止
- AI Agent 每次写完文件**必须立即回读首 3 字节** + 全文 NUL 字符扫描，证据写入对话

**禁止使用的命令**（在 Windows PowerShell 5.1 上会默认产生 UTF-16）：
- `echo "..." > file`
- `... >> file`
- `Set-Content`、`Out-File`、`Tee-Object`（无明确 `-Encoding utf8NoBOM` 时）

**允许使用的写入方式**：
- `[System.IO.File]::WriteAllText(path, content, (New-Object System.Text.UTF8Encoding($false)))`
- VS Code / Cursor 内编辑保存（确保右下角显示 `UTF-8`，**不是** `UTF-8 with BOM`）
- AI Agent 的 `Write` / `StrReplace` 工具（落盘后立即字节级验证）

---

## 1. 前端 UI 验收标准

### 1.1 设计还原度
- 严格对照设计稿，**像素级**还原：色号、阴影、渐变、字体、圆角、间距
- Tailwind 主题配置 + design tokens 集中管理（`tailwind.config.js` + `src/styles/tokens.css`）
- 禁止任意 magic number，必须走 token

### 1.2 响应式
- 三端断点必测：**375px (手机) / 768px (平板) / 1440px (桌面)**
- 测试工具：Playwright 跨视口截图 + 人工目检
- 输出：每个页面 × 每个断点 = 一张 baseline 截图，存 `tests/visual/baseline/`

### 1.3 交互完整性
每个按钮 / 输入框必测以下状态：

| 控件 | 必测状态 |
|---|---|
| Button | default / hover / active / focus / disabled / loading |
| Input | default / focus / typing / error / disabled / readonly |
| Modal | open / close / backdrop click / ESC / focus trap |
| Dropdown | closed / open / hover item / keyboard nav / outside click |
| Toast | success / warning / error / info / auto-dismiss / manual close |

### 1.4 数据与极端场景必测
- **严禁空数据 / 伪代码 / 假列表作为产品内容**；没有具体数据对接时，不得把页面包装成已完成。
- 加载态只允许绑定真实请求生命周期（骨架屏 ≥ 200ms 才显示，避免闪烁）
- 错误态只允许绑定真实请求失败（网络错误、超时、4xx、5xx），并必须暴露来源和重试路径
- 超长文本（地址、Token symbol、域名）必须截断 + tooltip
- 注入测试（XSS 字符串、Emoji、Unicode 边界字符、RTL）

### 1.5 可访问性 (a11y)
- 通过 axe-core 自动扫描，0 violations
- 所有交互元素键盘可达
- 色彩对比度 ≥ WCAG AA (4.5:1)
- ARIA label 完整

### 1.6 性能
- Lighthouse Performance ≥ 90、Accessibility ≥ 95、Best Practices ≥ 95
- 首屏 FCP ≤ 1.5s，TTI ≤ 3s
- 关键依赖懒加载（lightweight-charts、framer-motion 路由级 split）

### 1.7 UI 视觉自检报告（铁律 · 2026-05-21）

**每次 UI / 前端页面、布局、样式、玻璃组件相关工作完成后**，必须额外产出一份交付自检报告，**不得**用 `verify-full` / Playwright 绿灯代替。

| 规则 | 强制等级 |
|---|---|
| 报告须对照用户/项目**成品参考图** + `docs/10-ui-design-route.md` + `.memory-bank/overall-design-framework.md` | 阻断 |
| 报告须含 **思考过程** + **结构化差距矩阵** + **P0/P1/P2 整改路线** + **附件索引** | 阻断 |
| 须明确区分 **工程验证通过** 与 **视觉门禁通过** | 阻断 |
| 模板：`docs/templates/ui-visual-self-audit-TEMPLATE.md` | 必须 |
| 铁律全文：`docs/11-ui-visual-self-audit-gate.md` | 必须 |
| 示例：`docs/ui-deliverable-self-audit-2026-05-21.md` | 参考 |

未提交报告 = UI 任务未完成 = 不得对用户宣称「UI 已按设计交付」。

---

## 2. 智能合约验收标准

### 2.1 安全审计清单（CertiK / Trail of Bits 标准）

| 类别 | 检查项 |
|---|---|
| 重入 | 所有外部调用前完成状态更新 (Checks-Effects-Interactions)；关键函数 `nonReentrant` |
| 整数 | Solidity ≥ 0.8 自带溢出检查；FunC / Tact 手工边界验证 |
| 访问控制 | `Ownable` + `AccessControl`，关键操作走 Timelock + 多签 |
| 闪电贷 | 价格读取走 TWAP + 多源预言机；禁止用单一现货池作价 |
| MEV | 最大滑点保护、最小输出保护、私有交易池（Flashbots / 类似机制）|
| 中心化 | 关键参数受 Timelock 控制，紧急 pause 走多签 |
| 函数可见性 | 所有函数显式标注 `external`/`public`/`internal`/`private` |
| Gas 优化 | 存储布局打包、`immutable`/`constant` 使用、unchecked 块审慎使用 |
| 事件 | 所有状态变更必须有事件，参数完整可索引 |
| 升级安全 | UUPS / Transparent Proxy 走 OpenZeppelin 模板，存储槽冲突静态检查 |

### 2.2 测试覆盖
- **单元测试**：覆盖率 ≥ 95%（Foundry / Hardhat）
- **集成测试**：跨合约调用链路全覆盖
- **边界测试**：zero address / max uint / 空数组 / 单元素数组 / 重复元素
- **不变量测试**：Echidna / Foundry invariant fuzzing，每个合约至少 10 个不变量
- **形式化规约**：核心算术（AMM 定价、利率、销毁分配）写 Certora 规约或 SMT 不变量

### 2.3 静态分析（CI 强制）
| 工具 | 用途 |
|---|---|
| Slither | 静态漏洞扫描，0 high / 0 medium |
| Mythril | 符号执行 |
| Aderyn (Rust) | 代码气味检测 |
| solhint | 风格 + 安全规则 |
| 4naly3er | gas 优化建议 |

### 2.4 部署
- **测试网必须先跑通完整业务闭环 14 天以上无重大问题**
- 部署脚本（Hardhat / Foundry script）幂等、可重跑、自动 verify
- 构造函数参数、初始 owner、初始权限**在部署后立即在区块浏览器上人工核对**
- Etherscan / TONScan 源码 verify 100%

---

## 3. 后端验收标准

### 3.1 API 测试
- 每个端点必须有：正常 / 缺参 / 非法参 / 鉴权失败 / 越权 / 超时 / 限流 7 种用例
- Contract test（消费者驱动）：Pact 或类似工具
- OpenAPI 规范完整，前端 SDK 自动生成

### 3.2 数据层
- 事务边界明确，回滚路径必测
- 并发写入冲突：乐观锁 (`version` 列) + 重试
- 索引必须有对应慢查询测试证据
- 迁移可前进可回滚（`up.sql` + `down.sql`）

### 3.3 可观测性
- 结构化日志（JSON）：traceId / spanId / userId / requestId
- 关键操作（创建/修改/删除/转账/签名/上链）单独审计日志流，永不删除
- Prometheus 指标：QPS / P50 / P95 / P99 / 错误率
- OpenTelemetry trace 全链路打通

### 3.4 错误处理
- 禁止 `catch { }` 吞异常
- 禁止把内部异常信息直接回传客户端
- 所有错误必须分类编码（如 `ION_DEX_E0001`）

---

## 4. 压力测试

| 层 | 工具 | 目标 |
|---|---|---|
| 前端 | React DevTools Profiler + Playwright | 1 万条订单流虚拟列表 60fps |
| 后端 | k6 / wrk | 100 并发持续 5 分钟，P99 < 500ms，错误率 < 0.1% |
| 合约 | Foundry gas snapshot + 循环边界测试 | 单笔 swap ≤ 200k gas，单笔批量 ≤ block gas limit 50% |
| 桥 | 自定义 chaos test | 中继器宕机 / 重放 / 乱序到达全部覆盖 |

---

## 5. 部署与发布

### 5.1 环境分离
```
.env.local      # 本机开发
.env.testnet    # 公开测试网
.env.staging    # 准生产
.env.production # 生产（敏感值走密钥管理服务，不入仓库）
```

### 5.2 发布流程
1. 测试网通过 14 天连续无重大事故
2. 第三方安全审计报告通过（合约）
3. 灰度发布：先 5% → 20% → 100%
4. 每次发布有完整回滚预案文档化

### 5.3 跨链一致性
- 桥两端账本对账每 10 分钟自动跑一次
- 不一致超过阈值即自动熔断 + 报警

---

## 6. 安全

| 维度 | 措施 |
|---|---|
| 依赖 | `npm audit` / `pip-audit` / `cargo audit` 高危为 0 才能合并 |
| 前端 | CSP + Trusted Types + 严格 SameSite Cookie + CSRF Token + XSS sanitizer |
| 合约 | 私钥永不入仓库；管理员私钥走硬件钱包；多签门槛 ≥ 3/5 |
| 权限 | 最小权限原则；按角色拆 keeper / oracle / treasury / pauser / upgrader |
| 密钥 | 所有 secret 走 Vault / AWS Secrets Manager / 1Password CLI |

---

## 7. 开发流程

```
需求 → 大纲 + 计划 → 用户确认 → 分步实现 → 每步附测试证据 → 全部完成 → 汇总交付
```

### 每一步交付物必须包含：
1. 改动的代码
2. **该步骤的测试证据**（单元测试结果 / 截图 / 日志 / gas 报告 / 静态扫描报告）
3. 编码合规检查输出（`check-encoding` 通过）
4. 下一步预告

### 全部完成的最终交付物：
- 完整代码（已合并、已 tag）
- 测试报告（覆盖率、性能、安全）
- 部署文档（含回滚预案）
- 用户手册 + 开发文档
- 审计报告（合约部分）

---

## 8. AI Agent 自我约束（本协作的具体执行准则）

1. **每次写完文件**：立即用 Read 回读 + 跑 `check-encoding` 确认，证据贴在对话里
2. **每次声称"完成"**：必须先在工具调用层面实际执行（type-check / test / lint），把命令输出贴出来；不允许只在对话里"声称"完成
3. **不知道就说不知道**：能力之外的事（如真实主网部署、第三方审计颁发证书）明确划界，不假装能做
4. **不擅自变更架构**：遵循已确认的设计文档；要变更必须先提议、等用户确认
5. **每一步附测试结果**：哪怕只是一行 type-check 通过的输出，也必须有
