# Settlement Integration

> How merchant payments are settled, reconciled, and verified on ION DEX.

## Settlement Architecture

```
Customer payment (USDT/USDC/ION)
  → ION DEX payment layer
    → Currency conversion via DEX liquidity pools
    → ION routed to merchant settlement wallet
    → 0.5% platform fee deducted
      → 50% burned to 0x000...dEaD (permanent)
      → 50% distributed to staking / treasury
    → Settlement notification via webhook
    → Explorer verification link generated
```

**Total settlement time:** 5-15 seconds from customer confirmation to merchant receipt.

---

## Settlement Wallets

### Default Settlement (ION)

All payments settle in ION by default. The merchant's ION wallet receives the payment amount minus the 0.5% platform fee.

### Stablecoin Settlement

Merchants can opt for automatic ION → stablecoin conversion:
- ION is converted to USDT/USDC at the current DEX rate.
- Conversion happens at settlement time (no manual action required).
- Conversion fee: 0.1% (included in the 0.5% platform fee).

---

## Fee Breakdown

For a $100 payment:

| Component | Amount | Destination |
|-----------|--------|-------------|
| Customer pays | $100.00 | — |
| Platform fee | $0.50 | Deducted at settlement |
| Burn portion | $0.25 | Sent to burn address (permanent) |
| Staking/Treasury | $0.25 | Distributed to staking pool + treasury |
| Merchant receives | $99.50 | Merchant settlement wallet |

**All fee events are verifiable on the [ION Explorer](https://explorer.ice.io/).**

---

## Reconciliation

### Daily Settlement Report

Merchants receive a daily settlement report via webhook:

```json
{
  "event": "settlement.daily_report",
  "date": "2026-06-04",
  "totalPayments": 156,
  "totalAmount": "15600.00",
  "totalFees": "78.00",
  "totalBurned": "39.00",
  "netSettlement": "15522.00",
  "currency": "USDT",
  "transactions": [
    {
      "paymentId": "pay_abc123",
      "orderId": "ORD-12345",
      "amount": "100.00",
      "fee": "0.50",
      "net": "99.50",
      "txHash": "0x1234...abcd",
      "explorerUrl": "https://explorer.ice.io/tx/0x1234...abcd"
    }
  ]
}
```

### Manual Reconciliation

Merchants can query settlement history:

```http
GET /v1/settlements?from=2026-06-01&to=2026-06-04&currency=USDT
```

---

## Explorer Verification

Every settlement is linked to an Explorer verification URL:

```typescript
// Example: Verify a settlement
const verification = await client.settlement.verify({
  paymentId: 'pay_abc123',
});

console.log(verification.explorerUrl); // https://explorer.ice.io/tx/0x1234...abcd
console.log(verification.burnProof);   // https://explorer.ice.io/tx/0xburn...efgh
console.log(verification.stakingProof); // https://explorer.ice.io/tx/0xstake...ijkl
```

This allows merchants and customers to independently verify:
- The payment was received.
- The fee was correctly deducted.
- The burn portion was permanently destroyed.
- The staking portion was correctly distributed.

---

## Multi-Chain Settlement

ION DEX supports settlement across chains:

| Chain | Settlement Method | Confirmation Time |
|-------|-------------------|-------------------|
| ION Mainnet | Direct ION transfer | 5-10 seconds |
| BSC | Bridge transfer via BSCVault | 30-60 seconds |
| Other EVM | Cross-chain bridge | Varies |

### Bridge Settlement

For merchants who need BSC settlement:

```
Customer pays → ION DEX processes → Bridge initiates
  → ION mainnet confirmation → Bridge validators sign → BSC BSCVault receives
  → Merchant BSC wallet credited → Settlement notification
```

---

## Dispute Resolution

If a payment dispute arises:

1. **Merchant reports dispute** via API or dashboard.
2. **AI Arbitration system** analyzes evidence from both parties.
3. **Arbitration decision** is recorded on-chain (Explorer-verifiable).
4. **Appeal available** for high-stakes disputes (human oversight).
5. **Resolution executed** — refund, partial refund, or confirmation.

See the main README [AI Arbitration section](../README.md#ai-arbitration-and-sentinel-defense) for full mechanism description.

---

## Security Considerations

- **Webhook signature verification** — All webhooks include HMAC-SHA256 signatures.
- **No raw KYC storage** — Only proof status and metadata are retained.
- **Settlement wallet isolation** — Merchant settlement wallets are separate from operational wallets.
- **48h timelock on refunds** — Large refunds require timelock confirmation.
- **Explorer audit trail** — Every fee, burn, and settlement is permanently recorded on-chain.

---

## Integration Checklist

1. ✅ Register merchant account
2. ✅ Configure settlement wallet (ION or stablecoin)
3. ✅ Set up webhook endpoint with signature verification
4. ✅ Test integration on testnet
5. ✅ Verify Explorer links for test payments
6. ✅ Configure daily report delivery
7. ✅ Go live on mainnet

---

Return to [Merchant Onboarding](./merchant-onboarding.md) | [Payment Access](./payment-access.md) | [API Overview](./api-overview.md)