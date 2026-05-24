# ION DEX v2 — Test Cases
# ==================================================
# Tests validate all 13 contracts at source-code level.
# Run: powershell -File scripts/test-suite.ps1
#
# Alternatively, deploy to testnet and verify with:
#   fift -s test/test-{component}.fif

## ── 1. Pool Tests ──

### 1.1 Basic Swap
# Input: token0 -> token1 via op::swap
# Expected:
#   - amount_out calculated via amm::get_amount_out(amount_in, r_in, r_out, 9970, 10000)
#   - reserve0 increases by amount_in
#   - reserve1 decreases by amount_out
#   - amount_out >= min_out (slippage check)
#   - Fee: 0.3% of amount_in collected
#   - Fee sent to fee_distributor via op::distribute_fees

### 1.2 Swap with Zero Amount
# Input: amount_in = 0
# Expected: throw(error::invalid_amount)

### 1.3 Swap with Insufficient Liquidity
# Input: reserve_out = 0
# Expected: throw(error::insufficient_liquidity)

### 1.4 Swap Slippage Protection
# Input: amount_out < min_out
# Expected: throw(error::slippage)

### 1.5 Add Liquidity
# Input: amount0, amount1 via op::add_liquidity
# Expected:
#   - LP tokens minted based on pool share
#   - Reserve0 += amount0
#   - Reserve1 += amount1
#   - LP sent to user

### 1.6 Remove Liquidity
# Input: LP amount via op::remove_liquidity
# Expected:
#   - LP burned
#   - Reserve0 -= proportion * reserve0
#   - Reserve1 -= proportion * reserve1
#   - Tokens sent to user

### 1.7 Protocol Fee Extraction
# Input: Swap triggers protocol_fee = (r0+r1) * 5 / 10000
# Expected:
#   - Protocol fee sent to fee_distributor via op::distribute_fees
#   - Fee amount = (reserve0 + reserve1) * 5 / 10000

### 1.8 Invalid Workchain
# Input: Message from wrong workchain
# Expected: throw(error::wrong_workchain)

### 1.9 Invalid Opcode
# Input: Unknown opcode
# Expected: throw(error::wrong_op)

### 1.10 Pool Initialization
# Input: Deploy with status=1
# Expected: Swap operations blocked until status changes

## ── 2. Router Tests ──

### 2.1 Route Swap via Pool
# Input: op::route_swap with valid pool address
# Expected:
#   - Message forwarded to pool with op::swap
#   - CARRY_ALL_BALANCE flag set

### 2.2 Route Swap Invalid Pool
# Input: op::route_swap with unregistered pool
# Expected: throw(error::invalid_path)

### 2.3 Route Add Liquidity
# Input: op::route_add_liquidity with valid pool
# Expected:
#   - Message forwarded to pool with op::cb_add_liquidity
#   - User address forwarded as LP recipient

### 2.4 Register Pool (Owner Only)
# Input: op::deploy_pool
# Expected: Only owner can register pools
#   - Non-owner: throw(error::invalid_caller)

### 2.5 Pay to (Owner Only)
# Input: op::pay_to
# Expected: Only owner can initiate payments

### 2.6 Set Params (Owner Only)
# Input: op::set_params
# Expected: Only owner can update protocol_fee_bps
#   - fee_bps must be <= fee_denominator

### 2.7 Vault Pay To
# Input: op::vault_pay_to
# Expected: Forwards funds to recipient
#   - amount must be > 0

## ── 3. FeeDistributor Tests ──

### 3.1 Distribute Fees
# Input: op::distribute_fees with total_amount
# Expected:
#   - LP gets: total_amount * 5000 / 10000
#   - Treasury gets: total_amount * 1000 / 10000
#   - Insurance gets: remainder (total_amount - lp - treasury)
#   - Each > 0: send to respective recipient

### 3.2 Distribute with Zero Amount
# Input: total_amount = 0
# Expected: throw(error::invalid_amount)

