// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

// [PREVIEW-ONLY] Vault lock contract — env placeholder; deploy when address is confirmed
interface IVaultLock {
    function deposit(uint256 amount) external;

    function withdraw(uint256 amount) external;

    function balanceOf(address account) external view returns (uint256);
}

contract VaultLock is IVaultLock {
    address public vaultAdmin;
    mapping(address => uint256) public balances;

    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);

    function deposit(uint256 amount) external {
        balances[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        balances[msg.sender] -= amount;
        emit Withdrawn(msg.sender, amount);
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
}
