# Payment Access

> Detailed API reference for integrating ION DEX payment rails.

## Overview

ION DEX provides a payment infrastructure layer that handles:
- Multi-currency acceptance (stablecoin, ION, major tokens).
- Backend ION settlement routing.
- Sub-second confirmation.
- Webhook-based settlement notification.
- Explorer-verifiable transaction records.

---

## Authentication

All payment API requests require a merchant API key:

```http
POST /v1/payments/create
Authorization: Bearer <merchant-api-key>
Content-Type: application/json
```

---

## Payment Endpoints

### Create Payment

```http
POST /v1/payments/create
```

```json
{
  "amount": "100.00",
  "currency": "USDT",
  "orderId": "ORD-12345",
  "description": "Product purchase",
  "returnUrl": "https://shop.com/order/ORD-12345",
  "expiresIn": 900,
  "metadata": {
    "customerEmail": "customer@example.com",
    "items": ["SKU-A1", "SKU-B2"]
  }
}
```

Response:

```json
{
  "paymentId": "pay_abc123",
  "checkoutUrl": "https://checkout.iondex.io/pay_abc123",
  "amount": "100.00",
  "currency": "USDT",
  "ionAmount": "719424.46",
  "expiresAt": "2026-06-04T10:00:00Z",
  "status": "pending"
}
```

### Get Payment Status

```http
GET /v1/payments/:paymentId
```

```json
{
  "paymentId": "pay_abc123",
  "orderId": "ORD-12345",
  "amount": "100.00",
  "currency": "USDT",
  "status": "confirmed",
  "txHash": "0x1234...abcd",
  "confirmedAt": "2026-06-04T09:45:12Z",
  "settlementWallet": "0xmerchant...address",
  "explorerUrl": "https://explorer.ice.io/tx/0x1234...abcd"
}
```

### List Payments

```http
GET /v1/payments?status=confirmed&limit=50&offset=0
```

### Refund Payment

```http
POST /v1/payments/:paymentId/refund
```

```json
{
  "reason": "Customer request",
  "amount": "50.00",
  "partial": true
}
```

---

## Payment States

```
pending → processing → confirmed → settled
                     → failed
         → expired
         → cancelled
```

| State | Description |
|-------|-------------|
| `pending` | Payment created, waiting for customer action |
| `processing` | Transaction submitted to chain |
| `confirmed` | Transaction confirmed on-chain |
| `settled` | ION routed to merchant wallet |
| `failed` | Transaction failed on-chain |
| `expired` | Payment window expired without action |
| `cancelled` | Payment cancelled by merchant |

---

## Webhook Events

### Payment Confirmed

```json
{
  "event": "payment.confirmed",
  "paymentId": "pay_abc123",
  "orderId": "ORD-12345",
  "amount": "100.00",
  "currency": "USDT",
  "txHash": "0x1234...abcd",
  "confirmedAt": "2026-06-04T09:45:12Z",
  "signature": "hmac-sha256=..."
}
```

### Payment Failed

```json
{
  "event": "payment.failed",
  "paymentId": "pay_abc123",
  "orderId": "ORD-12345",
  "reason": "Insufficient liquidity",
  "signature": "hmac-sha256=..."
}
```

### Payment Refunded

```json
{
  "event": "payment.refunded",
  "paymentId": "pay_abc123",
  "orderId": "ORD-12345",
  "refundAmount": "50.00",
  "refundTxHash": "0x5678...efgh",
  "signature": "hmac-sha256=..."
}
```

---

## Currency Handling

### Supported Input Currencies

| Currency | Type | Min Amount | Max Amount |
|----------|------|-----------|------------|
| USDT | Stablecoin | $0.01 | No limit |
| USDC | Stablecoin | $0.01 | No limit |
| ION | Native | 1 ION | No limit |
| BNB | EVM | 0.001 BNB | No limit |

### Currency Conversion

When a customer pays in a currency other than ION:
1. The payment system quotes a conversion rate from the DEX liquidity pool.
2. The customer sees the exact amount they will pay.
3. After confirmation, the backend routes through ION settlement.
4. The merchant receives ION (or auto-converts to stablecoin).

### Flakes Support

For micro-transactions, amounts can be specified in flakes:
- 1 ION = 1,000,000,000 flakes
- Minimum payment: 1,000 flakes (0.000001 ION)

---

## Rate Limits

| Tier | Payments/min | Daily Limit |
|------|-------------|-------------|
| Standard | 30 | $10,000 |
| Professional | 120 | $100,000 |
| Enterprise | 600 | No limit |

---

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_AMOUNT` | Amount below minimum or format error |
| `UNSUPPORTED_CURRENCY` | Currency not supported for payments |
| `PAYMENT_EXPIRED` | Payment window expired |
| `DUPLICATE_ORDER` | Order ID already has a pending payment |
| `MERCHANT_SUSPENDED` | Merchant account suspended |
| `INSUFFICIENT_LIQUIDITY` | DEX cannot route payment at this time |

---

Return to [Merchant Onboarding](./merchant-onboarding.md) | [Settlement Integration](./settlement-integration.md) | [API Overview](./api-overview.md)