### 3.3 Set Recipients (Owner Only)
# Input: op::set_recipients
# Expected: Only owner can change recipients and bps values
#   - Validate bps sum == 10000

### 3.4 Invalid BPS Total
# Input: bps that don't sum to 10000
# Expected: throw(error::fee_bps_invalid)

## ── 4. LP Account Tests ──

### 4.1 Direct Add Liquidity
# Input: op::direct_add_liquidity with amounts
# Expected:
#   - Tracked amounts increase
#   - Forward to pool via op::cb_add_liquidity
#   - State saved before message sent

### 4.2 Refund
# Input: op::cb_refund_me
# Expected:
#   - Current tracked amounts sent back to user
#   - Reset tracked amounts to 0
#   - State saved before message sent

## ── 5. LP Wallet Tests ──

### 5.1 Transfer
# Input: op::transfer
# Expected: Standard Jetton transfer
#   - Reduce sender balance
#   - Increase recipient balance
#   - Check total_supply consistency

### 5.2 Burn
# Input: op::burn
# Expected: Standard Jetton burn
#   - Reduce total_supply
#   - Reduce sender balance

### 5.3 Insufficient Balance
# Input: transfer with amount > balance
# Expected: throw(error::insufficient_balance)

## ── 6. Vault Tests ──

### 6.1 Deposit Referral Fee
# Input: op::deposit_ref_fee from router
# Expected:
#   - deposited_amount increases
#   - State saved BEFORE excess forwarded (reentrancy safe)

### 6.2 Withdraw Fee (Owner Only)
# Input: op::withdraw_fee from owner
# Expected:
#   - State reset BEFORE message sent (reentrancy safe)
#   - All deposited tokens sent to owner via router
#   - Contract destroyed if DESTROY_IF_ZERO

### 6.3 Insufficient Gas
# Input: Withdraw with insufficient gas
# Expected: throw(error::insufficient_gas)

## ── 7. Staking Pool Tests ──

### 7.1 Stake Deposit
# Input: op::stake_deposit with TON value
# Expected:
#   - total_staked increases
#   - User staked amount updated
#   - Deposit acknowledged to user

### 7.2 Stake Withdraw
# Input: op::stake_withdraw with amount
# Expected:
#   - total_staked decreases
#   - User staked amount updated
#   - Withdrawal sent to user

### 7.3 Withdraw Insufficient Stake
# Input: amount > user's staked
# Expected: throw(error::insufficient_stake)

### 7.4 Claim Rewards
# Input: op::stake_claim
# Expected:
#   - earned = staked * reward_per_token - reward_debt
#   - reward_balance decreases
#   - Reward sent to user

### 7.5 Fund Rewards (Owner Only)
# Input: op::stake_fund_rewards from owner
# Expected:
#   - reward_balance increases
#   - reward_per_token updated

## ── 8. Fee Split Validation ──

### 8.1 0.3% Total Fee
# Input: Swap with amount_in = 1000000
# Expected:
#   - fee = 1000000 * 30 / 10000 = 3000
#   - effective_in = 1000000 - 3000 = 997000
#   - (Or: amount_in_with_fee = 1000000 * 9970 / 10000 = 997000)
#   - Protocol fee = (r0+r1) * 5 / 10000

### 8.2 Fee Split: 50/15/10/25
# Input: fee_amount = 10000
# Expected:
#   - LP: 5000 (50%)
#   - Staking: 1500 (15%)
#   - Treasury: 1000 (10%)
#   - Developer: 2500 (25%)

## ── 9. Edge Cases ──

### 9.1 Empty Body
# Input: Empty message body
# Expected: throw(error::empty_not_allowed)

### 9.2 Bounced Message
# Input: Bounced message
# Expected: Ignored (return immediately)

### 9.3 Large Swap
# Input: amount_in > reserve_in
# Expected: Calculates amount_out correctly (may exceed reserve - use with caution)
#   - In practice: amount_in capped by pool capacity
