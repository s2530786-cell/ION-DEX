# ION DEX v2 — Compile & Deploy Commands
# ==================================================

## Prerequisites
# - `func` compiler (FunC v0.4.4+)
# - `fift` interpreter
# - ION chain RPC access (https://api.mainnet.ice.io)
# - stdlib.fc from ION chain

## CI / automation (dry-run only)
# Linux CI:
#   bash scripts/setup-ion-toolchain.sh
#   source ~/.cache/ion-dex-toolchain/.ready
#   node scripts/verify-contracts.mjs
# Windows local dry-run:
#   powershell -File scripts/deploy-fift.ps1 -Network testnet -DryRun
# Manual deploy workflow (GitHub Actions):
#   .github/workflows/deploy-ion-testnet.yml  (workflow_dispatch, dry_run default true)

## Paths
STDLIB="D:/openclaw-data/workspace/ion-official/ion/crypto/smartcont/stdlib.fc"
PROJECT="D:\openclaw-tools\ion-dex-nuke\contracts\ion"
COMMON="$PROJECT/common"
BUILD="$PROJECT/build"
DEPLOY="$PROJECT/deploy"

## Compile All Contracts
S=fixed: stdlib path must use forward slashes for func.exe

powershell -Command "
`$env:HTTP_PROXY='http://127.0.0.1:7890'
`$env:HTTPS_PROXY='http://127.0.0.1:7890'
`$func = 'D:\openclaw-data\workspace\func.exe'
`$stdlib = 'D:/openclaw-data/workspace/ion-official/ion/crypto/smartcont/stdlib.fc'
`$build = 'D:\openclaw-tools\ion-dex-nuke\contracts\ion\build'
# Compile each contract separately
foreach (`$contract in @('pool.fc','router.fc','FeeDistributor.fc','lp_account.fc','lp_wallet.fc','vault.fc','staking-pool.fc','sandwich.fc','BridgeInbox.fc','deployer.fc','dns-auction.fc','dns-registrar.fc','dns-resolver.fc')) {
    `$out = `$contract -replace '\.fc$','.fif'
    Write-Host "Compiling `$contract -> `$out"
    `$result = & `$func -o "`$build/`$out" -SPA `$stdlib common/gas.fc common/common.fc `$contract 2>&1
    if (`$LASTEXITCODE -ne 0) {
        Write-Host "FAILED: `$contract" -ForegroundColor Red
        `$result
    } else {
        Write-Host "OK" -ForegroundColor Green
    }
}
"

## Deploy FeeDistributor
# State: owner, lp_recipient, treasury_recipient, insurance_recipient, lp_bps, treasury_bps, insurance_bps
# Send to FeeDistributor contract:
fift -s deploy/deploy.fif

## Deploy Pool (for each token pair)
# State: owner, token0, token1, fee_numer, fee_denom, reserve0=0, reserve1=0,
#         fee_distributor_addr, lp_wallet_code, router_addr, sandwich_guard_addr, status=1
# 
# Steps:
# 1. Deploy with zero reserves, status=1 (disabled)
# 2. Set LP wallet code
# 3. Enable pool (status=2)

## Deploy Router
# State: owner, fee_distributor_addr, sandwich_guard_addr, pool_dict={}, protocol_fee_bps=5

## Deploy Staking Pool
# State: owner, total_staked=0, reward_per_token=0, reward_balance=0, stake_dict={}

## Deploy Vault
# State: owner, token_addr, router_addr, deposited_amount=0

## Deploy supporting contracts
# sandwich_guard, lp_account, lp_wallet, BridgeInbox, deployer
# dns-auction, dns-registrar, dns-resolver

## Initialize Protocol
# 1. Send op::set_params to FeeDistributor to set recipients
#    - lp_bps=5000, treasury_bps=1000, insurance_bps=4000
# 2. Send op::set_params to Router to set protocol_fee_bps=5
# 3. Send op::set_params to Pool to set router, fee_distributor, sandwich_guard
# 4. Register pool in router (op::deploy_pool)
# 5. Configure vault with token address and router address

# Note: Insurance recipient handles Staking (15%) + Developer (25%) = 40%
# In future, deploy a dedicated fee splitter for insurance->{staking, dev}
