// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ISwapPool} from "../../bsc/IonSwapRouterV2.sol";

contract IonSwapPoolMock is ISwapPool {
    uint256 public fixedOutput;

    constructor(uint256 output_) {
        fixedOutput = output_;
    }

    function setFixedOutput(uint256 output_) external {
        fixedOutput = output_;
    }

    function swapExactIn(uint256, uint256, address) external view returns (uint256 amountOut) {
        return fixedOutput;
    }
}
