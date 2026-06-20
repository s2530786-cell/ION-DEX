# 全自动前端开发团队 — 完整架构索引

## 📂 制度文件清单（本目录）

| 文件 | 内容 | 状态 |
|------|------|------|
| `blueprint.md` | 18 角色矩阵 + 阀门系统总览 | ✅ |
| `institutional-framework.md` | 制度框架总纲 | ✅ |
| `01-permission-matrix.md` | 权限矩阵（18 角色 × 5 层 × R0-R3 分级） | ✅ |
| `02-acceptance-checklist.md` | 验收清单（10 节 50+ 检查项） | ✅ |
| `03-fix-escalation.md` | 修复层级图（L0-L4 分级 + 升级链路 + SLA） | ✅ |
| `04-gate-rules.md` | 升级阀门规则（P0→P1→P2→Release 四级阀门） | ✅ |
| `05-tool-status.md` | 工具链状态（设计/开发/测试/CI/CD/资产） | ✅ |
| `pipeline.md` | 全自动前端流水线（Next.js + Playwright + Cursor Agent） | ✅ |
| `harness-engineering.md` | Harness 工程底座（agent_harness + DEXGridHarness + 像素对齐） | ✅ |
| `channel-content-system.md` | 频道内容体系 v1.0（7 模板 + 双语标准） | ✅ |

## 🔧 Harness 工程文件（ion-dex-nuke 根目录）

| 文件 | 内容 | 状态 |
|------|------|------|
| `src/lib/design-tokens.ts` | 视觉协议令牌（Deep Space + Neon Glow + Glassmorphism） | ✅ |
| `src/components/layout/DEXGridHarness.tsx` | 强制栅格底座（350px 1fr 300px） | ✅ |
| `.cursorrules` | 三层工程铁律（视觉像素对齐 + 合约安全 + 开发工作流） | ✅ |
| `agent_harness.py` | 后端合约执行引擎（安全审计 + FunC编译 + Blueprint测试） | ✅ |
| `.cursor/rules/ui-harness-protocol.mdc` | UI 工程协议（零视觉决策 + 素材物理分离 + 像素级对齐） | ✅ |
| `.cursor/rules/frontend-team-task.mdc` | 前端团队任务分发规则 | ✅ |
| `scripts/pipeline/pipeline-frontend.ps1` | 前端 CI/CD 流水线脚本 | ✅ |
| `scripts/visual-diff.mjs` | Playwright + pixelmatch 视觉回归 | ✅ |
| `playwright.config.ts` | Playwright 配置 | ✅ |
| `next.config.ts` | Next.js Turbopack 配置 | ✅ |

## 🏗️ 架构总览

```
全自动前端开发团队
├── 蓝图层: blueprint.md (18 角色 + 阀门)
├── 制度层: 01-04 制度文件 (权限/验收/修复/阀门)
├── 工程层: harness-engineering.md (Harness 底座)
├── 流水线: pipeline.md (自动化 CI/CD)
└── 内容层: channel-content-system.md (频道输出)
```

## 🔗 缰绳系统 (Rein System)

缰绳系统 = 18 角色蓝图 + 4 制度 + Harness 工程底座 + 工具绑定 + 阀门系统

### 缰绳控制点
1. **权限缰绳**: 01-permission-matrix.md — 18 角色 × R0-R3 权限，谁能动什么
2. **质量缰绳**: 02-acceptance-checklist.md — 10 节 50+ 检查项，不过不发布
3. **修复缰绳**: 03-fix-escalation.md — L0-L4 升级链路，bug 不逃逸
4. **阀门缰绳**: 04-gate-rules.md — P0→P1→P2→Release，不绿不过

### 缰绳握法
- **日常开发**: CO 派发任务 → 角色执行 → CRE review → 阀门检查
- **紧急修复**: 直接 L4 → 全团队 → 1 小时内补签
- **架构变更**: DTE + GSE + CG 三 R3 联签

## 🎯 当前状态

- **阀门**: P0 (0/11 角色 + 0/4 系统)
- **流水线**: Dev server 就绪 (localhost:3000)
- **Visual Diff**: 5/5 baselines 已建
- **Cursor Agent**: 非交互模式已配置

## 📍 双路径同步

```
# 制度文件（两处同步）
D:\openclaw-tools\ion-dex-nuke\reference\design\ion-dex\
D:\openclaw-data\workspace\memory\super-memory-system\projects\frontend-dev-team\

# Harness 工程文件
D:\openclaw-tools\ion-dex-nuke\
```

## 🔗 缰绳系统完整链路

```
18 角色蓝图 (blueprint.md)
    ↓
4 制度文件 (01-04) → 权限矩阵 + 验收清单 + 修复层级 + 阀门规则
    ↓
Harness 工程底座 → design-tokens.ts + DEXGridHarness.tsx + .cursorrules + agent_harness.py
    ↓
工具绑定 → 05-tool-status.md + pipeline-frontend.ps1 + visual-diff.mjs
    ↓
阀门系统 → P0(11角色+4系统) → P1(7角色) → P2(4角色) → Release
    ↓
频道输出 → channel-content-system.md (7模板 + 双语)
```

**缰绳系统 = 制度层 + 工程层 + 工具层 + 阀门层 + 输出层，五层咬合，缺一不可。**
