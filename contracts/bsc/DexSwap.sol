// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {DexSwapV2} from "./DexSwapV2.sol";

/// @notice Legacy name preserved as a thin alias to the slippage-protected V2 implementation.
contract DexSwap is DexSwapV2 {
    constructor(address admin_, address lpPool_) DexSwapV2(admin_, lpPool_) {}
}
