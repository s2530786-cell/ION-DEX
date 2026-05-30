# ION DEX Flywheel Layer — Design Document 1.0

> Built on: ice-blockchain/dex-core-v2 + ice-swap + infinity-periphery
> Date: 2026-05-30
> Principle: Stand on official code, add flywheel layer without breaking compatibility

---

## I. Design Philosophy

### Core Rule: Don't modify official contracts. Wrap them.

We NEVER fork and modify official contract code directly. Instead:
- Deploy official contracts as-is (or use already-deployed instances)
- Build NEW contracts that interact with official contracts via messages/calls
- This ensures: upgrade compatibility, code lineage purity, official ecosystem alignment

### Architecture: Official Layer + Flywheel Layer

```
┌─────────────────────────────────────────────┐
│            Flywheel Layer (NEW)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ FeeBurn  │ │ Staking  │ │ Identity │     │
│  │ Engine   │ │ Vault    │ │ Gateway  │     │
│  └──────────┘ └──────────┘ └──────────┘     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ AI Quant │ │ Eco Hub  │ │ Seamless │     │
│  │ Bridge   │ │ Portal   │ │ Pay      │     │
│  └──────────┘ └──────────┘ └──────────┘     │
├─────────────────────────────────────────────┤
│         Official Layer (EXISTING)            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ Router   │ │ Pool     │ │ Vault    │     │
│  │ (v2)     │ │ (x*y=k) │ │ (fees)   │     │
│  └──────────┘ └──────────┘ └──────────┘     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ Bridge   │ │ Swap     │ │ Infinity │     │
│  │ (BSC↔ION)│ │ (v1↔v2) │ │ (CL+Bin) │     │
│  └──────────┘ └──────────┘ └──────────┘     │
└─────────────────────────────────────────────┘
```

---

## II. Flywheel 1: Fee Burn Engine

### Problem
Official `vault.fc` collects protocol fees but just stores them. No burn mechanism exists.

### Solution: FeeBurnVault — Replace/Extend Official Vault

**How it works:**
```
Pool swap → protocol_fee collected → Router.pay_vault
    → Official Vault (or FeeBurnVault)
        → 50% sent to dead address (BURN)
        → 30% sent to StakingVault (rewards)
        → 20% sent to Treasury (operations)
```

**Implementation: Two approaches**

#### Approach A: Custom Vault (Recommended)
Deploy our own vault code that replaces the official vault in pool setup.

```func
;; FeeBurnVault.fc — replaces vault.fc
;; Same interface as official vault, but with burn logic

() recv_internal(...) impure {
    ;; ... same validation as official vault ...
    
    if (ctx.at(OPCODE) == op::deposit_ref_fee) {
        storage::deposited_amount += in_msg_body~load_coins();
        storage::save();
        
        ;; NEW: Auto-distribute on deposit
        int burn_amount = muldiv(storage::deposited_amount, 5000, 10000);  ;; 50%
        int stake_amount = muldiv(storage::deposited_amount, 3000, 10000); ;; 30%
        int treasury_amount = storage::deposited_amount - burn_amount - stake_amount; ;; 20%
        
        ;; Send to dead address (permanent burn)
        msgs::send_simple(0, dead_address, 
            jetton_wallet::transfer(0, burn_amount, dead_address, storage::owner_address).end_cell(),
            CARRY_ALL_BALANCE);
        
        ;; Send to staking vault
        ;; Send to treasury
    }
}
```

**Key design decisions:**
- Same message interface as official vault → Router doesn't need changes
- Pool's `protocol_fee_address` points to our FeeBurnVault instead of plain address
- Burn address: `0x000000000000000000000000000000000000dEaD` (BSC) or ION equivalent
- Distribution ratios configurable by admin (Master address)

#### Approach B: Post-Processing (Simpler, Less Efficient)
Keep official vault, add a separate "BurnBot" that periodically:
1. Calls `withdraw_fee` on official vault
2. Sends 50% to dead address
3. Sends 30% to staking vault
4. Keeps 20% in treasury

