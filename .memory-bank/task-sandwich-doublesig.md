# TASK: Sandwich Defense + Bridge Double-Signature

**Priority**: P0 (Zeus review blocker)
**Assigned**: Cursor (autonomous)
**Deadline**: Next commit cycle

---

## Task 6.1: pool.fc Sandwich Attack Defense

### Current State
`contracts/ion/pool.fc` (3240 bytes) — core AMM swap logic, has `min_out` parameter but no front-running mitigation.

### What to Implement

1. **Two-step commit-reveal swap** (anti-front-running):
   - User submits `commitSwap(hash(amount, minOut, deadline, nonce))` 
   - After N blocks (e.g., 2), user calls `revealSwap(amount, minOut, deadline, nonce)`
   - Contract verifies hash matches, executes swap within deadline
   - Prevents mempool observers from front-running

2. **Block-level slippage guard**:
   - Before swap execution, check `now() < deadline + 60` (60-second grace after deadline)
   - If `now() > deadline`, revert with `EXPIRED` error
   - If actual output < minOut, revert with `SLIPPAGE_EXCEEDED`

3. **Max single-swap size**:
   - Add `MAX_SWAP_PERCENT = 500` (5% of pool liquidity max per swap)
   - Reject swaps exceeding 5% of pool reserves
   - Prevents single-tx price manipulation

### Files to Modify
- `contracts/ion/pool.fc` — add commit/reveal flow + size limit
- `contracts/ion/op.fc` — add new op codes: `op::commit_swap()`, `op::reveal_swap()`
- `contracts/ion/errors.fc` — add: `error::swap_expired`, `error::swap_too_large`

### Acceptance
- [ ] `func -PA contracts/ion/pool.fc` compiles
- [ ] Commit-reveal prevents front-running in simulation
- [ ] Swaps >5% of pool rejected
- [ ] All existing tests still pass

---

## Task 6.2: Bridge Double-Signature Verification

### Current State
Bridge sends transfer with single-signature from user. Large transfers (>threshold) need validator co-signing for security.

### What to Implement

1. **BSC side** (Solidity):
   - `BSCFeeVault.sol`: add `requireBridgeSignature(amount)` modifier
   - For transfers > `DOUBLE_SIG_THRESHOLD` (default: $10,000 equivalent):
     - Require 2-of-3 validator signatures
     - Validators = configurable address set (governance-managed)
   - Store: `mapping(bytes32 => uint256) public sigCount;`
   - EIP-712 typed data for off-chain validator signing

2. **ION side** (FunC):
   - `contracts/ion/bridge.fc` or vault.fc: add validator set + threshold check
   - Incoming bridge messages > threshold: verify at least 2 validators signed
   - Validator pubkeys stored in contract dictionary

3. **Validator set management**:
   - `addValidator(address/pukey)` / `removeValidator(address/pubkey)` — governance only
   - `setDoubleSigThreshold(uint256)` — governance only
   - Event emission on validator set changes

### Files to Modify/Create
- `contracts/bsc/src/BSCFeeVault.sol` — add double-sig verification
- `contracts/bsc/src/interfaces/IBridgeValidator.sol` — validator interface (NEW)
- `contracts/ion/bridge.fc` or `vault.fc` — ION side double-sig check
- `contracts/ion/params.fc` — add validator config constants

### Acceptance
- [ ] BSC: `forge build` compiles with double-sig logic
- [ ] ION: `func -PA` compiles
- [ ] Transfers below threshold: single-sig OK
- [ ] Transfers above threshold: rejected without 2-of-3 signatures
- [ ] Validators can be added/removed by governance
- [ ] EIP-712 domain separator present
