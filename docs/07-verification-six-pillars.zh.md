# 六项验证清单

本文件是六项验证流程的中文入口。

## 当前已自动化

- 编码检查：`scripts\check-encoding.ps1`
- 前端构建：`npm run build`
- 前端 E2E smoke：`playwright test`
- 依赖高危审计：`npm run audit:high`

## 后续待补齐

- UI 像素级人工验收和截图记录。
- 智能合约单元、集成、模糊、Gas 与安全测试。
- 后端 API、数据库和压力测试。
- 测试网部署与回滚演练。

完整清单见 `docs/verification-six-pillars.md`。
