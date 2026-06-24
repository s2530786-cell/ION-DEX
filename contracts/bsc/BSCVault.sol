// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {IonProtocolFeeLib} from "./IonProtocolFeeLib.sol";

interface IERC20Vault {
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title BSCVault
 * @notice BSC-side vault: lock/release ION (or bridged asset) and LP position bookkeeping.
 * @dev Only owner or registered relayer may release. No placeholder balances — all amounts from transfers.
 */
contract BSCVault {
    using SafeCast for int256;

    error IonDexZeroAddress();
    error IonDexZeroAmount();
    error IonDexUnauthorized();
    error IonDexInsufficientLocked();
    error IonDexTokenTransferFailed();
    error IonDexTimelockActive(uint256 unlockTime);

    uint256 public constant TIMELOCK = 48 hours;

    address public owner;
    address public bridgeRelay;
    address public feeReceiver;

    mapping(address => bool) public relayers;
    mapping(address => mapping(address => uint256)) public lockedBalance;
    mapping(address => uint256) public lpShares;
    mapping(bytes32 => bool) public releaseConsumed;

    // ─── Timelock ────────────────────────────────────────────────────────
    struct PendingRelayer {
        address relayer;
        bool allowed;
        uint256 unlockTime;
    }
    PendingRelayer public pendingRelayer;

    event PendingRelayerScheduled(address indexed relayer, bool allowed, uint256 unlockTime);
    event PendingRelayerExecuted(address indexed relayer, bool allowed);
    event PendingRelayerCancelled();

    event Locked(address indexed user, address indexed token, uint256 amount, bytes32 ionRecipient);
    event Released(address indexed user, address indexed token, uint256 amount, bytes32 releaseId);
    event LpSharesUpdated(address indexed user, int256 deltaShares);
    event RelayerSet(address indexed relayer, bool allowed);

    modifier onlyOwner() {
        if (msg.sender != owner) revert IonDexUnauthorized();
        _;
    }

    modifier onlyRelayerOrOwner() {
        if (msg.sender != owner && !relayers[msg.sender]) revert IonDexUnauthorized();
        _;
    }

    constructor(address owner_) {
        if (owner_ == address(0)) revert IonDexZeroAddress();
        owner = owner_;
    }

    // ─── Non-timelocked setters ──────────────────────────────────────────

    function setBridgeRelay(address relay) external onlyOwner {
        if (relay == address(0)) revert IonDexZeroAddress();
        bridgeRelay = relay;
    }

    function setFeeReceiver(address feeReceiver_) external onlyOwner {
        if (feeReceiver_ == address(0)) revert IonDexZeroAddress();
        feeReceiver = feeReceiver_;
    }

    /// @notice Direct relayer setter (no timelock) — for test/deploy convenience only.
    function setRelayerDirect(address relayer, bool allowed) external onlyOwner {
        if (relayer == address(0)) revert IonDexZeroAddress();
        relayers[relayer] = allowed;
        emit RelayerSet(relayer, allowed);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert IonDexZeroAddress();
        owner = newOwner;
    }

    // ─── Timelocked relayer setter ───────────────────────────────────────

    function scheduleSetRelayer(address relayer, bool allowed) external onlyOwner {
        if (relayer == address(0)) revert IonDexZeroAddress();
        pendingRelayer.relayer = relayer;
        pendingRelayer.allowed = allowed;
        pendingRelayer.unlockTime = block.timestamp + TIMELOCK;
        emit PendingRelayerScheduled(relayer, allowed, pendingRelayer.unlockTime);
    }

    function executeSetRelayer() external onlyOwner {
        if (block.timestamp < pendingRelayer.unlockTime) revert IonDexTimelockActive(pendingRelayer.unlockTime);
        relayers[pendingRelayer.relayer] = pendingRelayer.allowed;
        emit RelayerSet(pendingRelayer.relayer, pendingRelayer.allowed);
        emit PendingRelayerExecuted(pendingRelayer.relayer, pendingRelayer.allowed);
        delete pendingRelayer;
    }

    function cancelSetRelayer() external onlyOwner {
        delete pendingRelayer;
        emit PendingRelayerCancelled();
    }

    /**
     * @notice Lock tokens on BSC pending ION-side credit (via bridge).
     */
    function lock(
        address token,
        uint256 amount,
        bytes32 ionRecipient,
        uint256 ionProtocolFee
    ) external {
        if (token == address(0)) revert IonDexZeroAddress();
        if (amount == 0) revert IonDexZeroAmount();
        if (ionRecipient == bytes32(0)) revert IonDexZeroAddress();
        IonProtocolFeeLib.collectIonFee(feeReceiver, address(this), msg.sender, ionProtocolFee);
        _safeTransferFrom(token, msg.sender, address(this), amount);
        lockedBalance[token][msg.sender] += amount;
        emit Locked(msg.sender, token, amount, ionRecipient);
    }

    /**
     * @notice Release locked tokens after verified bridge message (idempotent releaseId).
     */
    function release(
        address token,
        address user,
        uint256 amount,
        bytes32 releaseId
    ) external onlyRelayerOrOwner {
        if (token == address(0) || user == address(0)) revert IonDexZeroAddress();
        if (amount == 0) revert IonDexZeroAmount();
        if (releaseId == bytes32(0)) revert IonDexZeroAddress();
        if (releaseConsumed[releaseId]) revert IonDexUnauthorized();
        if (lockedBalance[token][user] < amount) revert IonDexInsufficientLocked();

        releaseConsumed[releaseId] = true;
        lockedBalance[token][user] -= amount;
        _safeTransfer(token, user, amount);
        emit Released(user, token, amount, releaseId);
    }

    function adjustLpShares(address user, int256 deltaShares) external onlyRelayerOrOwner {
        if (user == address(0)) revert IonDexZeroAddress();
        if (deltaShares > 0) {
            lpShares[user] += deltaShares.toUint256();
        } else if (deltaShares < 0) {
            if (deltaShares == type(int256).min) revert IonDexInsufficientLocked();
            uint256 dec = (-deltaShares).toUint256();
            if (lpShares[user] < dec) revert IonDexInsufficientLocked();
            lpShares[user] -= dec;
        }
        emit LpSharesUpdated(user, deltaShares);
    }

    function tokenBalance(address token) external view returns (uint256) {
        return IERC20Vault(token).balanceOf(address(this));
    }

    function _safeTransferFrom(address token, address from, address to, uint256 amount) private {
        _callOptionalReturn(token, abi.encodeWithSignature("transferFrom(address,address,uint256)", from, to, amount));
    }

    function _safeTransfer(address token, address to, uint256 amount) private {
        _callOptionalReturn(token, abi.encodeWithSignature("transfer(address,uint256)", to, amount));
    }

    function _callOptionalReturn(address token, bytes memory data) private {
        (bool success, bytes memory returndata) = token.call(data);
        if (!success || (returndata.length != 0 && !abi.decode(returndata, (bool)))) {
            revert IonDexTokenTransferFailed();
        }
    }
}
