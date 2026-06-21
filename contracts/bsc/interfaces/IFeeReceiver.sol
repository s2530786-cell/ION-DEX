// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IFeeReceiver {
    function collect(address token, uint256 amount) external;
    function distribute() external;
}
