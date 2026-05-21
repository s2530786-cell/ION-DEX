# ION 官方身份（ION Identity / ION ID）参考

> **铁律**：ION Identity 的官方实现是 **`ice-blockchain/heimdall`** + **`ice-blockchain/ion-framework`** 的 `ion_identity_client`。本仓 `kycPass` / `KYC Pass L2` 等为 **DEX UI mock**，不是 Heimdall 源码里的类型。禁止把营销文案当作官方 API 字段。

## 官方定义是什么

**ION Identity**（产品名，服务域 **identity.io**）在代码里是：

1. **后端服务 [heimdall](https://github.com/ice-blockchain/heimdall)**  
   README：*The service behind ION Identity, responsible for account management and acting as the first layer of interaction between users and the platform.*

2. **对外 HTTP 入口 `cmd/heimdall-identity-io`**  
   Swagger 描述为 ION Identity 的 REST API（用户、钱包视图、社交资料、2FA、verified badge 等）。

3. **客户端 SDK [ion-framework/packages/ion_identity_client](https://github.com/ice-blockchain/ion-framework/tree/master/packages/ion_identity_client)**  
   Dart 客户端：`appId` + `orgId` + `origin` 配置；WebAuthn 风格注册/登录；`User { id, username, orgId }`。

**没有**在 `heimdall` 仓库中发现名为 `KYC`、`kycPass`、`ionIdStatus` 的独立类型或表字段。官方可机读的「已验证」状态是 PostgreSQL 用户表上的 **`verified` boolean**，对外通过 **`GET /v1/users/{userIdOrMasterKey}/verified-badge`** 与 Nostr **BadgeDefinition / BadgeAward** 事件表达。

## 与 `.ion` DNS 的区分

| 维度 | ION Identity (Heimdall) | ION DNS (ion 节点 FunC) |
|------|-------------------------|-------------------------|
| 仓库 | `ice-blockchain/heimdall` | `ice-blockchain/ion` → `dns-auto-code.fc` / `dns-manual-code.fc` |
| 标识 | `users.id`、`master_pubkey`、`identity_key_name`、社交 `username` | `.ion` 域名、解析记录 |
| 验证展示 | `verified` + Nostr verified badge | 链上解析 / 索引器，非 Heimdall `verified` |

DEX 不得把「域名已解析」等同于「ION Identity verified」。

## 官方用户模型（Heimdall `users` 表）

来源：`accounts/DDL.sql`、`accounts/users.go` 查询字段。

| 字段 | 含义 |
|------|------|
| `id` | 平台内部用户 ID（API 称 `userId`） |
| `identity_key_name` | 身份密钥名，**UNIQUE**，注册/登录链路使用 |
| `master_pubkey` | 主公钥（Nostr/ION Connect 体系），**UNIQUE** |
| `verified` | **官方「已验证」布尔值**，默认 `false` |
| `email` / `phone_number` | 可选联系渠道（2FA 等） |
| `clients` | 已注册客户端信息 |
| `ion_connect_relays` | 分配的 ION Connect relay 列表 |

查询用户时支持 **`id` 或 `master_pubkey`** 作为查找键（`getUserByID`）。

## 官方「Verified」语义（不是 KYC Pass）

1. **入库**：运营/SQL 函数 `add_verified(...)` 将用户名加入 `verified_users_sync_queue`（`accounts/DDL.sql`）。
2. **异步处理**：`verifiedUsersSync.ProcessNextVerifiedUsersQueue` 将 `users.verified` 置为 `true`，并同步 token-analytics（`accounts/verified.go`）。
3. **对外证明**：生成并发布 Nostr 事件：
   - `KindBadgeDefinition`，`d` tag = `"verified"`
   - `KindBadgeAward`，指向 definition + 用户 `master_pubkey`
   - 名称：`Verified by ION Identity (identity.io)`（`accounts/contract.go` 常量）

4. **HTTP API**（`cmd/heimdall-identity-io/users.go`）：
   - `GET /v1/users/{userIdOrMasterKey}/verified-badge`
   - 已验证 → `200` + badge 事件 JSON
   - 未验证 → **`204 No Content`**（不是错误）

5. **校验实现**（`accounts/users.go` → `IsUserVerified`）：读 `users.verified`；为 true 时动态生成 badge 事件（按 `master_pubkey` 查询）。

## 社交资料（与 ID 并列，非链上域名）

`accounts/social_profiles.go` + `GET/PUT …/profiles/social`：

- `username`（小写唯一）、`display_name`、`avatar`、`bio`、推荐人 `referral`
- 与 **ION DNS `.ion` 钱包记录** 是不同数据源；用户名可用性：`/v1/users/verify-username-availability`

## 客户端 SDK 用户对象

`packages/ion_identity_client/lib/src/auth/dtos/user.dart`：

```dart
class User {
  final String id;       // 平台用户 ID
  final String username; // 登录名 / 身份用户名
  final String orgId;    // 组织 ID（配置 orgId）
}
```

注册/登录使用 **passkey/WebAuthn 风格** credential challenge（见 `auth/` DTO），钱包由 Heimdall + DFNS 集成管理（`accounts/internal/dfns`）。

配置示例（README）：

- `IONIdentityConfig(appId: 'ap-…', orgId: 'or-…', origin: 'https://…')`

## ION DEX 当前状态

| 项 | 状态 |
|----|------|
| Heimdall 生产 base URL | **Pending**（须运维/官方文档确认，禁止硬编码猜测） |
| `appId` / `orgId` / `origin` | **Pending**（来自 ION Identity 控制台） |
| 本仓 `profile.ts` `kycPass` | **local-seed mock** |
| 本仓 `ionIdStatus: verified` | **mock**，未调用 `verified-badge` API |

集成时应：

- 用 **`verified-badge`** + `master_pubkey`（或已解析的 `userId`）判断展示「ION Identity verified」
- **不存储**原始 KYC 文档；仅缓存 attestation / badge 事件哈希或布尔状态
- 产品若保留「KYC Pass」文案，须单独标注 **非 Heimdall 官方字段**，待第三方或未来 API 确认

## 代码引用（本仓）

- 语义常量：`frontend/src/lib/officialIdentitySemantics.ts`
- 索引：`.memory-bank/ion-dex-nuke/official-source-index.md`
- 假设表：`docs/01-official-addresses-and-assumptions.md`

## 相关官方仓库

- https://github.com/ice-blockchain/heimdall
- https://github.com/ice-blockchain/ion-framework
- https://github.com/ice-blockchain/ion-gateway（钱包注入，非 Identity 账户 API）
