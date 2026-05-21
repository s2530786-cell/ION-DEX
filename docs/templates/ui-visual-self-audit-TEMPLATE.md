# ION DEX UI 交付自检报告（模板）

> 复制本文件为 `docs/ui-deliverable-self-audit-YYYY-MM-DD.md`（或加 `<scope>` 后缀）。  
> 铁律见 `docs/11-ui-visual-self-audit-gate.md`。

---

## 元信息

| 字段 | 内容 |
|------|------|
| 日期 | YYYY-MM-DD |
| 分支 / PR | |
| 任务范围 | （例：Dashboard 玻璃层 / Trade K 线） |
| 执行人 | Agent / 开发者 |
| 参考图路径 | `docs/ui-audit-screenshots/ref-*.png` 或用户附件 |
| 当前实机 | URL + 端口 |
| 对照框架 | `docs/10-ui-design-route.md`、`.memory-bank/overall-design-framework.md` 等 |

---

# 第一部分：思考过程（工作记录）

## A1. 任务理解

- 用户原始诉求：
- 隐含成功标准：
- 本次 in-scope / out-of-scope：

## A2. 信息收集

| 来源 | 路径 / 工具 | 要点摘要 |
|------|-------------|----------|
| 工程铁律 | `docs/00-engineering-standards.md` | |
| UI 路线 | `docs/10-ui-design-route.md` | |
| 总体框架 | `.memory-bank/overall-design-framework.md` | |
| 架构审计 | `.memory-bank/architecture-audit.md` | |
| 数据记忆 | `.memory-bank/live-data-reference.md` | |
| 参考截图 | | |
| 当前代码 | `frontend/src/...` | |
| 实机/录屏 | | |
| 工程验证输出 | `verify-full` / `npm run verify` | |

## A3. 对照与推理步骤

1. （例：先比参考图全局背景与霓虹 rim，再逐页比模块）
2. 
3. 

## A4. 关键判断与优先级理由

- P0 项及原因：
- P1 项及原因：
- P2 项及原因：

## A5. 纠偏与工具局限

| 现象 | 处理 |
|------|------|
| （例：Playwright 浏览器未安装） | |
| （例：子 agent 称无路由） | |

## A6. 工程验证 vs 视觉门禁（必须分栏）

- **工程验证**：通过 / 失败 — 证据：
- **视觉门禁**：通过 / 失败 — 理由：
- **能否宣称「UI 完成」**：是 / 否 —

---

# 第二部分：自检结论（审计交付）

## B1. 结论摘要

（一句话）

## B2. 总体差距矩阵

| 类别 | 成品/框架要求 | 当前实现 | 差距等级 |
|------|---------------|----------|----------|
| 银河/极光背景 | | | |
| 4D 液态玻璃 | | | |
| 厚霓虹边框 | | | |
| 3D 图标/卡片 | | | |
| K 线/行情图 | | | |
| 数据 provenance | | | |
| 组件语言统一 | | | |
| 视觉回归基线 | | | |

## B3. 分模块差距

### B3.1 AppShell

- 现状：
- 差距：
- 优先级：

### B3.2 （页面名）

- 已改进：
- 仍差距：
- 优先级：

（按需复制小节）

## B4. 数据与合规红线

- [ ] 无 CSS 假 K 线冒充生产图（或已标注 seed）
- [ ] 无硬编码盘口/深度冒充 live
- [ ] local-seed 均有规范 provenance UI
- [ ] 无用户可见 unfinished copy

## B5. 工程验证 vs 设计验证

| 检查项 | 状态 |
|--------|------|
| encoding | |
| frontend verify | |
| audit:high | |
| 375/768/1440 证据 | |
| `tests/visual/baseline/` | |

## B6. 优先级整改路线

### P0

1. 

### P1

1. 

### P2

1. 

## B7. 附件索引

| 文件 | 说明 |
|------|------|
| | |

## B8. 签收 checklist（下次改动前）

- [ ] 
- [ ] 

---

*模板版本：2026-05-21 · 维护：`docs/11-ui-visual-self-audit-gate.md`*
