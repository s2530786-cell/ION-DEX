// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice 一键发币合约 — 任何人都可以创建标准 ERC20 代币
contract TokenIssuer {
    event TokenCreated(address indexed creator, address token, string name, string symbol, uint256 totalSupply);

    /// @notice 创建新的 ERC20 代币
    function createToken(
        string calldata name,
        string calldata symbol,
        uint256 totalSupply
    ) external returns (address) {
        SimpleToken token = new SimpleToken(name, symbol, totalSupply, msg.sender);
        emit TokenCreated(msg.sender, address(token), name, symbol, totalSupply);
        return address(token);
    }
}

/// @notice 简单的 ERC20 代币实现
contract SimpleToken is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        address owner
    ) ERC20(name, symbol) {
        _mint(owner, totalSupply);
    }
}
