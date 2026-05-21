# ION 官方质押参考（ION DEX 必读）

> **铁律**：用户面向的「质押 ION → LION」以 `ice-blockchain/liquid-staking-contract` 与 [ice.io/staking](https://ice.io/staking) 为准。本仓库 `contracts/ion/staking-pool.fc` 仅为 DEX 手续费质押池草稿，不得对外宣称为官方网络质押实现。

## 三条质押线（勿混用）

| 类型 | 官方仓库 / 合约 | 面向用户 | 奖励 / 凭证 |
|------|-----------------|----------|-------------|
| **流动性质押（零售）** | [liquid-staking-contract](https://github.com/ice-blockchain/liquid-staking-contract) — Pool、Controller、池 Jetton | 持币人质押 ION 支持验证 | 收到 **LION**（Liquid ION）；每轮验证后奖励复利 |
| **验证人选举** | [ion](https://github.com/ice-blockchain/ion) → `crypto/smartcont/elector-code.fc` | 验证人 / 系统层 | 非 DEX Stake 页零售流程 |
| **大额提名池** | [nominator-pool](https://github.com/ice-blockchain/nominator-pool) | TON 风格大额提名 | 与零售 LION 不同 |

**ION DEX 草稿（非官方用户质押）**

| 组件 | 路径 | 说明 |
|------|------|------|
| FunC 质押池草稿 | `contracts/ion/staking-pool.fc` | `stake_deposit` / `stake_withdraw` / `stake_claim` / `fund_rewards` |
| BSC 费用路由 | `FeeReceiver` 等 | 手续费份额进入 `stakingRewards`，与 LION 池无关 |

## 官方流动性质押逻辑（摘要）

依据 `liquid-staking-contract` 中 `PoolConstants.ts` 与 `contracts/pool.func`：

1. 用户向 **Pool** 发送 `pool::deposit`（opcode `0x47d54391`），扣除存款费后计入池余额。
2. 池通过 **Controller** 向 **elector** 发起 `new_stake`（`0x4e73744b`）等选举质押消息。
3. 用户侧收到 **池 Jetton（LION）** 作为流动凭证；赎回使用 `withdraw` / `withdrawal` 等路径，在轮次边界结算。
4. 解押：**recover_stake**（elector `0x47657424`）等 — 与「下一轮验证释放」产品说明一致（约 **20 小时** 量级，以主网轮次为准）。

### 常用 opcode（集成/索引器用）

| 名称 | Hex |
|------|-----|
| `pool.deposit` | `0x47d54391` |
| `pool.withdraw` | `0x319B0CDC` |
| `pool.withdrawal` | `0x0a77535c` |
| `elector.new_stake` | `0x4e73744b` |
| `elector.recover_stake` | `0x47657424` |
| `controller.recover_stake` | `0xeb373a05` |

完整常量以官方仓库 `PoolConstants.ts` 为准。

## 产品事实（公开文档）

- 质押入口：[ice.io/staking](https://ice.io/staking) — 桌面端 **ION Chrome Wallet**。
- 最小质押：**1 ION**（公开说明）。
- 解押：无长期锁仓叙事；**下一轮验证**释放（约 20h）。
- APY/APR：**随全网质押量动态变化** — UI 不得写死「25.5%」等未接链上的固定 DEX APR 冒充官方。

## ION DEX 实现约定

- 前端共享语义：`frontend/src/lib/officialStakingSemantics.ts`
- Stake 页须区分：**官方 LION 质押**（指引官方钱包/池）与 **DEX 草稿质押**（表单 + mock/API）。
- 后端 `staking.ts`：`officialStakedIon` / `apr.officialPct` 在接入池 `get_pool_data` 或索引器前保持 **mock**，并在 `provenance.note` 标明官方仓库。
- 池合约地址：从官方部署 / `ion-address-book` 读取，**禁止猜测**。

## 相关文档

- `docs/ion-official-canonical-addresses.md` — BSC ION / burn
- `frontend/src/lib/officialBridgeSemantics.ts` — 跨链桥
- `.memory-bank/ion-dex-nuke/official-source-index.md` — 官方仓库索引
