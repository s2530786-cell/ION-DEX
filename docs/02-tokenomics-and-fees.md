# Tokenomics And Fee Blueprint

This document defines the initial fee, burn, treasury, team, staking, keeper, and oracle economics.
Final values should be reviewed before mainnet and bounded by hard-coded contract maximums.

## Fee Token

All protocol-level fees should be charged in ION mainnet coin where technically possible.

For BSC flows, the user experience may collect BSC-side gas in BNB while protocol fees are accounted
as ION-equivalent through bridge/fee vault logic. The exact BSC collection model must be confirmed
after bridge design.

## Suggested Protocol Fee Distribution

| Destination | Share | Purpose |
| --- | ---: | --- |
| Burn | 35% | Long-term supply reduction and public burn narrative. |
| Team | 25% | Development, operations, security, and business expenses. |
| Staking rewards | 20% | ION single staking and LP staking reward support. |
| Treasury | 15% | Community promotion, ecosystem grants, liquidity support, and incident reserves. |
| Keeper / Oracle / Security operations | 5% | Automation execution costs, monitoring, and oracle infrastructure. |

## Fee Types

- Swap protocol fee: charged per swap.
- Limit order execution fee: charged when a keeper executes a limit order.
- Grid execution fee: charged per grid fill or batch execution.
- Bridge protocol fee: charged on cross-chain transfer.
- Domain marketplace fee: charged on domain sale or auction settlement.
- Staking early-unlock fee: optional, only if lock periods are implemented.

## Slippage Policy

Slippage should not be silently captured as protocol revenue.

- User sets `maxSlippageBps`.
- Contract enforces minimum output.
- If execution is better than the user's minimum, the surplus should remain with the user or be reflected transparently by the AMM math.
- Separate protocol and execution fees must be displayed before signing.

## Burn Accounting

Burn analytics must show:

- BSC ION daily, monthly, yearly, and total burn.
- ION mainnet daily, monthly, yearly, and total burn.
- Combined dual-chain total burn.
- Remaining supply = confirmed total supply - combined burn total.

The BSC burn address required by product is:

```text
0x000000000000000000000000000000000000dEaD
```

The ION mainnet burn address is pending official confirmation.

## Staking Accounting

Staking analytics must show:

- Official ION staking total.
- ION DEX staking total.
- LP staking total.
- Future ecosystem staking total placeholder.
- Combined staking total.
- APR, reward emissions, reward claimed, reward pending, and lock duration distribution.

## Dynamic APR Formula

Initial model:

```text
effectiveAPR =
  baseAPR
  + lockDurationBoost
  + liquidityShortageBoost
  + volumeBoost
  - emissionDecay
```

Contract and backend must cap APR boosts and make all parameters public.

## Governance And Safety Bounds

Contracts should enforce maximum values:

- Maximum protocol fee.
- Maximum team share.
- Maximum treasury share.
- Maximum bridge fee.
- Maximum keeper fee.
- Maximum emergency fee override duration.

Any fee change must emit public events and should pass through multisig and timelock.
