// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IonBurn as IonBurnV2} from "./IonBurn.sol";

/// @notice Backward-compatible alias kept only to avoid exposing a placeholder burn contract.
contract Burn is IonBurnV2 {
    constructor(
        address owner_,
        address ionToken_,
        address oracle_,
        uint256 bearThreshold_,
        uint256 bullThreshold_
    ) IonBurnV2(owner_, ionToken_, oracle_, bearThreshold_, bullThreshold_) {}
}
