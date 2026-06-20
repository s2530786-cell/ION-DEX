# 06-memory-knowledge-base.md
# 记忆与知识库整合 — 前端开发团队制度文件

## 整合目标

将两个记忆系统挂载到前端开发团队工作流中：
1. **ION Memory Tree** — 19 份 ION 文明知识库文件 → 树状索引
2. **超级记忆系统 openhuman_bridge** — events/ 日记忆 → 层级记忆树

## 挂载点

### 挂载点 1：CO（Composer Orchestrator）任务派发前

CO 派发任何前端任务前，必须先检索知识库：

```powershell
# 1. 查 ION Memory Tree — 确认任务是否符合文明蓝图
$env:PYTHONIOENCODING="utf-8"
python D:\openclaw-data\workspace\scripts\ion-memory-tree-builder.py query "关键词"

# 2. 查超级记忆系统 — 确认有无历史纠正/最佳实践
python D:\openclaw-data\workspace\memory\super-memory-system\openhuman_bridge.py search "关键词"
```

### 挂载点 2：CRE（Code Review Engineer）审查前

CRE 审查 Cursor 输出时，对照知识库检查：
- 设计是否符合 Constitution 定义的标准
- 功能是否在 Roadmap 范围内
- 有没有触犯 Phase 1 Rules Locklist 中的禁止项

### 挂载点 3：CG（.cursorrules Guardian）规则注入

CG 维护 `.cursorrules` 时，从知识库提取最新铁律注入。

## 检索命令速查

| 场景 | 命令 |
|------|------|
| 查文明蓝图 | `ion-memory-tree-builder.py query "blueprint"` |
| 查宪法规定 | `ion-memory-tree-builder.py query "constitution"` |
| 查身份/信誉 | `ion-memory-tree-builder.py query "identity"` |
| 查支付体系 | `ion-memory-tree-builder.py query "payment"` |
| 查风险引擎 | `ion-memory-tree-builder.py query "risk"` |
| 查工程执行 | `ion-memory-tree-builder.py query "cursor"` |
| 查历史纠正 | `openhuman_bridge.py search "错误 修复"` |
| 查部署记录 | `openhuman_bridge.py search "deploy"` |

## 自动化集成

### Pipeline 前置步骤

在 `pipeline-frontend.ps1` 的 `route` 阶段前插入：

```powershell
# Step 0: 知识库预检索
$taskKeywords = Get-Content ".cursor-queue\task-keywords.txt"
$env:PYTHONIOENCODING = "utf-8"
python D:\openclaw-data\workspace\scripts\ion-memory-tree-builder.py query $taskKeywords
python D:\openclaw-data\workspace\memory\super-memory-system\openhuman_bridge.py search $taskKeywords
```

### 心跳同步

每次心跳自动更新两棵树：

```powershell
# 重建 ION Memory Tree（如果知识库文件有变更）
python D:\openclaw-data\workspace\scripts\ion-memory-tree-builder.py build --group all

# 重建超级记忆树（如果 events/ 有新文件）
python D:\openclaw-data\workspace\memory\super-memory-system\openhuman_bridge.py tree
```

## 缰绳系统更新

新增第 5 个缰绳控制点：

### 5. 知识缰绳: 06-memory-knowledge-base.md（本文件）
- **知识库检索**: 任务派发前强制检索 ION Memory Tree + 超级记忆系统
- **历史纠正注入**: 每次任务前检查 openhuman_bridge 有无相关纠正记录
- **蓝图对齐**: 所有前端输出必须与 Constitution/Roadmap 对齐
- **铁律注入**: CG 维护 .cursorrules 时自动注入最新铁律

## 五缰绳完整链路（更新）

```
18 角色蓝图 (blueprint.md)
    ↓
5 制度文件 (01-06) → 权限矩阵 + 验收清单 + 修复层级 + 阀门规则 + 知识库
    ↓
Harness 工程底座 → design-tokens.ts + DEXGridHarness.tsx + .cursorrules + agent_harness.py
    ↓
工具绑定 → 05-tool-status.md + pipeline-frontend.ps1 + visual-diff.mjs
    ↓
阀门系统 → P0(11角色+4系统) → P1(7角色) → P2(4角色) → Release
    ↓
频道输出 → channel-content-system.md (7模板 + 双语)
```

## 验证

```powershell
# 验证 ION Memory Tree 可用
$env:PYTHONIOENCODING="utf-8"
python D:\openclaw-data\workspace\scripts\ion-memory-tree-builder.py tree

# 验证超级记忆系统可用
python D:\openclaw-data\workspace\memory\super-memory-system\openhuman_bridge.py stats

# 验证前端团队制度完整性
Get-ChildItem D:\openclaw-data\workspace\memory\super-memory-system\projects\frontend-dev-team\ | Select-Object Name
```
