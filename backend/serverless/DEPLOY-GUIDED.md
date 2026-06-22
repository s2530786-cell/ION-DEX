# SAM `deploy --guided` 参数清单（testnet / prod）

在 **已配置 AWS 凭证** 且 **`sam build` 成功** 后，于 `backend` 目录执行：

```powershell
sam deploy --guided -t serverless/template.yaml
```

guided 向导会逐项询问；下表为 **推荐填法**，按环境分档。敏感值勿写入仓库，部署时在终端输入或使用 `sam deploy --parameter-overrides`。

---

## 1. 向导固定项（两档相同）

| 向导问题 | 建议值 | 说明 |
|----------|--------|------|
| Stack Name | testnet：`ion-dex-api-testnet`；prod：`ion-dex-api-prod` | CloudFormation 栈名 |
| AWS Region | `ap-southeast-1`（或团队标准 region） | 与 RDS/VPC 同区 |
| Confirm changes before deploy | `Y` | 首次建议开启 |
| Allow SAM CLI IAM role creation | `Y` | 创建 Lambda 执行角色 |
| Disable rollback | `N` | 失败时自动回滚 |
| Save arguments to samconfig.toml | `Y` | 后续 `sam deploy` 免重复输入 |
| SAM configuration file | `serverless/samconfig.toml` | 勿提交含 secrets 的版本 |

---

## 2. CloudFormation 参数 — testnet / staging

适用于 BSC Testnet + ION testnet API，可无 Postgres（`DbDriver=disabled`）快速冒烟。

| 参数 | 推荐值 | 运行时 env |
|------|--------|------------|
| **StageName** | `testnet` 或 `staging` | HTTP API stage |
| **IonDataMode** | `auto` 或 `test-mock` | `ION_DATA_MODE`；纯联调用 `test-mock` |
| **BscRpcUrl** | `https://data-seed-prebsc-1-s1.binance.org:8545/` | `BSC_RPC_URL` |
| **BscChainId** | `97` | `BSC_CHAIN_ID` |
| **IonApiBaseUrl** | `https://api.testnet.ice.io/http/v2/` | `ION_API_BASE_URL` |
| **IonHttpTimeoutMs** | `12000` | `ION_HTTP_TIMEOUT_MS` |
| **DbDriver** | `disabled`（默认）或 `postgres` | `ION_DB_DRIVER`；Lambda 上 **不要用 sqlite** |
| **PostgresUrl** | 留空（`DbDriver=disabled`）或 RDS 连接串 | `DATABASE_URL`；仅 `postgres` 时生效 |
| **CmcApiKey** | 留空或测试 Key | `CMC_API_KEY` |
| **BscIonTokenAddress** | 测试网部署后的 ION 合约地址 | `BSC_ION_TOKEN_ADDRESS` |
| **BscBurnContractAddress** | 测试网 burn 合约（若有） | `BSC_BURN_CONTRACT_ADDRESS` |
| **BscVaultLockAddress** | 测试网 vault 合约（若有） | `BSC_VAULT_LOCK_ADDRESS` |
| **BurnIndexerUrl** | 测试网 indexer URL（若有） | `BURN_INDEXER_URL` |

**testnet 一键 parameter_overrides 示例**（复制到 `sam deploy` 或 `samconfig.toml`）：

```text
StageName=testnet IonDataMode=auto BscRpcUrl=https://data-seed-prebsc-1-s1.binance.org:8545/ BscChainId=97 IonApiBaseUrl=https://api.testnet.ice.io/http/v2/ DbDriver=disabled
```

合约地址就绪后追加，例如：

```text
BscIonTokenAddress=0x... BscBurnContractAddress=0x... BscVaultLockAddress=0x...
```

---

## 3. CloudFormation 参数 — production

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| **StageName** | `prod` | 生产 stage |
| **IonDataMode** | `live` 或 `auto` | 生产建议 `live` |
| **BscRpcUrl** | 专用 BSC 节点 URL（勿长期依赖公共 seed） | 低延迟、限流可控 |
| **BscChainId** | `56` | BSC mainnet |
| **IonApiBaseUrl** | `https://api.mainnet.ice.io/http/v2/` | 官方 mainnet HTTP API |
| **IonHttpTimeoutMs** | `12000`–`20000` | 上游慢时可略增 |
| **DbDriver** | `postgres` | 生产持久化 |
| **PostgresUrl** | `postgresql://user:pass@host:5432/db?sslmode=require` | **NoEcho**；映射 `DATABASE_URL` |
| **CmcApiKey** | CoinMarketCap Pro Key | 行情 live 所需 |
| **BscIonTokenAddress** | 主网 ION ERC-20 | 见 `backend/.env.example` / 部署记录 |
| **BscBurnContractAddress** | 主网 burn 合约 | 部署后填入 |
| **BscVaultLockAddress** | 主网 vault 合约 | 部署后填入 |
| **BurnIndexerUrl** | 生产 burn indexer | 可选 |

**prod parameter_overrides 示例**（`PostgresUrl`、`CmcApiKey` 在 guided 中单独输入，勿写进 git）：

```text
StageName=prod IonDataMode=live BscRpcUrl=https://bsc-dataseed.binance.org/ BscChainId=56 IonApiBaseUrl=https://api.mainnet.ice.io/http/v2/ DbDriver=postgres
```

---

## 4. 部署后验收

1. 记录 Outputs：`ApiEndpoint`、`HealthCheckUrl`
2. 浏览器或 curl：`GET {HealthCheckUrl}` → 期望 200
3. 抽样：`GET {ApiEndpoint}/api/config/public`
4. CloudWatch Logs：函数名 `ion-dex-api-{StageName}`，查冷启动与 DB 错误
5. 仓库内全量验证（与 Lambda 无关）：`scripts\verify-full-save-log.cmd --no-pause`

---

## 5. Windows 构建注意

本机若无 `make`（Git Bash / WSL 未装），请使用容器构建：

```powershell
cd backend
npm run build
npm run sam:build:container
```

或安装 [Git for Windows](https://git-scm.com/download/win) 并确保 `C:\Program Files\Git\usr\bin` 在 PATH 中，再 `npm run sam:build`。

---

## 6. 与 Cursor / AWS 无关的错误

若 Cursor 报 `ERROR_BAD_USER_API_KEY` / `Unauthorized User API key`，属于 **Cursor 账户 API Key**，请在 Cursor Settings 重新登录；**不影响** `sam deploy` 与 AWS CLI。
