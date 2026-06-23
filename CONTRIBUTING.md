# Contributing to ION DEX

感谢你对 ION DEX 的关注。本项目采用 **GPL v3.0** 协议，所有贡献者必须遵守以下规则。

## 贡献流程

1. **Fork 本仓库** 到你的 GitHub 账号
2. **创建功能分支**：`git checkout -b feature/your-feature`
3. **提交代码**：确保通过 CI 测试
4. **发起 Pull Request** 到 `main` 分支
5. **等待审核**：只有核心团队（CODEOWNERS）有合并权限

## 代码规范

- **Solidity**: 0.8.x，遵循 Solidity 官方风格指南
- **TypeScript**: Prettier 默认配置
- **智能合约**: 必须通过 1000 次安全测试（见 SECURITY.md）
- **不允许 mock/placeholder 代码**：所有功能必须对接真实链上数据
- **不允许假数据/硬编码地址**：所有合约调用必须有真实 ABI + 有效地址

## 提交规范

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

类型（type）：
- `feat` — 新功能
- `fix` — Bug 修复
- `audit` — 安全审计/修复
- `refactor` — 重构
- `docs` — 文档
- `test` — 测试
- `chore` — 构建/工具

## 安全要求

所有智能合约代码提交前必须：
1. 通过 Forge 编译
2. 通过单元测试
3. 通过 10 类攻击测试（每类 100 次）：重入、闪电贷、三明治、预言机操控、权限绕过、整数溢出、拒绝服务、假币攻击、时间戳操控、抗量子攻击
4. **1000 次测试全绿**才能合并

## 分支保护

- `main` 分支禁止直接 Push
- 所有修改必须通过 Pull Request
- PR 需至少 1 名 CODEOWNER 审核通过

## 行为准则

- 尊重所有贡献者
- 不接受恶意代码或后门
- 不引入未授权的第三方依赖
