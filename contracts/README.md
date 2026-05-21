# ION DEX contracts layout

Canonical sources live in subfolders; filenames match the product contract list.

| Listed name | Path |
|-------------|------|
| `pool.fc` | `ion/pool.fc` |
| `router.fc` | `ion/router.fc` |
| `deployer.fc` | `ion/deployer.fc` |
| `sandwich.fc` | `ion/sandwich.fc` |
| `FeeDistributor.fc` | `ion/FeeDistributor.fc` |
| `BridgeInbox.fc` | `ion/BridgeInbox.fc` |
| `dns-resolver.fc` | `ion/dns-resolver.fc` |
| `dns-registrar.fc` | `ion/dns-registrar.fc` |
| `dns-auction.fc` | `ion/dns-auction.fc` |
| `staking-pool.fc` | `ion/staking-pool.fc` |
| `BSCVault.sol` | `bsc/BSCVault.sol` |
| `MockERC20.sol` | `bsc/MockERC20.sol` |
| `FeeReceiver.sol` | `bsc/FeeReceiver.sol` |
| `BridgeRelay.sol` | `bsc/BridgeRelay.sol` |

Shared FunC: `ion/common/common.fc`, `ion/common/gas.fc`. Legacy AMM cells: `ion/vault.fc`, `ion/lp_account.fc`, `ion/lp_wallet.fc`.

Foundry: `forge test -C contracts` (requires Foundry installed).
