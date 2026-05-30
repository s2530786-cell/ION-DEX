# ION Official DEX Core Logic — Deep Dive

> Source: ice-blockchain/dex-core-v2 + ice-swap + infinity-periphery
> Date: 2026-05-30
> Purpose: Complete understanding of official DEX code for ION DEX development

---

## I. Architecture Overview — Three-Layer DEX System

```
┌─────────────────────────────────────────────────────┐
│                 ION Chain (FunC)                      │
│  dex-core-v2                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Router  │→ │  Pool    │→ │  Vault   │           │
│  │          │  │(const   │  │(protocol │           │
│  │ route    │  │ product)│  │ fees)    │           │
│  │ swap/LP  │  │         │  │          │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │LP Account│  │LP Wallet │  │Deployer  │           │
│  │(per-user)│  │(jetton)  │  │(factory) │           │
│  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────┘
          ↕ Bridge (cross-chain)
┌─────────────────────────────────────────────────────┐
│                 BSC Chain (Solidity)                  │
│  ice-swap                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │IONSwap   │  │IONBridge │  │Bridge    │           │
│  │v1↔v2 1:1│  │Router    │  │(TON fork)│           │
│  └──────────┘  └──────────┘  └──────────┘           │
│  infinity-periphery (PancakeSwap Infinity v4)        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │Infinity  │  │CL PosMgr │  │Bin PosMgr│           │
│  │Router    │  │(conc.liq)│  │(bin pool)│           │
│  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────┘
```

---

## II. dex-core-v2 — ION Chain DEX Core (FunC)

### A. Router (`router.fc`)

**Role:** Central routing hub. Receives all messages and dispatches.

**Message Flow:**
```
User → Jetton Wallet → Router → Pool → Router → Jetton Wallet (output)
                                      → Router → Vault (protocol fees)
```

**Router handles 5 message types:**
1. **Jetton messages** — incoming token transfers (swap/LP)
2. **Pool messages** — pay_to (send tokens to user) + pay_vault (send fees to vault)
3. **Admin messages** — set_fees, upgrade, lock/unlock
4. **Getter messages** — async queries for pool/lp data
5. **Vault messages** — deposit/withdraw protocol fees

**Router Storage:**
```
is_locked: bool
admin_address: MsgAddress
temp_upgrade: Cell
── static (ref) ──
  id: uint64
  jetton_lp_wallet_code: Cell
  pool_code: Cell
  lp_account_code: Cell
  vault_code: Cell
upgrade_pool_code: Cell
```

**DEX Routing Logic (`dex.fc`):**
1. Parse dex_payload: opcode + token_wallet1 + refund_address + excesses_address + tx_deadline
2. Validate workchain for all addresses
3. If parse fails → refund jettons to caller
4. If success → determine operation (swap or provide_lp)
5. Check: not locked, valid workchain, not expired, sufficient gas
6. Compute pool address from token pair + codes
7. Forward message to pool with state_init (auto-deploy pool if needed)
8. If any check fails → refund jettons with error code

**Cross-swap support:**
- `op::cross_swap` maps to `op::swap` internally
- After pool swap, if custom_payload has cross_swap opcode → route to next pool
- Enables multi-hop swaps through different pools

---

### B. Pool (`pool.fc` → `constant_product/pool.fc`)

**Pool Types:** Template-based (`<%= dexType %>`). Currently only `constant_product` (x*y=k).

**Constant Product Pool Storage:**
```
is_locked: bool
reserve0: Coins
reserve1: Coins
total_supply_lp: Coins
collected_token0_protocol_fee: Coins
collected_token1_protocol_fee: Coins
protocol_fee_address: MsgAddress
lp_fee: uint16
protocol_fee: uint16
── static (ref) ──
  router_address: MsgAddress
  token0_address: MsgAddress
  token1_address: MsgAddress
  jetton_lp_wallet_code: Cell
  lp_account_code: Cell
```

**Token Ordering:**
- token0 and token1 are sorted by slice_hash
- Ensures deterministic pool address for any token pair

**Swap Logic (`get_swap_out`):**
```
amount_in_with_fee = amount_in * (fee_divider - lp_fee)
base_out = (amount_in_with_fee * reserve_out) / (reserve_in * fee_divider + amount_in_with_fee)

if protocol_fee > 0:
    protocol_fee_out = (base_out * protocol_fee) / fee_divider

if ref_value > 0:
    ref_fee_out = (base_out * ref_value) / fee_divider

output = base_out - protocol_fee_out - ref_fee_out
```

