/**
 * Official ION + BSC burn semantics (product + ice-blockchain references).
 *
 * Sources:
 * - https://github.com/ice-blockchain/ion-address-book/blob/master/source/system.yaml
 *   → "Burn Address" UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ
 * - BSC ION ERC-20 balance at 0x000…dEaD (see officialIonAddresses.ts)
 * - https://api.mainnet.ice.io/http/v2/ — getAddressBalance for mainnet burn sink
 * - Bridge burn on BSC: ice-swap / bridge-solidity (cross-chain, not the BSC dead ledger)
 */

import {
  OFFICIAL_BSC_ION_BURN_ADDRESS,
  OFFICIAL_ION_MAINNET_BURN_ADDRESS,
  OFFICIAL_ION_MAX_SUPPLY_LABEL,
} from "@/lib/officialIonAddresses";

export const OFFICIAL_BURN_REPOS = {
  ionAddressBook: "https://github.com/ice-blockchain/ion-address-book",
  addressBookJson: "https://address-book.explorer.ice.io/addresses.json",
  ionHttpApi: "https://api.mainnet.ice.io/http/v2/",
  iceSwap: "https://github.com/ice-blockchain/ice-swap",
} as const;

export {
  OFFICIAL_BSC_ION_BURN_ADDRESS,
  OFFICIAL_ION_MAINNET_BURN_ADDRESS,
  OFFICIAL_ION_MAX_SUPPLY_LABEL,
};

/** Explorer-friendly label for the canonical mainnet burn sink. */
export const OFFICIAL_ION_MAINNET_BURN_NAME = "Burn Address";

/**
 * BSC: ERC-20 ION sitting on the dead address.
 * ION: native coin balance at the system Burn Address (nanoton → ION 9 decimals).
 */
export const BURN_ACCOUNTING_NOTES = {
  bsc: "Sum ION ERC-20 via balanceOf(official BSC dead address).",
  ion: "Read official Burn Address balance via ION HTTP API / indexer (not a guessed placeholder).",
} as const;

/** User-facing proof / attribution steps (analytics desk, not a burn transaction form). */
export const OFFICIAL_BURN_PROOF_STEPS = [
  `BSC: verify transfers to ${OFFICIAL_BSC_ION_BURN_ADDRESS.slice(0, 10)}…${OFFICIAL_BSC_ION_BURN_ADDRESS.slice(-4)} (ION ERC-20).`,
  `ION: verify native transfers to ${OFFICIAL_ION_MAINNET_BURN_NAME} (${OFFICIAL_ION_MAINNET_BURN_ADDRESS.slice(0, 6)}…${OFFICIAL_ION_MAINNET_BURN_ADDRESS.slice(-4)}).`,
  "Cross-chain Bridge burn is a separate flow — see Bridge desk / officialBridgeSemantics.",
] as const;

export const DEX_DRAFT_BURN_NOTE =
  "ION DEX BSC FeeReceiver fee-split burn is draft product tokenomics — not the ION mainnet Burn Address in ion-address-book.";
