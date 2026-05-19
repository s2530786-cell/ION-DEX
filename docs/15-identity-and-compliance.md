# 15 — 身份与合规

> 单页设计 | 关联：`docs/05-product-prd.md`（Identity/Domain）、`docs/00-project-overview.md`（隐私原则）

## 目标

- 集成 **ION ID / KYC Pass**（Heimdall）为**可验证凭证**，DEX **不存储**原始 KYC 数据。
- ION DNS **域名交易**：解析即时校验、托管与所有权证明后再签名。
- 为高风险功能（大额桥、域名过户）预留策略钩子（可选地域/限额）。

## 边界

| 范围内 | 范围外 |
|--------|--------|
| 凭证验证 API、UI 徽章、策略引擎接口 | 法律咨询意见书 |
| 域名解析与转移 UX 状态机 | `dns.ice.io` 未授权爬虫 |
| 审计日志（谁、何时、验证结果哈希） | 完整 AML 名单库自建 |

## 依赖

- `ice-blockchain/heimdall` API（Pending，见 `docs/01`）
- ION DNS 官方 resolver（Pending）
- `docs/10` Identity 端点配置
- `identity-service` / `domain-service` 后端模块

## 身份验证流

```text
User → ION Wallet / Heimdall OAuth
  → DEX backend: verify attestation (signature + expiry)
  → Store: user_id, credential_hash, level, expires_at  (NO raw KYC)
  → Frontend: badge + feature gating
```

### 存储允许字段

| 字段 | 允许 |
|------|------|
| `credential_id` / `level` / `expires_at` | ✅ |
| `attestation_signature` | ✅（或仅链上验证） |
| 姓名、证件号、证件图 | ❌ |

### 域名交易规则（摘要）

1. **解析**：转账前 `resolve(name)` → 必须与 UI 显示收款地址一致。
2. **状态**：`available | registered | for_sale | in_transfer | locked`。
3. **托管**：可选 escrow 合约；过期自动释放。
4. **取消**：未上链前可取消；上链后仅链上规则。

### 功能门控（示例）

| 功能 | 无 ID | KYC Pass L1 | L2 |
|------|-------|-------------|-----|
| Swap 小额 | ✅ | ✅ | ✅ |
| Bridge > 阈值 | ❌ | 审核 | ✅ |
| 域名购买 | ❌ | ✅ | ✅ |

### 制裁 / 地域 / 冻结（需 Master 产品决策）

| 能力 | 默认 | 说明 |
|------|------|------|
| 地域限制 | 关闭直至法务确认 | GeoIP + 配置名单 |
| 制裁地址筛查 | 主网前评估 | 链上 denylist 合约或链下 API |
| 用户举报入口 | Transparency / Admin | 工单可后置 |
| 紧急冻结单用户 | `risk_admin` | 与 `docs/21` pause 区分 |

未决策前：**不在合约层硬编码国别**，仅预留 `policy_engine` 接口。

## 退出标准

- [ ] `identity-service` 接口：`POST /verify` 返回 level + expiry（mock → Heimdall）。
- [ ] DB 无 PII 列；代码扫描无 `passport`/`ssn` 类字段入库。
- [ ] Domain 页：解析失败/block 时禁止确认按钮。
- [ ] 隐私说明页链到「不存储原始 KYC」声明（Transparency）。
- [ ] 安全评审：OWASP + 凭证重放测试用例文档化。
- [ ] 主网前：Heimdall 端点 confirmed 写入 `docs/10` registry。
