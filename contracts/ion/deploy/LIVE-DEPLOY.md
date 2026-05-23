# ION DEX — Live deploy (operator manual)

CI **never** broadcasts transactions or submits RPC. Use this flow on a trusted machine after audit.

## Flow

| Step | Script | Output |
|------|--------|--------|
| 1. Preflight | `deploy-fift-live.mjs` | `deploy-live.generated.fif` (print-only) |
| 2. Plan | `deploy-fift-live-send.mjs` (`SEND_MODE=plan`) | `deploy/out/fee-distributor-state-init.boc` |
| 3. Send | `deploy-fift-live-send.mjs` (`SEND_MODE=send`) | + `deploy/out/fee-distributor-wallet-query.boc` |
| 4. Submit | Operator | lite-client / tonlib / RPC tool (manual) |

## GitHub Secrets

| Secret / env | Preflight | Plan | Send |
|--------------|-----------|------|------|
| `ION_DEPLOY_OWNER_ADDRESS` | yes | yes | yes |
| `ION_DEPLOY_LP_RECIPIENT` | yes | yes | yes |
| `ION_DEPLOY_TREASURY_RECIPIENT` | yes | yes | yes |
| `ION_DEPLOY_INSURANCE_RECIPIENT` | yes | yes | yes |
| `ION_DEPLOY_TOKEN0_ADDRESS` | yes | yes | yes |
| `ION_DEPLOY_TOKEN1_ADDRESS` | yes | yes | yes |
| `ION_DEPLOY_WALLET_BASE` | — | — | yes (path to `.pk`/`.addr`) |
| `ION_DEPLOY_WALLET_SEQNO` | — | — | yes |
| `ION_DEPLOY_KEY` | optional | optional | optional (prefer wallet files) |
| `ION_DEPLOY_RPC_URL` | optional | optional | optional (no auto-submit) |

Optional post-deploy wiring: `ION_DEPLOY_FEE_DISTRIBUTOR_ADDRESS`, `ION_DEPLOY_ROUTER_ADDRESS`, etc.

## Human confirmation

**Preflight:**

```text
YES I deploy to testnet
```

**Broadcast (plan or send):**

```text
YES BROADCAST to testnet
```

## Windows

```powershell
# 1) Preflight
$env:ION_DEPLOY_ALLOW_LIVE = '1'
# ... set all ION_DEPLOY_* addresses ...
powershell -File scripts/deploy-fift-live.ps1 -Network testnet

# 2) Plan — StateInit BoC only (requires build/FeeDistributor.fif)
$env:ION_DEPLOY_BROADCAST = '1'
powershell -File scripts/deploy-fift-live-send.ps1 -Network testnet -SendMode plan

# 3) Send — wallet-query BoC (after wallet created via ION new-wallet-v3.fif)
$env:ION_DEPLOY_WALLET_BASE = 'D:\secure\ion-deploy-wallet'
$env:ION_DEPLOY_WALLET_SEQNO = '42'
powershell -File scripts/deploy-fift-live-send.ps1 -Network testnet -SendMode send
```

## Node

```bash
export ION_DEPLOY_BROADCAST=1
export ION_DEPLOY_SEND_MODE=plan   # or send
export ION_DEPLOY_CONFIRM="YES BROADCAST to testnet"
# addresses + (for send) ION_DEPLOY_WALLET_BASE / ION_DEPLOY_WALLET_SEQNO
node scripts/deploy-fift-live-send.mjs
```

## Toolchain

- `func` compiled artifacts: `contracts/ion/build/FeeDistributor.fif` (and others)
- `fift` + `FIFTPATH` → ION `crypto/fift/lib` (`Asm.fif`, `TonUtil.fif`)
- Send mode also needs ION `crypto/smartcont/wallet-v3.fif` (`ION_SMARTCONT_DIR`)

## GitHub Actions

Workflow **ION DEX deploy (manual)** stays **preflight / dry-run only**. Broadcast refuses `CI=true` / `GITHUB_ACTIONS` unless `ION_DEPLOY_FORCE_BROADCAST=1` (not set in workflow).

## Fee bps defaults

`ION_DEPLOY_LP_BPS=5000`, `ION_DEPLOY_TREASURY_BPS=1000`, `ION_DEPLOY_INSURANCE_BPS=4000` (sum 10000).

Deploy amount default: `ION_DEPLOY_DEPLOY_GRAMS=500000000` (0.5 TON).

## Generated files (gitignored)

- `deploy-live.generated.fif`
- `deploy-live-params.generated.fif`
- `deploy/out/*.boc`

## Scope note

`deploy-live-send.fif` currently deploys **FeeDistributor** only. Router / Pool / Vault segments follow the same pattern after audit.
