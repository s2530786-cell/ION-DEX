// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";

/// @title StakeReward - 6 lock tiers with distinct APY, rewards paid in ION
contract StakeReward {
    address public immutable ION;

    // lockDays => apy (in basis points, e.g. 800 = 8%)
    mapping(uint256 => uint256) public apyOf;
    uint256[6] public tiers = [0, 7, 30, 90, 180, 365];

    struct Position {
        uint256 amount;
        uint256 apyBps;
        uint256 startTime;
        uint256 unlockTime;
        bool active;
    }
    mapping(address => Position[]) public positions;

    event Staked(address indexed user, uint256 idx, uint256 amount, uint256 lockDays, uint256 apyBps);
    event Unstaked(address indexed user, uint256 idx, uint256 amount, uint256 reward);
    event Claimed(address indexed user, uint256 idx, uint256 reward);

    constructor(address ion) {
        ION = ion;
        apyOf[0] = 800;     // Flexible 8%
        apyOf[7] = 1000;    // 7d 10%
        apyOf[30] = 1200;   // 30d 12%
        apyOf[90] = 1500;   // 90d 15%
        apyOf[180] = 2000;  // 180d 20%
        apyOf[365] = 3000;  // 365d 30%
    }

    function stake(uint256 amount, uint256 lockDays) external returns (uint256 idx) {
        uint256 apy = apyOf[lockDays];
        require(apy > 0 || lockDays == 0, "INVALID_TIER");
        require(amount > 0, "ZERO_AMOUNT");
        require(IERC20(ION).transferFrom(msg.sender, address(this), amount), "TRANSFER");

        idx = positions[msg.sender].length;
        positions[msg.sender].push(Position({
            amount: amount,
            apyBps: apyOf[lockDays],
            startTime: block.timestamp,
            unlockTime: block.timestamp + lockDays * 1 days,
            active: true
        }));
        emit Staked(msg.sender, idx, amount, lockDays, apyOf[lockDays]);
    }

    function pendingReward(address user, uint256 idx) public view returns (uint256) {
        Position memory p = positions[user][idx];
        if (!p.active) return 0;
        uint256 elapsed = block.timestamp - p.startTime;
        return (p.amount * p.apyBps * elapsed) / (10000 * 365 days);
    }

    function claimRewards(uint256 idx) external {
        uint256 reward = pendingReward(msg.sender, idx);
        require(reward > 0, "NO_REWARD");
        positions[msg.sender][idx].startTime = block.timestamp;
        require(IERC20(ION).transfer(msg.sender, reward), "REWARD_OUT");
        emit Claimed(msg.sender, idx, reward);
    }

    function unstake(uint256 idx) external {
        Position storage p = positions[msg.sender][idx];
        require(p.active, "INACTIVE");
        require(block.timestamp >= p.unlockTime, "LOCKED");
        uint256 reward = pendingReward(msg.sender, idx);
        uint256 amount = p.amount;
        p.active = false;
        p.amount = 0;
        require(IERC20(ION).transfer(msg.sender, amount + reward), "OUT");
        emit Unstaked(msg.sender, idx, amount, reward);
    }
}
