# 开发前铁律预检 — 每次写代码前必读

> Master 钦定（2026-05-19）。Agent **每次会话起手、每次改代码前** 必须先读完本文件 + 下列铁律源文件，再动手。不得跳过。

---

## 0. 起手阅读顺序（强制，≤10 个文件）

按顺序读取，读完再规划/编码：

| 序 | 文件 | 用途 |
|----|------|------|
| 1 | `.memory-bank/README.md` | Master 永久规则 + 记忆库索引 |
| 2 | `.memory-bank/ai-red-lines.md` | **AI 红线**：不撒谎、不空数据、编码自查 |
| 3 | **本文件** `.memory-bank/development-iron-law-preflight.md` | 双链审计、100 绿、验证命令 |
| 4 | `.cursor/rules/ion-dex-iron-law.mdc` | 15 类攻击 × 100 = 1500 绿底线、开发循环 |
| 5 | `.cursor/rules/ion-autonomous-verify.mdc` | 24/7 自主循环、forge/func 命令 |
| 6 | `.cursor/rules/12-factor-agents.mdc` | 零垃圾、DAG、验证不跳步 |
| 7 | `SESSION_STATE.md` | 当前任务 / Next Action |
| 8 | `docs/99-current-progress.md` | 权威进度与最近验证证据 |
| 9 | `.memory-bank/architecture-audit.md` | P0 队列（第一个未勾选任务） |
| — | `docs/09-blueprint-index.md` | 蓝图 10–22 索引（设计未实现≠已完成） |
| 10 | `docs/08-ci-agent-automation.md` | 步 0–9 自动工作流、Hooks |
| 11 | 领域 Skill（按需 1 个） | 合约 `ion-contract-audit` / 前端 `ion-web3-ui` / 后端 `ion-data-backend` |

**禁止：** 未读铁律直接改文件；未验证声称通过；1499 绿 + 1 红 = **FAIL**。

---

## 1. 用户偏好（永久）

- **中文** 沟通；源码 **UTF-8 无 BOM**。
- **写完必自查乱码**：保存后目视 diff，禁止 `鈫?`/`鈥?`/`鉁?`/`脳`/`??` 等；标点用 `—` `→` `×` 且与后文留空格；能跑则 `scripts\check-encoding.ps1`。
- **全自动**：验证、修复、workflow、常规改动 **不逐步问确认**；仅密钥/主网/不可逆删除/需求歧义时问 Master。
- **未经明确要求不 git commit**（用户规则优先于自主规则里的自动 commit）。

---

## 2. 双链安全审计（ION + BSC，各 1500）

| 链 | 工具 | 规模 | 说明 |
|----|------|------|------|
| **ION (FunC)** | `scripts/func-security-audit.mjs` | 15 类 × 100 = **1500** | 入口合约静态探针 + 编译门 |
| **ION (FunC)** | `scripts/func-contract-test.mjs` | 22/22 + 6 bytecode golden | P0-2 回归 |
| **BSC (Solidity)** | `contracts/bsc/test/SecurityAttackTest.t.sol` | 15 类 × 100 = **1500** | Foundry 含 **防量子 #15** |
| **双链一次** | `scripts/dual-chain-audit.mjs` | ION 1500 + BSC 1500 | 改合约后必跑 |
| **铁律全套** | `scripts/iron-law-security.cmd` | 压力 + ION + BSC | 本地一键 |

```bat
node scripts\dual-chain-audit.mjs
scripts\iron-law-security.cmd
cd contracts\bsc && forge test --match-contract SecurityAttackTest --summary
```

---

## 3. 压力测试

| 范围 | 命令 | 默认 |
|------|------|------|
| API Gateway | `cd backend && npm run stress` | 9 端点 × 120 请求，p95 阈值 |
| 加重 | `set ION_STRESS_PROFILE=heavy` 后 `iron-law-security.cmd` | 500 请求/端点 |

---

## 4. 100 次全绿门禁（CertiK 级反复审计）

| 目标 | 命令 | 每轮内容 |
|------|------|----------|
| **全栈含 E2E** | `scripts\verify-100.ps1 -Iterations 100` | dual-chain-audit + 编码 + 后端 verify/stress + 前端 build + **Playwright** + audit:high |
| **仅双链安全** | `scripts\verify-100-dual-chain.ps1 -Iterations 100` | 每轮仅 `dual-chain-audit.mjs` |
| 单次全量 | `scripts\verify-full-save-log.cmd --no-pause` | 日志 `%TEMP%\ion-verify-full.txt` |
| Agent 快验 | `scripts\agent-verify.cmd` | CI/Hooks 用 |

