/**
 * Official ION cross-chain bridge semantics (product + ice-blockchain references).
 *
 * Sources:
 * - https://github.com/ice-blockchain/ice-swap — Bridge-Swap; `Bridge` forks TON-community bridge-solidity
 *   (ICE v2 BSC ↔ ICE v2 ION); `IONBridgeRouter` exposes mint/burn over IONSwap + Bridge.
 * - https://github.com/ice-blockchain/ice-swap/blob/master/documentation/IONBridgeRouter.md
 * - BSC ION ERC-20 (same asset, bridged representation): 0xe1ab61f7b093435204df32f5b3a405de55445ea8
 *
 * There is no separate "wION" token brand. Supply is fixed at 21.1B ION (never inflationary mint outside bridge rules).
 *
 * Direction ION → BSC (official):
 * 1. User confirms transfer on ION Chain (ION Wallet).
 * 2. On BSC, Bridge validators/oracles reach quorum and release/mint ION (ERC-20) to the user — "Get ION on BSC"
 *    via Bridge `voteForMinting` / router `mint`, not by calling burn on BSC during the ION-side step.
 *
 * Direction BSC → ION (official):
 * - Bridge burns BSC-side ION (ICE v2) and credits ION network after quorum (router: swap ICE v1→v2 then Bridge.burn).
 *
 * ION DEX draft `BSCVault` / `BridgeInbox` relayer paths are experimental and must not be labeled as wION burn.
 */

export const ION_TOTAL_SUPPLY_CAP = "21.1B";

export const OFFICIAL_BRIDGE_REPOS = {
  iceSwap: "https://github.com/ice-blockchain/ice-swap",
  bridgeSolidity: "https://github.com/ice-blockchain/bridge-solidity",
  ionNode: "https://github.com/ice-blockchain/ion",
} as const;

export const ION_BSC_ION_TOKEN_ADDRESS =
  "0xe1ab61f7b093435204df32f5b3a405de55445ea8" as const;

/** User-facing steps for ION → BSC aligned with bridge.ice.io style flow. */
export const ION_TO_BSC_STEPS = [
  "Confirm ION transfer on ION Chain (ION Wallet).",
  "After validators confirm, claim ION on BSC (MetaMask + Bridge mint signatures).",
] as const;

/** User-facing steps for BSC → ION (official Bridge burn path on EVM). */
export const BSC_TO_ION_STEPS = [
  "Lock or burn ION on BSC via official Bridge / router (not a separate wrapped ticker).",
  "Relayer quorum releases native ION on ION Chain.",
] as const;
