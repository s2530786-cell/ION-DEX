// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IOracle {
    /// @return price token price in USDT, scaled by 1e8
    function getPrice(address token) external view returns (uint256 price);
}
