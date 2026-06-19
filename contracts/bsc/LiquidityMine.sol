// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AdminManager.sol";
import "./IonProtocolFeeLib.sol";

/// @notice Multi-pool LP liquidity mining with block rewards paid in canonical BSC ION.
contract LiquidityMine is ReentrancyGuard {
    /// @dev Confirmed BSC ION — see docs/ion-official-canonical-addresses.md
    address public constant ION_TOKEN = 0xE1ab61f7b093435204dF32F5b3A405de55445Ea8;

    AdminManager public admin;
    address public feeReceiver;

    struct MinePool {
        IERC20 lpToken;
        uint256 rewardPerBlock;
        uint256 accRewardPerShare;
        uint256 lastRewardBlock;
        uint256 totalStaked;
        uint256 totalWeight;
        uint256 lockupDays;
        uint256 multiplier;
        uint256 aprBps;
        string name;
        string pairLabel;
        bool active;
    }

    struct UserMineInfo {
        uint256 amount;
        uint256 weight;
        uint256 rewardDebt;
        uint256 pendingReward;
        uint256 stakedAt;
    }

    uint256 public poolLength;
    mapping(uint256 => MinePool) public pools;
    mapping(uint256 => mapping(address => UserMineInfo)) public userInfo;

    event PoolAdded(uint256 indexed poolId, address lpToken, string name);
    event Stake(address indexed user, uint256 indexed poolId, uint256 amount);
    event Unstake(address indexed user, uint256 indexed poolId, uint256 amount);
    event RewardClaim(address indexed user, uint256 indexed poolId, uint256 reward);
    event EmergencyWithdraw(address indexed user, uint256 indexed poolId, uint256 amount);

    constructor(address _admin, address _feeReceiver) {
        admin = AdminManager(_admin);
        feeReceiver = _feeReceiver;
    }

    modifier whenNotPaused() {
        require(!admin.paused(), "Paused");
        _;
    }

    function addPool(
        address lpToken,
        uint256 rewardPerBlock,
        uint256 lockupDays,
        uint256 multiplier,
        uint256 aprBps,
        string calldata name,
        string calldata pairLabel
    ) external {
        require(msg.sender == admin.owner(), "Not owner");
        require(lpToken != address(0), "LP zero");
        require(multiplier > 0, "Multiplier zero");

        uint256 poolId = poolLength;
        pools[poolId] = MinePool({
            lpToken: IERC20(lpToken),
            rewardPerBlock: rewardPerBlock,
            accRewardPerShare: 0,
            lastRewardBlock: block.number,
            totalStaked: 0,
            totalWeight: 0,
            lockupDays: lockupDays,
            multiplier: multiplier,
            aprBps: aprBps,
            name: name,
            pairLabel: pairLabel,
            active: true
        });
        poolLength += 1;
        emit PoolAdded(poolId, lpToken, name);
    }

    function _updatePool(uint256 poolId) internal {
        MinePool storage pool = pools[poolId];
        if (!pool.active || pool.totalWeight == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }

        uint256 blocksElapsed = block.number - pool.lastRewardBlock;
        if (blocksElapsed == 0) {
            return;
        }

        uint256 reward = blocksElapsed * pool.rewardPerBlock;
        pool.accRewardPerShare += (reward * 1e18) / pool.totalWeight;
        pool.lastRewardBlock = block.number;
    }

    function _harvestUser(uint256 poolId, address account) internal {
        if (account == address(0)) {
            return;
        }
        MinePool storage pool = pools[poolId];
        UserMineInfo storage user = userInfo[poolId][account];
        if (user.weight == 0) {
            return;
        }
        uint256 accumulated = (user.weight * pool.accRewardPerShare) / 1e18;
        if (accumulated > user.rewardDebt) {
            user.pendingReward += accumulated - user.rewardDebt;
        }
        user.rewardDebt = accumulated;
    }

    modifier updatePool(uint256 poolId, address account) {
        _updatePool(poolId);
        _harvestUser(poolId, account);
        _;
    }

    function stake(uint256 poolId, uint256 amount, uint256 ionProtocolFee)
        external
        nonReentrant
        whenNotPaused
        updatePool(poolId, msg.sender)
    {
        require(poolId < poolLength, "Invalid pool");
        require(amount > 0, "Amount zero");
        MinePool storage pool = pools[poolId];
        require(pool.active, "Pool inactive");

        IonProtocolFeeLib.collectIonFee(feeReceiver, address(this), msg.sender, ionProtocolFee);

        require(pool.lpToken.transferFrom(msg.sender, address(this), amount), "TF fail");

        UserMineInfo storage user = userInfo[poolId][msg.sender];
        if (user.amount == 0) {
            user.stakedAt = block.timestamp;
        }

        uint256 addedWeight = (amount * pool.multiplier) / 10_000;
        user.amount += amount;
        user.weight += addedWeight;
        pool.totalStaked += amount;
        pool.totalWeight += addedWeight;
        user.rewardDebt = (user.weight * pool.accRewardPerShare) / 1e18;

        emit Stake(msg.sender, poolId, amount);
    }

    function unstake(uint256 poolId, uint256 amount)
        external
        nonReentrant
        whenNotPaused
        updatePool(poolId, msg.sender)
    {
        require(poolId < poolLength, "Invalid pool");
        require(amount > 0, "Amount zero");
        MinePool storage pool = pools[poolId];
        UserMineInfo storage user = userInfo[poolId][msg.sender];
        require(user.amount >= amount, "Insufficient stake");
        require(block.timestamp >= user.stakedAt + pool.lockupDays * 1 days, "Lockup active");

        uint256 removedWeight = (amount * pool.multiplier) / 10_000;
        user.amount -= amount;
        user.weight -= removedWeight;
        pool.totalStaked -= amount;
        pool.totalWeight -= removedWeight;
        user.rewardDebt = (user.weight * pool.accRewardPerShare) / 1e18;

        require(pool.lpToken.transfer(msg.sender, amount), "TF fail");
        emit Unstake(msg.sender, poolId, amount);
    }

    function claimReward(uint256 poolId, uint256 ionProtocolFee)
        external
        nonReentrant
        whenNotPaused
        updatePool(poolId, msg.sender)
    {
        require(poolId < poolLength, "Invalid pool");
        IonProtocolFeeLib.collectIonFee(feeReceiver, address(this), msg.sender, ionProtocolFee);

        UserMineInfo storage user = userInfo[poolId][msg.sender];
        uint256 reward = user.pendingReward;
        require(reward > 0, "No reward");
        user.pendingReward = 0;

        require(IERC20(ION_TOKEN).transfer(msg.sender, reward), "Reward TF fail");
        emit RewardClaim(msg.sender, poolId, reward);
    }

    function emergencyWithdraw(uint256 poolId) external nonReentrant whenNotPaused updatePool(poolId, msg.sender) {
        require(poolId < poolLength, "Invalid pool");
        MinePool storage pool = pools[poolId];
        UserMineInfo storage user = userInfo[poolId][msg.sender];
        uint256 amount = user.amount;
        require(amount > 0, "Nothing staked");

        pool.totalStaked -= amount;
        pool.totalWeight -= user.weight;
        user.pendingReward = 0;
        user.amount = 0;
        user.weight = 0;
        user.rewardDebt = 0;

        require(pool.lpToken.transfer(msg.sender, amount), "TF fail");
        emit EmergencyWithdraw(msg.sender, poolId, amount);
    }

    function pendingReward(uint256 poolId, address account) external view returns (uint256) {
        if (poolId >= poolLength) {
            return 0;
        }
        MinePool storage pool = pools[poolId];
        UserMineInfo storage user = userInfo[poolId][account];
        if (user.weight == 0) {
            return user.pendingReward;
        }

        uint256 acc = pool.accRewardPerShare;
        if (pool.totalWeight > 0 && pool.active) {
            uint256 blocksElapsed = block.number - pool.lastRewardBlock;
            uint256 reward = blocksElapsed * pool.rewardPerBlock;
            acc += (reward * 1e18) / pool.totalWeight;
        }
        return user.pendingReward + (user.weight * acc) / 1e18 - user.rewardDebt;
    }

    function getPoolInfo(uint256 poolId)
        external
        view
        returns (
            address lpToken,
            uint256 rewardPerBlock,
            uint256 totalStaked,
            uint256 lockupDays,
            uint256 multiplier,
            uint256 aprBps,
            string memory name,
            string memory pairLabel,
            bool active
        )
    {
        require(poolId < poolLength, "Invalid pool");
        MinePool storage pool = pools[poolId];
        return (
            address(pool.lpToken),
            pool.rewardPerBlock,
            pool.totalStaked,
            pool.lockupDays,
            pool.multiplier,
            pool.aprBps,
            pool.name,
            pool.pairLabel,
            pool.active
        );
    }

    function getUserInfo(uint256 poolId, address account)
        external
        view
        returns (uint256 amount, uint256 weight, uint256 pending, uint256 stakedAt, bool lockupActive)
    {
        require(poolId < poolLength, "Invalid pool");
        MinePool storage pool = pools[poolId];
        UserMineInfo storage user = userInfo[poolId][account];
        pending = this.pendingReward(poolId, account);
        lockupActive = user.amount > 0 && _currentTime() < user.stakedAt + pool.lockupDays * 1 days;
        return (user.amount, user.weight, pending, user.stakedAt, lockupActive);
    }

    function _currentTime() internal view returns (uint256) {
        return block.timestamp;
    }

    function setRewardPerBlock(uint256 poolId, uint256 rewardPerBlock) external updatePool(poolId, address(0)) {
        require(msg.sender == admin.owner(), "Not owner");
        require(poolId < poolLength, "Invalid pool");
        pools[poolId].rewardPerBlock = rewardPerBlock;
    }

    function setFeeReceiver(address _feeReceiver) external {
        require(msg.sender == admin.owner(), "Not owner");
        feeReceiver = _feeReceiver;
    }
}
