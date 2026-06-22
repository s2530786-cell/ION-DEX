# 支付接入

> ION DEX 支付轨道的中文公开 API 导读。

## 目标能力

ION DEX 的支付基础设施目标上会处理：

- 多币种支付接受
- 后端 ION 结算路由
- 回调式支付确认
- 浏览器可验证的交易记录

## 认证方式

支付 API 方向上通常需要商户 API Key：

```http
POST /v1/payments/create
Authorization: Bearer <merchant-api-key>
Content-Type: application/json
```

## 典型端点

### 创建支付

```text
POST /v1/payments/create
```

### 查询支付状态

```text
GET /v1/payments/:paymentId
```

### 查询支付列表

```text
GET /v1/payments
```

### 发起退款

```text
POST /v1/payments/:paymentId/refund
```

## 状态机方向

```text
pending -> processing -> confirmed -> settled
                    -> failed
         -> expired
         -> cancelled
```

## Webhook 事件方向

- `payment.confirmed`
- `payment.failed`
- `payment.refunded`

## 币种与换算

- 输入侧可包括 USDT、USDC、ION、BNB 等
- 目标结算侧通常围绕 ION
- flakes 作为 `1 ION = 1,000,000,000 flakes` 的精细面额体系

## 使用提醒

- 本页是中文导读，帮助商户 / 开发者保持同语言导航。
- 端点、字段、支付状态、退款规则与风控要求，应以最终正式 API 文档为准。

---

返回 [商户接入](./merchant-onboarding.md) | [结算集成](./settlement-integration.md) | [英文支付接入](../payment-access.md)
