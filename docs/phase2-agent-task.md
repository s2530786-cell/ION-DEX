# ION DEX Phase 2 Remaining — Agent Task Spec

## Context
- Project: `D:\openclaw-tools\ion-dex-nuke`
- Reference: `D:\openclaw-tools\dex-core-v2` (STON.fi V2)
- ION contracts already exist under `contracts/ion/` (common/, pool.fc, router.fc, vault.fc, lp_account.fc, lp_wallet.fc, deployer.fc, pool/pools/constant_product.fc, pool/pools/stableswap.fc, pool/storage.fc, pool/get.fc, pool/headers.fc, router/storage.fc, router/dex.fc, router/get.fc, router/utils.fc)
- BSC contracts under `contracts/bsc/` (IonWrapper.sol, BSCVault.sol) — compile fine with forge
- funcbox installed at `contracts/ion/node_modules/@ston-fi/funcbox`
- All contracts follow STON.fi V2 pragma/ctx/storage pattern

## Tasks

### Task 1: ION Staking Pool Contract
Create `contracts/ion/staking_pool.fc` with:
- Storage: staked_amount, reward_rate, last_update_time, admin_address, reward_token_address, lp_token_address
- Core functions:
  - stake(amount) — lock LP tokens, track user share
  - unstake(amount) — return LP tokens + accrued rewards
  - claim_rewards() — claim rewards without unstaking
  - update_rewards() — internal reward calculation
- Follow STON.fi V2 patterns exactly: `#pragma version >=0.4.4`, `ctx::init(...)`, `storage::load()/save()`, `throw_unless(error::X)`
- Use funcbox: `ctx`, `msgs`, `reserves`, standard library functions
- Gas values per `common/gas.fc` (already has gas constants)
- Operation codes: add if needed to `common/op.fc`

### Task 2: ION Contract Compilation Check
- Find or install FunC compiler for Windows
- Try to compile all .fc files under `contracts/ion/`
- Report which files compile clean, which have errors
- Fix any syntax/import errors found

### Task 3: Update CI Verification
- Edit `scripts/verify-full.cmd` to add:
  - Step 5: "BSC Contract verify (forge build + forge test)"
  - Step 6: "ION Contract verify (FunC compile check)" if compiler found
- Edit `.github/workflows/ion-dex-verify.yml` to add forge steps

## Acceptance Criteria
1. `contracts/ion/staking_pool.fc` exists with stake/unstake/claim/update logic
2. All ION .fc files pass syntax check (compile or lint)
3. `forge test` in contracts/bsc/ passes 13/13
4. `scripts/agent-verify.cmd` still passes all existing gates
5. CI workflow updated with contract steps