**Fee Structure:**
- `fee_divider = 10000` (basis points)
- `lp_fee`: 0-100 (0% to 1%) — goes to LP providers
- `protocol_fee`: 0-100 (0% to 1%) — goes to protocol
- `ref_fee`: dynamic — goes to referrer
- Total fee = lp_fee + protocol_fee + ref_fee

**LP Provide Logic (`get_lp_provide_out`):**
1. Calculate invariant: `inv0 = sqrt(reserve0 * reserve1)`
2. Add amounts: `new_reserve0 = reserve0 + left_amount`, same for right
3. Calculate new invariant: `inv1 = sqrt(new_reserve0 * new_reserve1)`
4. If `inv1 <= inv0` → reject (no improvement)
5. Calculate ideal balances and apply fees on asymmetry
6. Calculate LP tokens: `(inv2 - inv0) * total_supply_lp / inv0`

**LP Burn Logic (`get_lp_burn_out`):**
```
left_amount = (lp_amount * reserve0) / total_supply_lp
right_amount = (lp_amount * reserve1) / total_supply_lp
```

**Gas Constants:**
```
add_liquidity: 27,000,000 gas
swap: 21,000,000 gas
burn_ext: 21,000,000 gas
```

---

### C. LP Account (`lp_account.fc`)

**Role:** Per-user account tracking LP deposits before they're committed to pool.

**Flow:**
1. User provides LP → tokens go to LP Account
2. LP Account accumulates both sides
3. Once both sides deposited → LP Account calls Pool to mint LP tokens
4. Pool mints LP tokens → sends to LP Wallet

---

### D. LP Wallet (`lp_wallet.fc`)

**Role:** Jetton-standard wallet for LP tokens.

**Features:**
- Standard TEP-74 jetton interface
- Transfer LP tokens between users
- Burn LP tokens (withdraw liquidity)

---

### E. Vault (`vault.fc`)

**Role:** Stores protocol fees and referral fees.

**Operations:**
1. `deposit_ref_fee` — called by Router to deposit protocol fees
2. `withdraw_fee` — called by anyone to withdraw accumulated fees to owner

**Storage:**
```
owner_address: MsgAddress
token_address: MsgAddress
router_address: MsgAddress
deposited_amount: Coins
```

---

### F. Deployer (`deployer.fc`)

**Role:** Factory contract that creates new pools.

**Flow:**
1. Admin sends deploy request with token pair
2. Deployer computes pool address
3. Deploys pool with state_init if not exists

---

## III. ice-swap — BSC Swap + Bridge (Solidity)

### A. IONSwap.sol

**Role:** Fixed-rate swap between ICE v1 and ICE v2 on BSC.

**Key Properties:**
- Exchange rate: 1:1 (adjusted for decimals)
- `pooledToken` = ICE v2 (what users receive)
- `otherToken` = ICE v1 (what users provide)
- Forward swap: otherToken → pooledToken
- Reverse swap: pooledToken → otherToken

**Functions:**
- `swapTokens(amount)` — forward swap (v1→v2)
- `swapTokensBack(amount)` — reverse swap (v2→v1)
- `getPooledAmountOut(amount)` — quote forward
- `getOtherAmountOut(amount)` — quote reverse
- `withdrawLiquidity(token, receiver, amount)` — owner only

**Security:**
- ReentrancyGuard
- Ownable (multi-sig recommended)
- SafeERC20 for all transfers
- Zero amount checks
- Insufficient balance checks

### B. IONBridgeRouter.sol

**Role:** Unified facade for swap + bridge.

**Burn Flow (BSC → ION):**
```
User calls burn(amount, ionAddress)
  → swap ICE v1 to ICE v2 via IONSwap
  → approve Bridge to spend ICE v2
  → bridge.burn(iceV2Amount, ionAddress)
  → emit TokensBurned
```

**Mint Flow (ION → BSC):**
```
User calls voteForMinting(data, signatures)
  → bridge.voteForMinting(data, signatures) // mints ICE v2
  → swap ICE v2 to ICE v1 via IONSwap
  → transfer ICE v1 to user
  → emit TokensMinted
```

**Key insight:** Users always interact with ICE v1 on BSC. ICE v2 is used internally for bridging.

---

