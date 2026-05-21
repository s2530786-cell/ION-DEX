# UI 视觉自检门禁（铁律）

> **用户铁律（2026-05-21）**：每次 UI / 前端相关工作**做完之后**，必须产出一份「对照设计参考图 + 总体框架」的自我审查报告。  
> **工程 verify 绿灯不能替代本门禁。** 未提交报告 = UI 任务未完成 = 不得宣称交付。

---

## 1. 适用范围

| 触发条件 | 必须产出报告 |
|----------|----------------|
| 修改任意 `frontend/src/**` 页面、布局、样式、玻璃组件 | 是 |
| 修改 `global.css`、Tailwind 主题、背景动效 | 是 |
| 仅改后端/API 且不影响 UI 呈现 | 否（但若改数据影响 UI 展示，仍建议附简短数据对照） |
| 用户明确要求「写自检报告 / 对比成品图」 | 是（即使改动很小） |

---

## 2. 必读对照物（报告前必须检索）

按顺序读取，并在报告中引用具体章节或文件路径：

1. `docs/00-engineering-standards.md` — §1 前端 UI 验收
2. `docs/10-ui-design-route.md` — 锁定视觉路线与页面升级路线
3. `.memory-bank/overall-design-framework.md` — 总体产品框架
4. `.memory-bank/architecture-audit.md` — UI 合规审计记忆
5. `.memory-bank/live-data-reference.md` — 数据来源与 provenance
6. `docs/05-product-prd.md` + `docs/06-page-flow-and-user-journeys.md` — 模块是否覆盖
7. **用户或项目提供的成品参考图**（`docs/ui-audit-screenshots/` 或当次附件路径）

---

## 3. 报告必备结构

复制模板：`docs/templates/ui-visual-self-audit-TEMPLATE.md`

每份报告文件名建议：

```text
docs/ui-deliverable-self-audit-YYYY-MM-DD.md
```

或当次任务专题名：

```text
docs/ui-deliverable-self-audit-YYYY-MM-DD-<scope>.md
```

### 3.1 第一部分：思考过程（Agent / 开发者工作记录）

必须写清，不得省略：

- **任务理解**：用户要什么、成功标准是什么
- **信息来源**：读了哪些 doc / memory / 代码 / 截图 / 录屏
- **对照方法**：如何比参考图、如何审代码、如何验实机
- **关键判断**：哪些项判为 P0/P1/P2，为什么
- **纠偏记录**：曾误判或工具失败时如何修正（避免下次重复）
- **与工程验证的关系**：verify-full / Playwright 结果 vs 视觉门禁结论（必须区分）

### 3.2 第二部分：自检结论（可交付审计表）

必须包含：

1. **结论摘要**（一句话：视觉门禁通过 / 未通过）
2. **总体差距矩阵**（参考 vs 当前 vs 等级）
3. **分模块差距**（至少覆盖本次改动页面 + AppShell + ProfileHub 若相关）
4. **数据与合规红线**（空数据、伪 K 线、local-seed、无 provenance）
5. **工程验证 vs 设计验证** 对照表
6. **优先级整改路线**（P0 / P1 / P2）
7. **附件索引**（参考图、当前截图、录屏路径）
8. **签收 checklist**（下次 PR 必须勾掉的项）

---

## 4. 证据要求

| 证据类型 | 最低要求 |
|----------|----------|
| 参考设计图 | 存档至 `docs/ui-audit-screenshots/ref-*` 或 PR 附件，报告中写清文件名 |
| 当前实现 | 本地截图或录屏路径；无法截图时须代码引用 + `data-testid` 说明 |
| 断点 | 计划或实际覆盖 375 / 768 / 1440（未测须写明原因） |
| 编码 | 报告落盘后为 UTF-8 without BOM |

---

## 5. 与自动化流水线关系

```text
dev-preflight → 实现 → verify-full（工程）→ UI 视觉自检报告（设计）→ 更新 SESSION_STATE + 99-current-progress → 提交/PR
```

- `scripts/verify-full.*` **不会**代替本报告。
- 未来可在 CI 增加「报告文件是否存在」检查；当前以 Agent 铁律 + `AGENTS.md` 强制。

---

## 6. 判定规则（硬性）

| 情况 | 判定 |
|------|------|
| Playwright 全绿 + 视觉未达参考 / 框架 | **未通过** UI 门禁 |
| 主图用 CSS 柱冒充 K 线且无 seed 标注 | **未通过** |
| 硬编码盘口/深度/TVL 冒充生产数据 | **未通过** |
| 用户可见 `Design` / 裸 `local-seed` 标签 | **未通过**（须规范 provenance 组件） |
| 仅改文案颜色且全面对照后无差距 | 可通过（须在报告中逐项说明「无变更项」） |

---

## 7. 示例交付物

- 门禁说明：本文 `docs/11-ui-visual-self-audit-gate.md`
- 模板：`docs/templates/ui-visual-self-audit-TEMPLATE.md`
- 实例（含思考过程 + 结论）：`docs/ui-deliverable-self-audit-2026-05-21.md`
- 精简结论存档：`docs/ui-visual-self-audit-2026-05-21.md`

---

## 8. Agent 执行清单（每次 UI 任务结束勾选）

- [ ] 已读 §2 全部对照物
- [ ] 已保存或索引参考图与当前截图/录屏
- [ ] 已写 `docs/ui-deliverable-self-audit-*.md`（含思考过程 + 结论）
- [ ] 已更新 `docs/99-current-progress.md`
- [ ] 已更新 `SESSION_STATE.md`
- [ ] 已向用户说明：工程 verify 与视觉门禁是否分别通过