**通过标准：** `PASSED=100`、`FAILED=0`、`RESULT=GREEN`、`exit 0`。  
**功能开发完成后** 默认跑满 100 绿；窄调查时 Master 可豁免。

两条 100 绿流水线 **可并行**（全栈约 5–8h，双链约 3h）。

---

## 5. 改代码后最小验证（每次提交前）

```
node scripts\compile-func.mjs
node scripts\func-contract-test.mjs
node scripts\dual-chain-audit.mjs          REM 若动合约
scripts\agent-verify.cmd                   REM 若动前端/后端
```

合约专用：

```
cd contracts\bsc && forge build && forge test --match-contract SecurityAttackTest
```

---

## 6. 开发循环（铁律，不跳步）

```
读 SESSION_STATE + 本预检 + 铁律
 → 编译 (compile-func / forge build / npm run build)
 → 审计 (15 类 + Slither 可选)
 → 修复
 → 重编译
 → dual-chain-audit + agent-verify
 → 更新 SESSION_STATE + docs/99-current-progress.md
 → （Master 要求时）commit
 → 100 绿 verify-100（功能阶段完成时）
```

---

## 7. 相关脚本索引

| 脚本 | 作用 |
|------|------|
| `scripts/automation-preflight.mjs` | Cloud/CI 预检 |
| `scripts/audit-all.mjs` | forge + func-security + SecurityAttackTest + 前后端 |
| `scripts/ion-on-save-pipeline.mjs` | 保存时 compile-func Hook |
| `scripts/agent-autonomous-workflow.cmd` | preflight + func + agent-verify |
| `scripts/automation-scheduled-gate.cmd` | **统一自动门**（`ION_AUTO_MODE`） |
| `scripts/register-windows-scheduled-tasks.ps1` | 注册本机计划任务（30m quick / 日 standard / 日 iron） |
| `scripts/start-verify-100-background.cmd` | 后台跑 100 绿（日志 `%TEMP%`） |

---

## 8. 自动工作流（已配置，无需每次手动敲）

### 本地 Windows（计划任务，一次性注册）

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\register-windows-scheduled-tasks.ps1
```

| 任务名 | 频率 | 模式 | 内容 |
|--------|------|------|------|
| `ION-DEX-Auto-Quick-30m` | 每 30 分钟 | `quick` | preflight + FunC + agent-verify |
| `ION-DEX-Auto-Standard-Daily` | 每天 03:15 | `standard` | quick + **dual-chain-audit** |
| `ION-DEX-Auto-Iron-Daily` | 每天 04:00 | `iron` | **iron-law-security** 全套 |

手动一键（任意模式）：

```bat
set ION_AUTO_MODE=standard
scripts\automation-scheduled-gate.cmd
```

长门禁后台：

```bat
scripts\start-verify-100-background.cmd
```

结果摘要：`%TEMP%\ion-auto-gate-<mode>-latest.txt`

### VS Code / Cursor

- 打开文件夹 → **Compile FunC on Startup**（`tasks.json` `runOn: folderOpen`）
- 默认测试任务：**ION DEX: autonomous workflow**
- 另增：iron-law、dual-chain、auto gate (standard)、verify-100 后台、注册计划任务

### Cursor Hooks（已启用 `.cursor/hooks.json`）

- 保存文件 → `ion-on-save-pipeline.mjs`（编码 + FunC）
- Agent 结束 → `ion-verify-on-stop.cmd`

### GitHub Actions

| Workflow | 触发 |
|----------|------|
| `.github/workflows/ion-dex-verify.yml` | push / PR / 手动（含 **dual-chain-audit**） |
| `.github/workflows/ion-dex-scheduled-gates.yml` | 每天 02:30 UTC / 手动（cloud verify + 可选 heavy stress） |

### Cloud Agent（`.cursor/automations/ion-dex-autonomous-build.yml`）

- 每 30 分钟 schedule → 先 `automation-preflight` + `agent-cloud-verify.sh`

### verify-100 稳定性

- `backend-stress` 失败会自动 **sleep 2s 重试 1 次**（与 encoding 同类策略）

---

_本文件由 Master 要求写入记忆库；与 `.cursor/rules/ion-dex-iron-law.mdc` 同步，冲突时以 Master 钦定铁律为准。_