## IV. infinity-periphery — PancakeSwap Infinity v4 (Solidity)

### Architecture
Based on PancakeSwap Infinity (v4) — the latest generation DEX framework.

**Core Components:**

| Component | Role |
|-----------|------|
| `InfinityRouter` | Unified swap router (CL + Bin) |
| `CLPositionManager` | Concentrated Liquidity positions (NFT) |
| `BinPositionManager` | Bin pool positions (ERC-1155) |
| `CLQuoter` | CL pool quotes |
| `BinQuoter` | Bin pool quotes |
| `MixedQuoter` | Cross-type quotes |
| `CLMigrator` | Migrate from V2/V3 to CL |
| `BinMigrator` | Migrate from V2/V3 to Bin |

**Supported Actions:**
- CL_SWAP_EXACT_IN / CL_SWAP_EXACT_OUT
- BIN_SWAP_EXACT_IN / BIN_SWAP_EXACT_OUT
- SETTLE / TAKE / SETTLE_ALL / TAKE_ALL
- MINT / BURN / BURN_6909
- Migration from PancakeSwap V2/V3 and Uniswap V2/V3

**Pool Types:**
- **CL (Concentrated Liquidity):** Like Uniswap V3, capital-efficient
- **Bin:** Like Trader Joe V2, concentrated at discrete price levels

---

## V. Complete Message Flow — Swap

### ION Chain Swap:
```
1. User sends Token A to Router (via jetton transfer)
2. Router parses dex_payload (opcode=swap, target_token, deadline, etc.)
3. Router validates and routes to Pool
4. Pool calculates output using get_swap_out()
5. Pool sends pay_to to Router
6. Router sends Token B to User's jetton wallet
7. If protocol_fee > 0: Pool sends pay_vault to Router → Router sends to Vault
8. If ref_fee > 0: similar flow to referrer's vault
```

### BSC → ION Bridge:
```
1. User calls IONBridgeRouter.burn(amount, ionAddress)
2. IONSwap: swap ICE v1 → ICE v2 (1:1)
3. Bridge.burn: lock ICE v2 on BSC, emit event
4. ION chain oracles detect event
5. ION chain mints equivalent ION tokens
```

### ION → BSC Bridge:
```
1. User burns ION on ION chain
2. BSC oracles detect and sign
3. User calls IONBridgeRouter.voteForMinting(data, sigs)
4. Bridge.mint: mint ICE v2 on BSC
5. IONSwap: swap ICE v2 → ICE v1 (1:1)
6. Transfer ICE v1 to user
```

---

## VI. Key Insights for ION DEX Development

### 1. Official DEX is STON.fi V2 fork on ION chain
- The pool math, fee structure, LP mechanics are proven production code
- We can safely build on top of this

### 2. Fee system is flexible
- lp_fee: 0-1% (configurable per pool)
- protocol_fee: 0-1% (configurable per pool)
- ref_fee: dynamic (per transaction)
- This gives us room to implement our burn mechanism

### 3. Cross-swap enables multi-hop
- Already supported in router
- We can extend this for cross-chain routes

### 4. PancakeSwap Infinity integration on BSC
- CL + Bin dual engine
- Migration tools from other DEXes
- This is already v4 level

### 5. Gas costs are known
- swap: ~21M gas on ION
- add_liquidity: ~27M gas
- These are reasonable for user transactions

### 6. Upgrade mechanism exists
- Router can upgrade pool code
- Admin can change fees
- This gives us long-term flexibility

---

## VII. What We Add (Differentiation Layer)

| Layer | Official Has | We Add |
|-------|-------------|--------|
| Core Swap | ✅ AMM + CL + Bin | 🔥 Fee burn to dead address |
| LP Management | ✅ Provide/burn | 🔥 Staking yields |
| Bridge | ✅ BSC↔ION | 🔥 Multi-chain expansion |
| Fees | ✅ lp_fee + protocol_fee | 🔥 Auto-burn mechanism |
| Identity | ❌ None | 🔥 ION Identity integration |
| AI | ❌ None | 🔥 AI quant layer |
| Brand | ❌ None | 🔥 Brand channel + bilingual |
| Ecosystem | ❌ None | 🔥 Ecosystem hub portal |

**Our code delta is the value layer, not the infrastructure layer.**

---

*This document represents complete understanding of official DEX core logic.*
*Every contract, every message flow, every fee calculation — documented and understood.*
