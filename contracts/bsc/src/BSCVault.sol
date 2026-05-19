// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title BSCVault
 * @notice Multi-signature vault for ION DEX on BSC
 * @dev Features:
 *      - Multi-sig with configurable threshold
 *      - Timelock for large withdrawals
 *      - Daily withdrawal limits
 *      - EIP-712 typed signatures
 *      - Pausable for emergency
 */
contract BSCVault is AccessControlEnumerable, Pausable, ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @notice Type hash for withdrawal requests
    bytes32 private constant WITHDRAWAL_TYPEHASH = keccak256(
        "Withdrawal(address token,address to,uint256 amount,uint256 nonce,uint256 deadline)"
    );

    /// @notice Minimum number of signers required
    uint256 public threshold;

    /// @notice Timelock delay for withdrawals above threshold
    uint256 public timelockDelay;

    /// @notice Daily withdrawal limit
    uint256 public dailyLimit;

    /// @notice Per-caller nonces for EIP-712 replay protection
    mapping(address => uint256) public nonces;

    /// @notice Monotonic id for unique pending withdrawal slots
    uint256 public withdrawalNonce;

    /// @notice Withdrawal tracking
    uint256 public dailyWithdrawn;
    uint256 public lastWithdrawDay;

    /// @notice Pending withdrawals (timelocked)
    struct PendingWithdrawal {
        address token;
        address to;
        uint256 amount;
        uint256 unlockTime;
        bool executed;
    }
    mapping(bytes32 => PendingWithdrawal) public pendingWithdrawals;

    /// @notice Track nonce usage per withdrawal hash
    mapping(bytes32 => bool) public executedWithdrawals;

    event Deposit(address indexed token, address indexed from, uint256 amount);
    event WithdrawalRequested(bytes32 indexed withdrawalId, address token, address to, uint256 amount, uint256 unlockTime);
    event WithdrawalExecuted(bytes32 indexed withdrawalId, address token, address to, uint256 amount);
    event WithdrawalCancelled(bytes32 indexed withdrawalId);
    event SignersUpdated(address[] signers, uint256 newThreshold);
    event TimelockUpdated(uint256 newDelay);
    event DailyLimitUpdated(uint256 newLimit);

    error InvalidSignature();
    error InsufficientSignatures(uint256 required, uint256 provided);
    error WithdrawalExpired(uint256 deadline);
    error InvalidNonce();
    error Timelocked(uint256 unlockTime);
    error AlreadyExecuted(bytes32 withdrawalId);
    error DailyLimitExceeded(uint256 requested, uint256 limit);
    error ZeroAddress();
    error InvalidThreshold();
    error InvalidAmount();

    constructor(
        address[] memory _signers,
        uint256 _threshold,
        uint256 _timelockDelay,
        uint256 _dailyLimit
    ) EIP712("BSCVault", "1") {
        if (_signers.length == 0) revert ZeroAddress();
        if (_threshold == 0 || _threshold > _signers.length) revert InvalidThreshold();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        for (uint256 i = 0; i < _signers.length; i++) {
            if (_signers[i] == address(0)) revert ZeroAddress();
            _grantRole(SIGNER_ROLE, _signers[i]);
        }

        threshold = _threshold;
        timelockDelay = _timelockDelay;
        dailyLimit = _dailyLimit;
    }

    /**
     * @notice Deposit tokens into the vault
     */
    function deposit(address token, uint256 amount) external nonReentrant whenNotPaused {
        if (token == address(0)) revert ZeroAddress();
        if (amount == 0) return;

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit Deposit(token, msg.sender, amount);
    }

    /**
     * @notice Request a withdrawal with multi-sig signatures (EIP-712)
     * @param token Token address
     * @param to Recipient
     * @param amount Amount
     * @param deadline Expiry timestamp
     * @param signatures Array of EIP-712 signatures from signers
     */
    function requestWithdrawal(
        address token,
        address to,
        uint256 amount,
        uint256 deadline,
        bytes[] calldata signatures
    ) external nonReentrant whenNotPaused returns (bytes32) {
        if (token == address(0) || to == address(0)) revert ZeroAddress();
        if (amount == 0) revert InvalidAmount();
        if (block.timestamp > deadline) revert WithdrawalExpired(deadline);

        // Check daily limit
        uint256 today = block.timestamp / 1 days;
        if (today != lastWithdrawDay) {
            dailyWithdrawn = 0;
            lastWithdrawDay = today;
        }
        if (dailyLimit > 0 && dailyWithdrawn + amount > dailyLimit) {
            revert DailyLimitExceeded(amount, dailyLimit);
        }

        // Verify multi-sig
        uint256 sigCount = _verifySignatures(token, to, amount, deadline, signatures);
        if (sigCount < threshold) revert InsufficientSignatures(threshold, sigCount);

        uint256 reqNonce = withdrawalNonce++;
        bytes32 withdrawalId = keccak256(abi.encode(token, to, amount, deadline, reqNonce));
        if (executedWithdrawals[withdrawalId]) revert AlreadyExecuted(withdrawalId);
        if (pendingWithdrawals[withdrawalId].amount != 0) revert AlreadyExecuted(withdrawalId);

        // Timelock if amount exceeds threshold
        uint256 unlockTime = amount > dailyLimit / 2
            ? block.timestamp + timelockDelay
            : block.timestamp;

        pendingWithdrawals[withdrawalId] = PendingWithdrawal({
            token: token,
            to: to,
            amount: amount,
            unlockTime: unlockTime,
            executed: false
        });

        dailyWithdrawn += amount;

        emit WithdrawalRequested(withdrawalId, token, to, amount, unlockTime);
        return withdrawalId;
    }

    /**
     * @notice Execute a pending withdrawal (after timelock)
     */
    function executeWithdrawal(bytes32 withdrawalId) external nonReentrant whenNotPaused {
        PendingWithdrawal storage w = pendingWithdrawals[withdrawalId];
        if (w.executed) revert AlreadyExecuted(withdrawalId);
        if (w.amount == 0) revert();
        if (block.timestamp < w.unlockTime) revert Timelocked(w.unlockTime);

        w.executed = true;
        executedWithdrawals[withdrawalId] = true;

        IERC20(w.token).safeTransfer(w.to, w.amount);
        emit WithdrawalExecuted(withdrawalId, w.token, w.to, w.amount);
    }

    /**
     * @notice Cancel a pending withdrawal
     */
    function cancelWithdrawal(bytes32 withdrawalId) external onlyRole(ADMIN_ROLE) {
        PendingWithdrawal storage w = pendingWithdrawals[withdrawalId];
        if (w.executed) revert AlreadyExecuted(withdrawalId);
        if (w.amount == 0) revert();

        uint256 amount = w.amount;
        delete pendingWithdrawals[withdrawalId];
        dailyWithdrawn -= amount;

        emit WithdrawalCancelled(withdrawalId);
    }

    /**
     * @notice Verify EIP-712 signatures from signers
     */
    function _verifySignatures(
        address token,
        address to,
        uint256 amount,
        uint256 deadline,
        bytes[] calldata signatures
    ) internal returns (uint256) {
        bytes32 structHash = keccak256(
            abi.encode(
                WITHDRAWAL_TYPEHASH,
                token,
                to,
                amount,
                nonces[msg.sender]++,
                deadline
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        uint256 sigCount = 0;
        address[] memory seen = new address[](signatures.length);

        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = ECDSA.recover(digest, signatures[i]);

            if (!hasRole(SIGNER_ROLE, signer)) continue;

            // Check for duplicate signers
            bool duplicate = false;
            for (uint256 j = 0; j < sigCount; j++) {
                if (seen[j] == signer) {
                    duplicate = true;
                    break;
                }
            }
            if (duplicate) continue;

            seen[sigCount] = signer;
            sigCount++;

            if (sigCount >= threshold) break;
        }

        return sigCount;
    }

    // ── Admin functions ──────────────────────────────────────────

    function setThreshold(uint256 _threshold) external onlyRole(ADMIN_ROLE) {
        uint256 signerCount = getRoleMemberCount(SIGNER_ROLE);
        if (_threshold == 0 || _threshold > signerCount) revert InvalidThreshold();
        threshold = _threshold;
    }

    function setTimelockDelay(uint256 _delay) external onlyRole(ADMIN_ROLE) {
        timelockDelay = _delay;
        emit TimelockUpdated(_delay);
    }

    function setDailyLimit(uint256 _limit) external onlyRole(ADMIN_ROLE) {
        dailyLimit = _limit;
        emit DailyLimitUpdated(_limit);
    }

    function updateSigners(address[] calldata _signers, uint256 _threshold)
        external onlyRole(ADMIN_ROLE)
    {
        if (_threshold == 0 || _threshold > _signers.length) revert InvalidThreshold();

        // Revoke all current signers
        uint256 count = getRoleMemberCount(SIGNER_ROLE);
        for (uint256 i = 0; i < count; i++) {
            _revokeRole(SIGNER_ROLE, getRoleMember(SIGNER_ROLE, 0));
        }

        // Grant new signers
        for (uint256 i = 0; i < _signers.length; i++) {
            if (_signers[i] == address(0)) revert ZeroAddress();
            _grantRole(SIGNER_ROLE, _signers[i]);
        }

        threshold = _threshold;
        emit SignersUpdated(_signers, _threshold);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Recover ETH accidentally sent to contract
     */
    function recoverETH(address to) external onlyRole(ADMIN_ROLE) {
        if (to == address(0)) revert ZeroAddress();
        (bool ok, ) = payable(to).call{value: address(this).balance}("");
        require(ok, "ETH transfer failed");
    }
}
