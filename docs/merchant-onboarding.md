# Merchant Onboarding

> How merchants and e-commerce operators can integrate ION DEX payment rails.

## Why ION DEX for Merchants

| Feature | Traditional Processors | ION DEX |
|---------|----------------------|---------|
| Settlement time | 2-7 days | Seconds |
| Transaction fee | 2-3% | 0.5% |
| Cross-border friction | Multiple processors, conversion fees | Single ION rail |
| Web3 customer reach | None | Direct access |
| Chain complexity | N/A | Handled by infrastructure |

---

## Integration Paths

### Path 1: Payment Button (Easiest)

For simple checkout integration:

```html
<script src="https://js.iondex.io/checkout.js"></script>
<button onclick="IONCheckout.pay({ amount: '10', currency: 'USDT' })">
  Pay with ION
</button>
```

The checkout widget handles:
- Wallet connection
- Currency conversion (stablecoin → ION backend)
- Payment confirmation
- Settlement notification

### Path 2: API Integration

For custom checkout flows:

```typescript
import { MerchantAPI } from '@ion-dex/sdk';

const merchant = new MerchantAPI({
  apiKey: process.env.ION_MERCHANT_KEY,
  webhookUrl: 'https://your-shop.com/ion-webhook',
});

// Create payment session
const session = await merchant.createPayment({
  amount: '100', // USDT
  orderId: 'ORD-12345',
  description: 'Product purchase',
  returnUrl: 'https://your-shop.com/order/ORD-12345',
});

// Redirect customer to payment page
res.redirect(session.checkoutUrl);

// Handle webhook callback
app.post('/ion-webhook', async (req, res) => {
  const { orderId, txHash, status } = req.body;
  if (status === 'confirmed') {
    await fulfillOrder(orderId);
  }
  res.json({ received: true });
});
```

### Path 3: Direct Settlement

For high-volume merchants who want direct ION settlement:

```typescript
// Direct wallet-to-wallet payment
const payment = await merchant.directPayment({
  fromWallet: customerWallet,
  toWallet: merchantWallet,
  amount: '100', // ION
  memo: 'ORD-12345',
});
```

---

## Supported Currencies

### Frontend (What Customers Pay With)
- USDT (Tether)
- USDC (USD Coin)
- ION
- Any major token supported by ION DEX liquidity pools

### Backend (What You Receive)
- **ION** (default) — All fees routed through ION settlement layer.
- **Stablecoin** (optional) — Backend auto-converts to USDT/USDC.

---

## Fee Structure

| Fee Type | Rate | Notes |
|----------|------|-------|
| Platform fee | 0.5% | Charged on each payment |
| Burn portion | 0.25% | 50% of platform fee burned permanently |
| Settlement fee | Gas only | Network fee, not platform revenue |

---

## Settlement Flow

```
Customer pays USDT
  → ION DEX converts to ION (backend routing)
  → ION routed to merchant wallet
  → Settlement notification via webhook
  → Merchant fulfills order
```

**Settlement time:** 5-15 seconds (depending on network congestion).

---

## Getting Started

### 1. Register Merchant Account

Contact the ION DEX team to register as a merchant:
- Telegram: `@iondex888`
- Email: `merchants@iondex.io`

### 2. Get API Credentials

After registration, you'll receive:
- Merchant ID
- API Key
- Webhook secret (for signature verification)

### 3. Configure Webhook

Set up a webhook endpoint to receive payment confirmations:

```typescript
import { createHmac } from 'crypto';

app.post('/ion-webhook', (req, res) => {
  const signature = req.headers['x-ion-signature'];
  const payload = JSON.stringify(req.body);

  // Verify signature
  const expectedSignature = createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process payment
  const { orderId, txHash, amount, status } = req.body;
  // ... fulfill order ...
});
```

### 4. Test Integration

Use the testnet environment before going live:
- Testnet API: `https://api.testnet.iondex.io/v1`
- Testnet checkout: `https://checkout.testnet.iondex.io`

---

## Documentation

- [Payment Access](./payment-access.md) — Detailed payment API reference.
- [Settlement Integration](./settlement-integration.md) — Settlement and reconciliation.
- [API Overview](./api-overview.md) — Full API documentation.

---

## Support

- **Technical support:** `developers@iondex.io`
- **Business inquiries:** `merchants@iondex.io`
- **Telegram:** `@iondex888`

---

Return to [README](../README.md) | [Payment Access](./payment-access.md) | [Settlement Integration](./settlement-integration.md)