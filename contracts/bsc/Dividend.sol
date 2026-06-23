// SPDX-License-Identifier: MIT
// forge-lint: disable-file(erc20-unchecked-transfer)
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Dividend pool for distributing reward tokens to externally managed LP shares.
contract Dividend is Ownable, ReentrancyGuard {
    error IonDexUnauthorized();

    IERC20 public immutable rewardToken;
    address public shareManager;

    uint256 public totalShares;
    uint256 public accRewardPerShare;
    mapping(address => uint256) public shares;
    mapping(address => uint256) public rewardDebt;
    mapping(address => uint256) public pendingRewards;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Harvest(address indexed user, uint256 reward);
    event ShareManagerUpdated(address indexed manager);

    modifier onlyShareManager() {
        if (msg.sender != shareManager) revert IonDexUnauthorized();
        _;
    }

    constructor(address _rewardToken) Ownable(msg.sender) {
        require(_rewardToken != address(0), "Token zero");
        rewardToken = IERC20(_rewardToken);
        shareManager = msg.sender;
        emit ShareManagerUpdated(msg.sender);
    }

    function setShareManager(address manager) external onlyOwner {
        require(manager != address(0), "Manager zero");
        shareManager = manager;
        emit ShareManagerUpdated(manager);
    }

    function depositReward(uint256 amount) external {
        require(amount > 0, "Amount zero");
        require(rewardToken.transferFrom(msg.sender, address(this), amount), "TF fail");

        if (totalShares > 0) {
            accRewardPerShare += (amount * 1e18) / totalShares;
        }
    }

    function stakeFor(address user, uint256 shareAmount) external nonReentrant onlyShareManager {
        require(user != address(0), "User zero");
        require(shareAmount > 0, "Amount zero");
        _updateReward(user);
        shares[user] += shareAmount;
        totalShares += shareAmount;
        rewardDebt[user] = (shares[user] * accRewardPerShare) / 1e18;
        emit Deposit(user, shareAmount);
    }

    function unstakeFor(address user, uint256 shareAmount) external nonReentrant onlyShareManager {
        require(user != address(0), "User zero");
        require(shareAmount > 0 && shares[user] >= shareAmount, "Invalid");
        _updateReward(user);
        shares[user] -= shareAmount;
        totalShares -= shareAmount;
        rewardDebt[user] = (shares[user] * accRewardPerShare) / 1e18;
        emit Withdraw(user, shareAmount);
    }

    function stake(uint256) external pure {
        revert IonDexUnauthorized();
    }

    function unstake(uint256) external pure {
        revert IonDexUnauthorized();
    }

    function harvest() external nonReentrant {
        _updateReward(msg.sender);
        uint256 reward = pendingRewards[msg.sender];
        require(reward > 0, "No reward");
        pendingRewards[msg.sender] = 0;
        rewardDebt[msg.sender] = (shares[msg.sender] * accRewardPerShare) / 1e18;
        require(rewardToken.transfer(msg.sender, reward), "TF fail");
        emit Harvest(msg.sender, reward);
    }

    function _updateReward(address user) internal {
        uint256 accumulated = (shares[user] * accRewardPerShare) / 1e18;
        if (accumulated > rewardDebt[user]) {
            pendingRewards[user] += accumulated - rewardDebt[user];
        }
        rewardDebt[user] = accumulated;
    }

    function pendingReward(address user) external view returns (uint256) {
        uint256 accumulated = (shares[user] * accRewardPerShare) / 1e18;
        uint256 pending = accumulated > rewardDebt[user] ? accumulated - rewardDebt[user] : 0;
        return pendingRewards[user] + pending;
    }
}
