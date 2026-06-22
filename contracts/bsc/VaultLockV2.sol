// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract VaultLockV2 is ReentrancyGuard {
    error IonDexZeroAddress();
    error IonDexZeroAmount();
    error IonDexInsufficientBalance();
    error IonDexLockActive();
    error IonDexTokenTransferFailed();
    error IonDexNoActiveLock();
    error IonDexUnauthorized();

    address public vaultAdmin;
    IERC20 public immutable ionToken;
    uint256 public lockDuration;

    struct LockPosition {
        uint256 amount;
        uint256 unlockTime;
        uint256 initialLockTime;
    }

    mapping(address => LockPosition) public positions;

    event Deposited(address indexed account, uint256 amount, uint256 unlockTime);
    event Withdrawn(address indexed account, uint256 amount);
    event LockDurationChanged(uint256 oldDuration, uint256 newDuration);

    constructor(address ionToken_, uint256 lockDuration_) {
        if (ionToken_ == address(0)) revert IonDexZeroAddress();
        vaultAdmin = msg.sender;
        ionToken = IERC20(ionToken_);
        lockDuration = lockDuration_;
    }

    function deposit(uint256 amount) external nonReentrant {
        if (amount == 0) revert IonDexZeroAmount();
        if (!ionToken.transferFrom(msg.sender, address(this), amount)) revert IonDexTokenTransferFailed();

        LockPosition storage pos = positions[msg.sender];
        pos.amount += amount;
        if (pos.unlockTime == 0 || block.timestamp >= pos.unlockTime) {
            pos.unlockTime = block.timestamp + lockDuration;
            pos.initialLockTime = block.timestamp;
        }

        emit Deposited(msg.sender, amount, pos.unlockTime);
    }

    function extendLock(uint256 additionalSeconds) external nonReentrant {
        LockPosition storage pos = positions[msg.sender];
        if (pos.amount == 0) revert IonDexNoActiveLock();
        if (additionalSeconds == 0) revert IonDexZeroAmount();
        pos.unlockTime += additionalSeconds;
    }

    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert IonDexZeroAmount();
        LockPosition storage pos = positions[msg.sender];
        if (pos.amount < amount) revert IonDexInsufficientBalance();
        if (block.timestamp < pos.unlockTime) revert IonDexLockActive();

        pos.amount -= amount;
        if (pos.amount == 0) { pos.unlockTime = 0; pos.initialLockTime = 0; }

        if (!ionToken.transfer(msg.sender, amount)) revert IonDexTokenTransferFailed();
        emit Withdrawn(msg.sender, amount);
    }

    function balanceOf(address account) external view returns (uint256) { return positions[account].amount; }

    function setLockDuration(uint256 newDuration) external {
        if (msg.sender != vaultAdmin) revert IonDexUnauthorized();
        uint256 old = lockDuration;
        lockDuration = newDuration;
        emit LockDurationChanged(old, newDuration);
    }
}