**Pros:** No contract changes at all
**Cons:** Not instant, requires gas for each burn cycle

**Recommendation:** Start with Approach B for speed, migrate to A for production.

---

## III. Flywheel 2: Staking Vault

### Problem
No staking mechanism exists in official code. Users just hold LP tokens with no yield beyond trading fees.

### Solution: IONStakingVault — Stake LP tokens, earn ION rewards

**How it works:**
```
User provides LP to Pool → receives LP tokens
    → User stakes LP tokens in IONStakingVault
        → Vault tracks stake amount + duration
        → Rewards accumulate based on:
            - Base APY (from fee burn allocation)
            - Duration multiplier (longer lock = higher yield)
            - ION Identity reputation bonus
        → User can claim rewards anytime
        → User can unstake after lock period
```

**Staking Products (per Master's tokenomics design):**
| Product | Lock Period | APY |
|---------|------------|-----|
| Flexible | None | 8% |
| 7-day | 7 days | 10% |
| 30-day | 30 days | 12% |
| 90-day | 90 days | 15% |
| 180-day | 180 days | 20% |
| 365-day | 365 days | 30% |

**Reward source:** 30% of protocol fees (from FeeBurnVault) + 20% of platform revenue

**Solidity Implementation (BSC):**
```solidity
contract IONStakingVault {
    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 lockPeriod;
        uint256 rewardDebt;
    }
    
    mapping(address => Stake) public stakes;
    uint256 public totalStaked;
    uint256 public rewardRate; // rewards per second per staked token
    
    function stake(uint256 amount, uint256 lockPeriod) external {
        // Transfer LP tokens from user
        // Calculate APY based on lockPeriod
        // Update reward debt
    }
    
    function unstake() external {
        // Check lock period
        // Return LP tokens
        // Claim pending rewards
    }
    
    function claimRewards() external {
        // Calculate pending rewards
        // Transfer ION rewards to user
    }
    
    function notifyRewardAmount(uint256 amount) external {
        // Called by FeeBurnVault when fees are distributed
        // Updates reward rate
    }
}
```

**FunC Implementation (ION Chain):**
Similar logic but using TON-style message passing instead of direct calls.

---

## IV. Flywheel 3: ION Identity Gateway

### Problem
Official `dns-contract` provides naming, but no credit/reputation system. Official ION Identity has 22 sub-capabilities (from whitepaper) but most aren't implemented in code yet.

### Solution: IONIdentityGateway — Bridge between ION Identity and DEX

**How it works:**
```
User connects wallet → IONIdentityGateway
    → Reads ION Identity (dns-contract + future identity contracts)
    → Assigns trust score based on:
        - Trading history (volume + frequency)
        - LP providing history
        - Staking duration
        - Bridge activity
        - No malicious behavior
    → Trust score unlocks:
        - Lower fees (high trust = discount)
        - Higher staking APY
        - Access to premium features (AI quant, etc.)
        - Governance weight
```

**Trust Score Calculation:**
```
trust_score = 
    (trade_volume_30d * 0.2) +
    (lp_provided_30d * 0.25) +
    (staking_duration_days * 0.2) +
    (bridge_volume_30d * 0.15) +
    (identity_verified * 0.1) +
    (no_slash_history * 0.1)
```

**Fee Discount by Trust Level:**
| Level | Trust Score | Fee Discount |
|-------|------------|-------------|
| Bronze | 0-30 | 0% |
| Silver | 31-60 | 10% |
| Gold | 61-80 | 20% |
| Platinum | 81-95 | 30% |
| Diamond | 96-100 | 50% |

**Implementation:** Separate contract that reads on-chain data and maintains trust scores.

---

## V. Flywheel 4: AI Quant Bridge

### Problem
No AI integration exists in official code.

### Solution: AIQuantBridge — Connect AI strategies to DEX execution

**How it works:**
```
AI Strategy (off-chain) → AIQuantBridge (on-chain)
    → Submit trade intent (signed by user's key)
    → Bridge validates:
        - Daily position limit
        - Per-trade amount limit
        - Slippage tolerance
        - User authorization
    → Execute via official Router
    → Record results for learning
```

**Key Safety Features:**
- Hard-coded daily position/amount limits
- User must authorize AI strategy (can revoke anytime)
- No AI can execute without user's signed intent
- All AI actions are auditable on-chain

**Implementation:** Solidity proxy contract on BSC + FunC handler on ION.

---

## VI. Flywheel 5: Seamless Payment Layer

### Problem
Every on-chain action requires manual signing. No "auto-pay" mechanism.

### Solution: IONSeamlessPay — Auto-pay using wallet allowances

**How it works:**
```
Merchant presents bill → IONSeamlessPay
    → Check user's auto-pay allowance (pre-authorized)
    → Check user's ION balance
    → If balance insufficient → auto-swap via Router
    → Execute payment
    → Deduct fee → 50% burn → 30% staking → 20% treasury
    → User gets receipt, no manual signing needed
```

**Pre-authorization (user sets once):**
```solidity
struct AutoPayAllowance {
    uint256 dailyLimit;      // Max per day
    uint256 perTxLimit;     // Max per transaction  
    uint256 merchantWhitelist; // Allowed merchants
    bool enabled;
}
```

**This builds on:**
- `wallet-contract-v5` (prolonged transfer, allowances)
- `router.fc` (auto-swap for balance top-up)
- `IONIdentityGateway` (trust-based limits)
- `FeeBurnVault` (auto fee distribution)

---

## VII. Flywheel 6: Eco Hub Portal

### Problem
No unified entry point for ION ecosystem services.

### Solution: Frontend integration (no new contracts needed)

This is the "ION Ecosystem" module from the Access Architecture design:
- Official Website link
- Explorer link (with contextual verification)
- ION Identity panel
- ION Vault status
- Staking dashboard
- AI Quant dashboard
- Developer resources

**Implementation:** Frontend only, no new smart contracts. Uses existing API endpoints.

---

## VIII. Integration Map: How Each Flywheel Connects to Official Code

```
OFFICIAL CODE              FLYWHEEL LAYER              USER FACING
─────────────              ──────────────              ───────────

router.fc ──────────────→ FeeBurnVault ──────────────→ Fee breakdown UI
                    │         │
                    │         ├→ 50% → Dead Address (BURN)
                    │         ├→ 30% → StakingVault
                    │         └→ 20% → Treasury
                    │
pool.fc ─────────────→ IONStakingVault ──────────────→ Staking UI
  (LP tokens)           (stake/burn LP)
                         │
                         ├→ Base APY (8-30%)
                         ├→ Identity bonus (up to +5%)
                         └→ FeeBurnVault rewards
                         
vault.fc ─────────────→ FeeBurnVault (replaces) ────→ Burn stats UI
  (deposit/withdraw)

dns-contract ─────────→ IONIdentityGateway ────────→ Identity UI
  (naming)               (trust score)
                         │
                         ├→ Fee discounts
                         ├→ Staking bonuses  
                         └→ Feature access

IONSwap.sol ──────────→ IONSeamlessPay ────────────→ Payment UI
  (1:1 swap)             (auto-pay)
                         │
                         ├→ Auto-swap
                         ├→ Auto fee distribution
                         └→ Receipt generation

InfinityRouter ────────→ AIQuantBridge ─────────────→ AI Quant UI
  (CL+Bin swap)          (strategy execution)
                         │
                         ├→ Position limits
                         ├→ Signed intents
                         └→ Audit trail

All official ─────────→ Eco Hub Portal ────────────→ Dashboard
  (links/APIs)           (frontend aggregation)
```

---

## IX. Deployment Strategy

### Phase 1: Fee Burn + Staking (P0)
1. Deploy FeeBurnVault (Approach B first: burn bot)
2. Deploy IONStakingVault on BSC (Solidity)
3. Set up fee distribution pipeline
4. Build staking UI

### Phase 2: Identity + Seamless Pay (P1)
1. Deploy IONIdentityGateway
2. Implement trust score calculation
3. Deploy IONSeamlessPay on BSC
4. Build identity + payment UI

### Phase 3: AI Quant + Eco Hub (P2)
1. Deploy AIQuantBridge
2. Build Eco Hub frontend
3. Integrate all flywheel components into unified dashboard

### Phase 4: ION Chain Flywheel (P3)
1. Port flywheel contracts to FunC for ION chain
2. Deep integration with ION Identity official contracts
3. Cross-chain flywheel coordination

---

## X. Revenue Flow (Complete Picture)

### Master's Share (Iron Rule ㉗, 2026-05-26, Never Changes)

**Master gets 20% of ALL platform revenue, FIRST, before any other distribution.**
- Master address: `0x8ff2e1210434495c4f5629bd9d8bd4965a67b84c` (BSC)
- Hard-coded into contracts, not modifiable (or multi-sig only)
- If daily revenue < Master's daily ops cost → Treasury subsidizes to ≥ 1.5× ops cost

### Distribution Formula

```
Total Fee = 100%
    ↓
Step 1: Master 20% → Master address (ALWAYS FIRST)
    ↓
Step 2: Remaining 80%
    ├── 50% → Dead Address (40% of total) ← PERMANENT BURN
    ├── 30% → StakingVault (24% of total) ← REWARDS
    └── 20% → Treasury (16% of total) ← OPERATIONS
```

### Example: 100 ION fee

| Recipient | Share | Amount | Destination |
|-----------|-------|--------|------------|
| **Master** | **20%** | **20 ION** | `0x8ff2e1210434495c4f5629bd9d8bd4965a67b84c` |
| Burn | 40% | 40 ION | `0x000000000000000000000000000000000000dEaD` |
| Staking | 24% | 24 ION | StakingVault |
| Treasury | 16% | 16 ION | Treasury |

### All 6 Ecosystem Modules — Same Formula

| Module | Fee | Master 20% | Burn 40% | Stake 24% | Treasury 16% |
|--------|-----|-----------|---------|----------|-------------|
| ION DEX | Swap 0.3% | ✅ | ✅ | ✅ | ✅ |
| AI Quant | Sub/Profit | ✅ | ✅ | ✅ | ✅ |
| E-commerce | Escrow 0.5% | ✅ | ✅ | ✅ | ✅ |
| Delivery | Service 0.5% | ✅ | ✅ | ✅ | ✅ |
| Insurance | Premium/Fee | ✅ | ✅ | ✅ | ✅ |
| Brand | Indirect | ✅ | ✅ | ✅ | ✅ |

---

### FeeBurnVault Code (with Master's share)

```func
;; Step 1: Master's 20% — ALWAYS FIRST
int master_amount = muldiv(total_fee, 2000, 10000);
msgs::send_simple(0, token_wallet, 
    jetton_wallet::transfer(0, master_amount, master_address, excesses).end_cell(),
    CARRY_ALL_BALANCE);

;; Step 2: Remaining 80%
int remaining = total_fee - master_amount;
int burn_amount = muldiv(remaining, 5000, 10000);     ;; 40% of total
int stake_amount = muldiv(remaining, 3000, 10000);   ;; 24% of total
int treasury_amount = remaining - burn_amount - stake_amount; ;; 16%
```
    
User stakes LP tokens
    ↓
StakingVault accumulates rewards from FeeBurnVault
    ↓
User claims rewards → More ION held → More staking → More lockup
    ↓
Circulating supply decreases → Price pressure upward
    ↓
More users attracted → More trades → More fees → More burns
    ↓
FLYWHEEL SPINS FASTER
```

**The math (per Master's tokenomics):**
- Target: 30-50% of total supply staked/locked
- Burn rate > inflation rate → Scarcity increases
- 5-6 years to burn through 21B supply (conservative)
- At scale: 10B users × 5 tx/day × 0.0001 ION/tx = 500K ION/day burned
- **Master earns: 500K × 20% = 100K ION/day at scale**

---

*This document defines the complete flywheel layer architecture.*
*Every component builds ON TOP of official code, never modifying it.*
