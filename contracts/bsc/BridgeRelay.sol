// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {BridgeRelayV2} from "./BridgeRelayV2.sol";

/// @notice Backward-compatible alias that routes legacy deployments to the quorum-safe V2 implementation.
contract BridgeRelay is BridgeRelayV2 {
    constructor(address owner_, address vault_, uint8 quorum_) BridgeRelayV2(owner_, vault_, quorum_) {}
}
