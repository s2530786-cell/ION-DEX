# Page Flow And User Journeys

## Navigation Structure

```text
Dashboard
  -> Swap
  -> Trade
  -> Grid
  -> Pool
  -> Stake
  -> Burn
  -> Bridge
  -> Domain
  -> Identity
  -> AI Market
  -> Treasury
  -> Transparency
  -> Profile
```

## Global Layout

Top area:

- ION DEX logo.
- Market ticker strip.
- Primary nav.
- Notification icon.
- Wallet/profile button.

Main area:

- Page-specific content.
- Glass panels and neon cards.
- Aurora/galaxy animated background.

Profile popover:

- Avatar.
- Wallet connection.
- ION ID status.
- `.ion` primary name.
- Language.
- Theme.
- Quick actions.

## User Journey: First Visit

1. User opens Dashboard.
2. App loads public config, token list, CMC ticker data, and system status.
3. User sees aurora/galaxy UI and market overview.
4. User clicks wallet/profile.
5. App shows supported wallets.
6. User connects wallet.
7. App detects network, language, `.ion` name if available, and identity status if available.

## User Journey: Market Swap

1. User opens Swap.
2. User chooses input token and output token.
3. User enters amount.
4. Backend quote API returns expected output, price impact, fee, and route.
5. Frontend displays minimum received and protocol fee.
6. User confirms.
7. Frontend simulates transaction when supported.
8. Wallet shows human-readable signing summary.
9. User signs.
10. Indexer detects execution.
11. UI updates balance, transaction history, fee, and burn contribution.

## User Journey: Limit Order

1. User opens Trade.
2. User selects Limit.
3. User enters price, amount, expiry, max slippage, and execution fee.
4. App simulates order and displays risk.
5. User signs create-order transaction.
6. Keeper monitors price.
7. Keeper executes when oracle/TWAP conditions match.
8. User sees fill status and execution details.

## User Journey: Grid Strategy

1. User opens Grid.
2. User chooses strategy type.
3. User enters range, grid count, amount, stop-loss/take-profit, and duration.
4. AI can suggest parameters if user requests.
5. Backend runs simulation/backtest.
6. User signs strategy creation.
7. Keeper executes strategy steps.
8. User can pause, cancel, or claim proceeds.

## User Journey: Burn Analytics

1. User opens Burn.
2. Backend returns BSC burn, ION burn, combined burn, and remaining supply.
3. User switches period: 1H, 1D, 1M, 1Y, ALL.
4. Charts update.
5. User can click proof links to view burn transactions.

## User Journey: Staking

1. User opens Stake.
2. User sees official staking, DEX staking, LP staking, and ecosystem placeholder totals.
3. User chooses staking pool.
4. App shows APR formula, lock period, rewards, and risks.
5. User signs stake transaction.
6. Indexer updates staking position.
7. User claims rewards when available.

## User Journey: Bridge

1. User opens Bridge.
2. User selects source and target chains.
3. User enters asset and amount.
4. App displays fee, route, estimated time, and risk notice.
5. User signs source-chain transaction.
6. Bridge service tracks confirmations.
7. Validators sign release packet.
8. Target-chain transaction is submitted.
9. UI shows finalized or refund state.

## User Journey: Domain Transfer

1. User enters `alice.ion` in recipient field.
2. Domain service resolves current bound address.
3. UI displays domain, owner, resolved address, update time, and risk status.
4. User confirms.
5. App re-resolves immediately before wallet signing.
6. Wallet shows final resolved address and transfer summary.
7. User signs.

## User Journey: ION ID

1. User opens Identity or profile popover.
2. App checks wallet-linked identity status.
3. Backend verifies proof/credential metadata.
4. UI displays identity level, expiry, and badge.
5. For high-risk flows, app checks required level before transaction.

## User Journey: AI Market

1. User opens AI Market.
2. Backend returns market summary, signals, risk score, and data sources.
3. User asks for grid suggestion.
4. AI returns parameters with explanation and risk warnings.
5. User may apply parameters to Grid form.
6. User still signs all on-chain actions manually.

## User Journey: Profile

1. User clicks avatar.
2. User sees quick profile popover.
3. User can pick avatar, language, theme, and privacy mode.
4. User can manage wallets, approvals, notifications, orders, staking, domains, and security logs.
5. User can open full Profile page for deeper controls.
