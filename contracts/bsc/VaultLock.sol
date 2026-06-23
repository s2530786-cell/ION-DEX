// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Vault lock contract — time-locked ION custody with actual token transfers
contract VaultLock is ReentrancyGuard {
    error IonDexZeroAddress();
    error IonDexZeroAmount();
    error IonDexInsufficientBalance();
    error IonDexLockActive();
    error IonDexTokenTransferFailed();

    address public vaultAdmin;
    IERC20 public immutable ionToken;
    uint256 public lockDuration;

    struct LockPosition {
        uint256 amount;
        uint256 unlockTime;
    }

    mapping(address => LockPosition) public positions;

    event Deposited(address indexed account, uint256 amount, uint256 unlockTime);
    event Withdrawn(address indexed account, uint256 amount);

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
        pos.unlockTime = block.timestamp + lockDuration;

        emit Deposited(msg.sender, amount, pos.unlockTime);
    }

    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert IonDexZeroAmount();
        LockPosition storage pos = positions[msg.sender];
        if (pos.amount < amount) revert IonDexInsufficientBalance();
        if (block.timestamp < pos.unlockTime) revert IonDexLockActive();

        pos.amount -= amount;
        if (!ionToken.transfer(msg.sender, amount)) revert IonDexTokenTransferFailed();

        emit Withdrawn(msg.sender, amount);
    }

    function balanceOf(address account) external view returns (uint256) {
        return positions[account].amount;
    }

    function setLockDuration(uint256 newDuration) external {
        if (msg.sender != vaultAdmin) revert IonDexZeroAddress();
        lockDuration = newDuration;
    }
}