// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AdminManager.sol";
import "./IonProtocolFeeLib.sol";

/// @notice LP 质押挖矿奖励合约
contract StakeReward is ReentrancyGuard {
    error IonDexZeroAmount();
    error IonDexInsufficientStake();
    error IonDexNoReward();
    error IonDexUnauthorized();

    AdminManager public admin;
    IERC20 public lpToken;
    IERC20 public rewardToken;
    address public feeReceiver;

    uint256 public rewardPerSecond;
    uint256 public totalStaked;
    uint256 public constant MIN_REWARD_PER_SECOND = 1; // 1 wei/s 防零奖励冻结

    struct UserInfo {
        uint256 stakeAmount;
        uint256 rewardDebt;
        uint256 pendingReward;
    }

    mapping(address => UserInfo) public userInfo;
    uint256 public accRewardPerShare;
    uint256 public lastUpdateTime;

    event Stake(address indexed user, uint256 amount);
    event Unstake(address indexed user, uint256 amount);
    event RewardClaim(address indexed user, uint256 reward);
    event RewardRateSet(uint256 oldRate, uint256 newRate);

    constructor(
        address _admin,
        address _lpToken,
        address _rewardToken,
        uint256 _rewardPerSecond
    ) {
        require(_rewardPerSecond >= MIN_REWARD_PER_SECOND, "Reward too low");
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
            uint256 accumulated = (u.stakeAmount * accRewardPerShare) / 1e18;
            if (accumulated > u.rewardDebt) {
                u.pendingReward += accumulated - u.rewardDebt;
            }
            u.rewardDebt = accumulated;
        }
        _;
    }

    function stake(uint256 amount, uint256 ionProtocolFee) external nonReentrant updateReward(msg.sender) {
        if (admin.paused()) revert IonDexUnauthorized();
        if (amount == 0) revert IonDexZeroAmount();

        IonProtocolFeeLib.collectIonFee(feeReceiver, address(this), msg.sender, ionProtocolFee);

        require(lpToken.transferFrom(msg.sender, address(this), amount), "TF fail");
        totalStaked += amount;

        UserInfo storage u = userInfo[msg.sender];
        u.stakeAmount += amount;
        u.rewardDebt = (u.stakeAmount * accRewardPerShare) / 1e18;

        emit Stake(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        if (admin.paused()) revert IonDexUnauthorized();
        UserInfo storage u = userInfo[msg.sender];
        if (u.stakeAmount < amount) revert IonDexInsufficientStake();

        u.stakeAmount -= amount;
        totalStaked -= amount;
        u.rewardDebt = (u.stakeAmount * accRewardPerShare) / 1e18;

        require(lpToken.transfer(msg.sender, amount), "TF fail");
        emit Unstake(msg.sender, amount);
    }

    function claimReward(uint256 ionProtocolFee) external nonReentrant updateReward(msg.sender) {
        if (admin.paused()) revert IonDexUnauthorized();
        IonProtocolFeeLib.collectIonFee(feeReceiver, address(this), msg.sender, ionProtocolFee);
        UserInfo storage u = userInfo[msg.sender];
        uint256 reward = u.pendingReward;
        if (reward == 0) revert IonDexNoReward();

        u.pendingReward = 0;
        require(rewardToken.transfer(msg.sender, reward), "TF fail");
        emit RewardClaim(msg.sender, reward);
    }

    function pendingReward(address _user) external view returns (uint256) {
        UserInfo storage u = userInfo[_user];
        if (u.stakeAmount == 0) return u.pendingReward;

        uint256 _accRewardPerShare = accRewardPerShare;
        if (totalStaked > 0) {
            uint256 elapsed = block.timestamp - lastUpdateTime;
            uint256 reward = elapsed * rewardPerSecond;
            _accRewardPerShare += (reward * 1e18) / totalStaked;
        }
        uint256 accumulated = (u.stakeAmount * _accRewardPerShare) / 1e18;
        uint256 pending = accumulated > u.rewardDebt ? accumulated - u.rewardDebt : 0;
        return u.pendingReward + pending;
    }

    function setRewardPerSecond(uint256 _rewardPerSecond) external updateReward(address(0)) {
        if (msg.sender != admin.owner()) revert IonDexUnauthorized();
        if (_rewardPerSecond < MIN_REWARD_PER_SECOND) revert IonDexZeroAmount();
        uint256 old = rewardPerSecond;
        rewardPerSecond = _rewardPerSecond;
        emit RewardRateSet(old, _rewardPerSecond);
    }

    function setFeeReceiver(address _feeReceiver) external {
        if (msg.sender != admin.owner()) revert IonDexUnauthorized();
        feeReceiver = _feeReceiver;
    }
}