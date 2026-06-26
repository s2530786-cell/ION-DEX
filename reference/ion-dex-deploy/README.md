# ION DEX 部署工作存档（提取自 dex-core-v2 子仓库）

> 来源：ice-blockchain-repos/dex-core-v2（上游 https://github.com/ice-blockchain/dex-core-v2，记录 commit af0a955）。
> 这些是我们对官方 dex-core-v2 的定制改动 + 自写部署资产。因 ice-blockchain-repos/ 整目录已 gitignore，
> 在此存档到主仓库，避免随子仓库清理丢失。

## 文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| MAINNET_DEPLOY_STEP2.md | 新增 | ION 主网部署手册第二步（pTON+Router，护本金红线）|
| scripts/deployPtonEmbedded.ts | 新增 | 内嵌版 pTON minter 主网部署脚本（含 ION explorer 链接修正）|
| tests/PtonDexIntegration.spec.ts | 新增 | pTON×DEX 端到端集成测试（沙箱验证通过的字节码）|
| build/deploy.config.mainnet.example.json | 新增 | 主网部署配置模板 |
| blueprint.config.ts | 改动 | 修复 ION 主网 v2 jsonRPC 入口 307 重定向 bug |
| tests/ConstProduct.spec.ts | 改动 | 新增 ION/LION 主网预演测试（建池+真实 swap，零本金沙箱）|
| dex-core-v2-modifications.patch | diff | 上面两个改动文件相对 af0a955 的完整 patch |

## 如何用回 dex-core-v2

1. 重新 clone：git clone https://github.com/ice-blockchain/dex-core-v2，checkout af0a955
2. 新增文件直接复制回对应路径
3. 改动文件用 patch 应用：git apply dex-core-v2-modifications.patch

_提取日期：2026-06-26。脱离了子仓库依赖（@ton/blueprint 等），单独无法直接运行，仅作存档。_
