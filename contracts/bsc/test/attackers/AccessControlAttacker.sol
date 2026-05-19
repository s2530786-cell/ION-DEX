// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVault {
    function pause() external;
}

contract AccessControlAttacker {
    IVault public vault;

    constructor(address _vault) {
        vault = IVault(_vault);
    }

    function attackPause() external {
        vault.pause();
    }
}
