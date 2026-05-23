// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

// [PREVIEW-ONLY] Burn contract — env placeholder; deploy when address is confirmed
contract IonBurn {
    // Placeholder: will handle ION burn mechanics from swap fees / manual burn
    address public burnAdmin;
    uint256 public totalBurned;

    event Burned(address indexed from, uint256 amount, string reason);
}
