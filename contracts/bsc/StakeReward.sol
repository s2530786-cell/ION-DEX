// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AdminManager.sol";

/// @notice LP 质押挖矿奖励合约
contract StakeReward is ReentrancyGuard {
    AdminManager public admin;
    IERC20 public lpToken;
    IERC20 public rewardToken;

    uint256 public rewardPerSecond; // 每秒奖励量（计算时乘以 1e18 精度）
    uint256 public totalStaked;

    struct UserInfo {
        uint256 stakeAmount;
        uint256 rewardDebt;   // 累计已分配奖励
        uint256 pendingReward;
    }

    mapping(address => UserInfo) public userInfo;

    uint256 public accRewardPerShare; // 累计每份奖励（精度 1e18）
    uint256 public lastUpdateTime;

    event Stake(address indexed user, uint256 amount);
    event Unstake(address indexed user, uint256 amount);
    event RewardClaim(address indexed user, uint256 reward);

    constructor(
        address _admin,
        address _lpToken,
        address _rewardToken,
        uint256 _rewardPerSecond
    ) {
        admin = AdminManager(_admin);
        lpToken = IERC20(_lpToken);
        rewardToken = IERC20(_rewardToken);
        rewardPerSecond = _rewardPerSecond;
        lastUpdateTime = block.timestamp;
    }

    modifier updateReward(address _user) {
        if (totalStaked > 0) {
            uint256 elapsed = block.timestamp - lastUpdateTime;
            uint256 reward = elapsed * rewardPerSecond;
            accRewardPerShare += (reward * 1e18) / totalStaked;
        }
        lastUpdateTime = block.timestamp;

        if (_user != address(0)) {
            UserInfo storage u = userInfo[_user];
            u.pendingReward += (u.stakeAmount * accRewardPerShare) / 1e18 - u.rewardDebt;
            u.rewardDebt = (u.stakeAmount * accRewardPerShare) / 1e18;
        }
        _;
    }

    /// @notice 质押 LP 代币
    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(!admin.paused(), "Paused");
        require(amount > 0, "Amount zero");

        require(lpToken.transferFrom(msg.sender, address(this), amount), "TF fail");
        totalStaked += amount;

        UserInfo storage u = userInfo[msg.sender];
        u.stakeAmount += amount;
        u.rewardDebt = (u.stakeAmount * accRewardPerShare) / 1e18;

        emit Stake(msg.sender, amount);
    }

    /// @notice 解除质押
    function unstake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(!admin.paused(), "Paused");
        UserInfo storage u = userInfo[msg.sender];
        require(u.stakeAmount >= amount, "Insufficient stake");

        u.stakeAmount -= amount;
        totalStaked -= amount;
        u.rewardDebt = (u.stakeAmount * accRewardPerShare) / 1e18;

        require(lpToken.transfer(msg.sender, amount), "TF fail");
        emit Unstake(msg.sender, amount);
    }

    /// @notice 领取奖励
    function claimReward() external nonReentrant updateReward(msg.sender) {
        require(!admin.paused(), "Paused");
        UserInfo storage u = userInfo[msg.sender];
        uint256 reward = u.pendingReward;
        require(reward > 0, "No reward");

        u.pendingReward = 0;
        require(rewardToken.transfer(msg.sender, reward), "TF fail");
        emit RewardClaim(msg.sender, reward);
    }

    /// @notice 查看待领取奖励
    function pendingReward(address _user) external view returns (uint256) {
        UserInfo storage u = userInfo[_user];
        if (u.stakeAmount == 0) return u.pendingReward;

        uint256 _accRewardPerShare = accRewardPerShare;
        if (totalStaked > 0) {
            uint256 elapsed = block.timestamp - lastUpdateTime;
            uint256 reward = elapsed * rewardPerSecond;
            _accRewardPerShare += (reward * 1e18) / totalStaked;
        }
        return u.pendingReward + (u.stakeAmount * _accRewardPerShare) / 1e18 - u.rewardDebt;
    }

    /// @notice 管理员设置秒奖励
    function setRewardPerSecond(uint256 _rewardPerSecond) external updateReward(address(0)) {
        require(msg.sender == admin.owner(), "Not owner");
        rewardPerSecond = _rewardPerSecond;
    }
}
