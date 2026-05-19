# 10 — 配置与环境

> 单页设计 | 关联：`docs/01-official-addresses-and-assumptions.md`、`backend/src/db/`、`docs/03-technical-architecture.md`

## 目标

- 所有 **Pending** 官方地址与 RPC 通过**可配置注册表**注入，禁止写死在生产构建中。
- 明确 `local` / `testnet` / `staging` / `production` 四套环境的行为差异与密钥来源。
- 为前端、后端、relayer、indexer 提供**同一套配置 schema**（链 ID、合约地址版本、特性开关）。

## 边界

| 范围内 | 范围外 |
|--------|--------|
| 环境变量命名、`config/public` 与 admin 配置结构 | 具体云厂商账号开通 |
| 地址簿版本号、特性开关默认值 | 法务/合规政策正文 |
| `.env.example` 模板（无真实密钥） | 用户私钥托管 |

## 依赖

- `docs/01-official-addresses-and-assumptions.md`（Pending 清单权威来源）
- `ice-blockchain/ion-address-book`（确认后导入）
- P0-4 后端 `config` 服务从 mock 迁到 DB/环境

## 配置分层（建议实现）

```text
Layer 1  ENV (.env.*)           — 密钥、RPC URL、CMC key（不入库）
Layer 2  config-registry.json   — 链 ID、合约地址、版本、特性开关（可 Git，无密钥）
Layer 3  admin API / DB         — 运行时覆盖、紧急暂停、公告
Layer 4  on-chain governance  — 费率上限、桥验证者集合（主网后）
```

### 环境矩阵

| 键 | local | testnet | staging | production |
|----|-------|---------|---------|------------|
| `ION_CHAIN_RPC` | 本地/公共测试 | 官方测试网 | 预发节点 | 官方主网 |
| `BSC_RPC` | Anvil/公共 | BSC testnet | 专用节点 | 专用节点 |
| `DATABASE_URL` | SQLite 文件 | Postgres | Postgres HA | Postgres HA |
| `REDIS_URL` | 可选跳过 | 单实例 | 集群 | 集群 |
| `FEATURE_BRIDGE` | true | true | true | 治理开关 |
| `FEATURE_REAL_ORACLE` | false | partial | true | true |

### Pending 登记规则

- 每项 Pending 在 registry 中标记 `status: pending|confirmed`，`confirmed` 必须附 `source`（官方 commit / 地址簿版本）。
- 前端构建：`VITE_CONFIG_REGISTRY_URL` 或打包时注入 JSON；**禁止**把未确认地址打进 `production` bundle。

## 退出标准

- [ ] 存在 `config/registry.schema.json`（或等价 TypeScript 类型）且前后端共用。
- [ ] 提供 `.env.example` + `docs/01` 中每项 Pending 在 registry 有对应键。
- [ ] `GET /api/config/public` 返回 `provenance`（非 mock）且特性开关可区分环境。
- [ ] CI 在 `production` profile 构建时，若有 `pending` 关键地址则 **fail**（burn、BSC ION、主网 RPC）。
- [ ] 密钥仅来自环境/Secret Manager，仓库扫描 0 密钥泄露。
