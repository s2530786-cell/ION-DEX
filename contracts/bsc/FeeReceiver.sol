// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";

interface IBurn { function executeBurn(uint256 amount) external returns (uint256); }

/// @title FeeReceiver - revenue distribution. Master 25% first, then dynamic burn / staking / treasury.
/// @notice All revenue is collected in ION at the contract level.
contract FeeReceiver {
    address public constant MASTER = 0x8Ff2e1210434495C4F5629bD9d8bD4965a67b84C;

    uint256 public constant MASTER_BPS = 2500;   // 25%
    uint256 public constant STAKING_BPS = 2000;  // 20%
    uint256 public constant TREASURY_BPS = 1000; // 10%
    // remaining 45% routed to dynamic burn

    address public immutable ION;
    address public immutable stakingPool;
    address public immutable treasury;
    IBurn public immutable burner;

    event Collected(address indexed from, address token, uint256 amount);
    event Distributed(uint256 toMaster, uint256 toStaking, uint256 toTreasury, uint256 burned);

    constructor(address ion, address stakingPool_, address treasury_, address burner_) {
        ION = ion;
        stakingPool = stakingPool_;
        treasury = treasury_;
        burner = IBurn(burner_);
    }

    function collect(address token, uint256 amount) external {
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "COLLECT");
        emit Collected(msg.sender, token, amount);
    }

    /// @dev distributes accrued ION balance per the revenue model
    function distribute() external {
        uint256 bal = IERC20(ION).balanceOf(address(this));
        require(bal > 0, "NO_BALANCE");

        uint256 toMaster = (bal * MASTER_BPS) / 10000;
        uint256 toStaking = (bal * STAKING_BPS) / 10000;
        uint256 toTreasury = (bal * TREASURY_BPS) / 10000;
        uint256 toBurn = bal - toMaster - toStaking - toTreasury;

        require(IERC20(ION).transfer(MASTER, toMaster), "MASTER");
        require(IERC20(ION).transfer(stakingPool, toStaking), "STAKING");
        require(IERC20(ION).transfer(treasury, toTreasury), "TREASURY");

        IERC20(ION).approve(address(burner), toBurn);
        uint256 burned = burner.executeBurn(toBurn);

        emit Distributed(toMaster, toStaking, toTreasury, burned);
    }
}
