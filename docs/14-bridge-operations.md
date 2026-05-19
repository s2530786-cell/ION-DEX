# 14 — 跨链桥运营

> 单页设计 | 关联：`.memory-bank/architecture-audit.md`（Bridge Architecture）、ION `multisig-code.fc` / `votes-collector.fc`

## 目标

- 实现 **阈值多签** 跨链（非单 relayer 信任），ION ↔ BSC 资产映射可审计。
- Relayer **高可用**、幂等、可观测；两端账本定期对账。
- 定义 LP 启动、事故升级、暂停与恢复流程。

## 边界

| 范围内 | 范围外 |
|--------|--------|
| BSCBridge / BridgeVerifier 设计、relayer 服务 | 验证者实体 KYC |
| PancakeSwap 首池流程（ION/USDT） | 做市商商业合同 |
| 运营 runbook 与对账作业 | 各国跨境汇款牌照 |

## 验证者集合治理

| 动作 | 要求 |
|------|------|
| 新增验证者 | 现有多签提案 + timelock |
| 移除 / 降权 | 同上 + 活跃桥暂停 |
| 阈值变更 | 链上事件 + Transparency 公告 |
| 罚没（恶意签名） | 合约层拒绝 + 链下审计；具体 slash 参数主网前法律评审 |

对齐 ION 主网 `votes-collector` / `multisig-code` 模式，BSC 侧镜像设计。

### 协议费与 `docs/02` 对齐

| 费项 | 收取点 | 分配 |
|------|--------|------|
| Bridge protocol fee | BSC/ION 桥合约扣减 | 35% burn / 25% team / 20% staking / 15% treasury / 5% ops（与 `02` 表一致） |
| BSC 侧归集 | `BSCFeeVault.sol`（待建） | 定期 sweep → FeeDistributor |
| ION 侧 | FeeDistributor.fc（路线图） | 同上 |

## 依赖

- P0-5 合约 + `relayer/` 实现
- `docs/10` 桥验证者地址、BSC ION 代币地址
- `docs/12` `bridge_transfers` 表
- `docs/16` 告警与 on-call
- OpenZeppelin `BridgeERC20` / ION 官方桥模式

## 组件（目标态）

```text
ION: multisig-code + votes-collector (参考已有主网模式)
BSC: BSCBridge.sol + BridgeVerifier.sol (新建)
Relayer: 双链监听 → 收集签名 → 提交执行（多实例，leader 选举）
LP: Pancake Factory createPair + addLiquidity
UI: Bridge 页（金额、路由、状态、explorer 链接）
```

### Relayer HA（最低要求）

| 机制 | 说明 |
|------|------|
| 多实例 | ≥2，共享 DB 游标 |
| 幂等键 | `chain + tx_hash + event_index` |
| Leader 锁 | Redis `SET NX` + TTL |
| 重试 | 指数退避；死信队列人工复核 |
| 暂停开关 | admin + 合约 `paused` 双控 |

### 对账（对齐工程标准 5.3）

- 每 **10 分钟**：ION 锁定总量 vs BSC 铸造总量（按 bridge_id）。
- 偏差 > ε → 自动 **暂停桥** + P1 告警。
- 日终报告写入 `audit_logs` + Transparency 页。

### LP 启动流程（摘要）

1. 部署 BSC 桥合约 + relayer testnet 冒烟。
2. 小额跨链测试（< 配置上限）。
3. `createPair(ION, USDT)` + 初始流动性（比例由 Treasury 多签批准）。
4. 监控价格冲击与池深度 24h。

### 事故流程（L1–L3）

| 级别 | 触发 | 动作 |
|------|------|------|
| L1 | 单笔延迟 > 30min | 状态页更新；relayer 自愈 |
| L2 | 对账偏差 | 暂停入金；保留出金审查 |
| L3 | 疑似双花/密钥泄露 | 全局 pause；多签轮换；事后报告 |

## 退出标准

- [ ] `contracts/bsc/src/BridgeVerifier.sol`（或等价）+ SecurityAttackTest 桥类用例绿。
- [ ] `relayer/` 可 docker 运行；testnet 完成 10 笔双向小额。
- [ ] `bridge_transfers` 与链上事件 100% 对账通过 24h。
- [ ] 前端 Bridge：提交 → pending → completed/failed 全状态。
- [ ] Runbook：`docs/14` 附录或 `docs/runbooks/bridge-incident.md` 含联系人模板。
- [ ] 主网前：外部审计含桥章节 + 多签地址公开。
