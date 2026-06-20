# 前端开发团队权限矩阵

## 角色权限分级
| 等级 | 权限 | 含义 |
|------|------|------|
| R0 | 只读 | 查看文件、配置、日志 |
| R1 | 可提议 | R0 + 提出修改建议、提交 PR |
| R2 | 可修改 | R1 + 直接修改文件、推送 commit |
| R3 | 可批准 | R2 + 批准合并、发布、升级阀门 |

## 18 角色 × 5 层级权限表

| # | 角色 | 代码 | 源码 | 配置 | 构建 | 部署 |
|---|------|------|------|------|------|------|
| 1 | Product Manager (PM) | R1 | R0 | R1 | R0 | R0 |
| 2 | Design Director (DD) | R0 | R1 | R2 | R0 | R0 |
| 3 | UI Component Architect (UCA) | R2 | R1 | R1 | R0 | R0 |
| 4 | CSS Engineer (CE) | R2 | R1 | R1 | R0 | R0 |
| 5 | Layout Engineer (LE) | R2 | R1 | R1 | R0 | R0 |
| 6 | Asset Manager (AM) | R1 | R2 | R1 | R0 | R0 |
| 7 | Interaction Engineer (IE) | R2 | R1 | R1 | R0 | R0 |
| 8 | Accessibility Engineer (AE) | R2 | R1 | R1 | R0 | R0 |
| 9 | Responsive Engineer (RE) | R2 | R1 | R1 | R0 | R0 |
| 10 | Performance Engineer (PE) | R2 | R1 | R2 | R2 | R0 |
| 11 | Internationalization Engineer (i18n) | R2 | R2 | R1 | R0 | R0 |
| 12 | Visual QA Engineer (VQE) | R1 | R1 | R1 | R1 | R1 |
| 13 | Design Token Engineer (DTE) | R2 | R3 | R3 | R1 | R0 |
| 14 | Grid System Engineer (GSE) | R2 | R3 | R2 | R1 | R0 |
| 15 | .cursorrules Guardian (CG) | R1 | R3 | R3 | R0 | R0 |
| 16 | Composer Orchestrator (CO) | R1 | R1 | R2 | R2 | R2 |
| 17 | Build Engineer (BE) | R1 | R1 | R2 | R3 | R2 |
| 18 | Code Review Engineer (CRE) | R2 | R2 | R1 | R1 | R1 |

## 操作权限矩阵

| 操作 | R0 | R1 | R2 | R3 |
|------|----|----|----|----|
| 读取文件 | ✅ | ✅ | ✅ | ✅ |
| 提交 PR / Issue | ❌ | ✅ | ✅ | ✅ |
| 直接修改文件 | ❌ | ❌ | ✅ | ✅ |
| 推送 commit | ❌ | ❌ | ✅ | ✅ |
| 合并 PR | ❌ | ❌ | ❌ | ✅ |
| 批准发布 | ❌ | ❌ | ❌ | ✅ |
| 升级阀门 | ❌ | ❌ | ❌ | ✅ |
| 修改 Design Tokens | ❌ | ❌ | ❌ | ✅ |
| 修改 .cursorrules | ❌ | ❌ | ❌ | ✅ |
| 修改 Grid Harness | ❌ | ❌ | ❌ | ✅ |

## 缰绳系统规则
- 任何 R3 操作必须经 Code Review Engineer + .cursorrules Guardian 双重 R3 批准
- DTE + GSE 对 Design Tokens / Grid Harness 拥有互斥审批权：一方修改另一方必须批准
- CO 有权派发任务给任何 R1-R2 角色，无权修改 R3 级资源
- 紧急修复（hotfix）可由任何 R2 角色发起，但必须在 1 小时内补 R3 双签
