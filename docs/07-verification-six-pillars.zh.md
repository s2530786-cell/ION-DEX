# 六项验证清单

中文入口；权威状态以 `docs/verification-six-pillars.md` 为准。

## 当前已自动化

- 编码：`scripts\check-encoding.ps1`
- FunC：`compile-func.mjs` 22/22、`func-contract-test.mjs`、`func-security-audit.mjs`（1500）
- BSC：`forge test --match-contract SecurityAttackTest`（16/16）
- 双链一次：`node scripts\dual-chain-audit.mjs`
- 前端：`npm run build` + Playwright E2E
- 后端：verify + audit:high + stress
- 铁律全套：`scripts\iron-law-security.cmd`
- 100 绿：`scripts\verify-100.ps1`
- 计划任务：`scripts\register-windows-scheduled-tasks.ps1`

## 后续待补齐（见蓝图）

| 项 | 设计文档 |
|----|----------|
| UI 像素级验收 | 人工 + 截图 |
| TVM 级合约模糊测试 | `docs/12`、合约路线图 |
| k6 / 桥 chaos 压测 | `docs/16`、`docs/14` |
| 测试网部署与回滚 | `docs/10`、`docs/17` |
| 第三方审计 | `docs/17` M5 |

完整清单：`docs/verification-six-pillars.md`。
