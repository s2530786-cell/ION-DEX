// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {OrderBookV2} from "./OrderBookV2.sol";

/// @notice Legacy name preserved as a funded V2 order book to avoid exposing the unfunded transparent book.
contract OrderBook is OrderBookV2 {
    constructor(address admin_, address quoteToken_) OrderBookV2(admin_, quoteToken_) {}
}
