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

## Live API 配置从哪里来（2026-05-20 调研）

公开 GitHub **不会**提交生产 `ION_ORIGIN` / `appId` 明文；官方 ION App 从私有仓库拉取。

| 配置项 | 官方来源 | 说明 |
|--------|----------|------|
| **API Base URL** | `ION_ORIGIN` | 在 `ion-framework` 里 **不是**仅 CORS origin，而是 `ion_identity_client` 的 Dio **`baseUrl`**（`network_service_locator.dart` → `BaseOptions(baseUrl: config.origin)`） |
| **App / Client ID** | `ION_ANDROID_APP_ID` / `ION_IOS_APP_ID` | 写入请求头 **`X-Client-ID`**（`RequestHeaders.ionIdentityClientId`）；Android/iOS 各一套 |
| **`orgId`** | SDK README 示例仍有 | **当前主 App 的 `IONIdentityConfig` 仅要求 `appId` + `origin`**（`lib/app/services/ion_identity/ion_identity_provider.r.dart`）；登录后 API 返回的 `User` JSON 仍含 `orgId` 字段 |
| **环境文件** | [ice-blockchain/flutter-app-secrets](https://github.com/ice-blockchain/flutter-app-secrets) | **私有仓库**；与 `ion-framework` 同级目录，按 `production` / `staging` / `testnet` 复制到 `.app.env`，再跑 `./scripts/configure_env.sh <env>` |
| **本地开发** | `heimdall/application.yaml` | `cmd/heimdall-identity-io` → `host: localhost:8001`，HTTPS 自签证书在 `.testdata/` |

### 与 `api.mainnet.ice.io` 的关系

- 本仓已用的 **`https://api.mainnet.ice.io/http/v2/`** 是 **ION 节点 HTTP API**（`ion-http-api`），用于链上查询（如 burn `getAddressBalance`）。
- **Heimdall Identity API 是另一套服务**；生产 URL 在 `flutter-app-secrets` 的 `ION_ORIGIN` 中，**不能**在未确认前假设为 `api.mainnet.ice.io` 的子路径（公开探测无稳定文档）。

### SDK 调用的路径前缀（相对 `ION_ORIGIN`）

与 Heimdall Swagger 一致，例如：

- `POST /auth/registration/delegated`、`POST /auth/registration/enduser`
- `GET /auth/users/{userIdOrMasterKey}`
- `GET /v1/users/{userIdOrMasterKey}/verified-badge`（需 **`Authorization: Bearer`** + **`X-Client-ID`**）

### `verified-badge` 鉴权

`GetVerifiedBadge` 会先 `VerifyToken(Authorization)`，**不能**用匿名公开读；DEX 若展示 verified 状态，需要用户登录态 token，或由官方发放的 **服务端 API key**（`application.yaml` 里 `api-key` 列表，属部署密钥，不在公开仓库）。

### ION DEX 接入步骤（无 secrets 时）

1. 向团队申请 **`flutter-app-secrets` 只读** 或单独发放：`ION_ORIGIN`、`ION_ANDROID_APP_ID`（若 DEX 走 Web 可再要 Web 用 client id，若存在）。
2. 在 `backend/.env` 配置（见 `backend/.env.example` 注释占位）：`ION_IDENTITY_BASE_URL`、`ION_IDENTITY_CLIENT_ID`；**勿提交 `.env`**。
3. 先用 **staging / testnet** 环境验证 `verified-badge` 与 `204/200` 语义，再切 production。
4. 禁止从 APK 反编译或猜测生产 URL 写入仓库。

## ION DEX 当前状态

| 项 | 状态 |
|----|------|
| Heimdall 生产 base URL | **Pending** — 在 `flutter-app-secrets` → `ION_ORIGIN`（私有，未公开） |
| Client ID (`X-Client-ID`) | **Pending** — `ION_ANDROID_APP_ID` / `ION_IOS_APP_ID`（同上） |
| `orgId` | **非 SDK 初始化必填**；以 API 响应为准 |
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
