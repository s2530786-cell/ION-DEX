// SPDX-License-Identifier: MIT
// forge-lint: disable-file(erc20-unchecked-transfer)
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice 分红池合约 — 收取手续费并分发给 LP 质押者
contract Dividend is Ownable, ReentrancyGuard {
    IERC20 public rewardToken;

    uint256 public totalShares;
    uint256 public accRewardPerShare;
    mapping(address => uint256) public shares;
    mapping(address => uint256) public rewardDebt;
    mapping(address => uint256) public pendingRewards;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Harvest(address indexed user, uint256 reward);

    constructor(address _rewardToken) Ownable(msg.sender) {
        rewardToken = IERC20(_rewardToken);
    }

    /// @notice 存入分红（管理员调用，如从交易手续费中收取）
    function depositReward(uint256 amount) external {
        require(amount > 0, "Amount zero");
        rewardToken.transferFrom(msg.sender, address(this), amount);

        if (totalShares > 0) {
            accRewardPerShare += (amount * 1e18) / totalShares;
        }
    }

    /// @notice 质押份额
    function stake(uint256 shareAmount) external nonReentrant {
        require(shareAmount > 0, "Amount zero");
        _updateReward(msg.sender);
        shares[msg.sender] += shareAmount;
        totalShares += shareAmount;
        emit Deposit(msg.sender, shareAmount);
    }

    /// @notice 赎回份额
    function unstake(uint256 shareAmount) external nonReentrant {
        require(shareAmount > 0 && shares[msg.sender] >= shareAmount, "Invalid");
        _updateReward(msg.sender);
        shares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;
        emit Withdraw(msg.sender, shareAmount);
    }

    /// @notice 领取分红
    function harvest() external nonReentrant {
        _updateReward(msg.sender);
        uint256 reward = pendingRewards[msg.sender];
        require(reward > 0, "No reward");
        pendingRewards[msg.sender] = 0;
        rewardToken.transfer(msg.sender, reward);
        emit Harvest(msg.sender, reward);
    }

    function _updateReward(address user) internal {
        uint256 pending = (shares[user] * accRewardPerShare) / 1e18 - rewardDebt[user];
        pendingRewards[user] += pending;
        rewardDebt[user] = (shares[user] * accRewardPerShare) / 1e18;
    }

    /// @notice 查看待领取分红
    function pendingReward(address user) external view returns (uint256) {
        uint256 pending = (shares[user] * accRewardPerShare) / 1e18 - rewardDebt[user];
        return pendingRewards[user] + pending;
    }
}
