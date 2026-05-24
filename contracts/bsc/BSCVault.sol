// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IonProtocolFeeLib} from "./IonProtocolFeeLib.sol";

interface IERC20Vault {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title BSCVault
 * @notice BSC-side vault: lock/release ION (or bridged asset) and LP position bookkeeping.
 * @dev Only owner or registered relayer may release. No placeholder balances — all amounts from transfers.
 */
contract BSCVault {
    error IonDexZeroAddress();
    error IonDexZeroAmount();
    error IonDexUnauthorized();
    error IonDexInsufficientLocked();
    error IonDexTokenTransferFailed();

    event Locked(address indexed user, address indexed token, uint256 amount, bytes32 ionRecipient);
    event Released(address indexed user, address indexed token, uint256 amount, bytes32 releaseId);
    event LpSharesUpdated(address indexed user, int256 deltaShares);
    event RelayerSet(address indexed relayer, bool allowed);

    address public owner;
    address public bridgeRelay;
    address public feeReceiver;

    mapping(address => bool) public relayers;
    mapping(address => mapping(address => uint256)) public lockedBalance;
    mapping(address => uint256) public lpShares;
    mapping(bytes32 => bool) public releaseConsumed;

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

    function setBridgeRelay(address relay) external onlyOwner {
        if (relay == address(0)) revert IonDexZeroAddress();
        bridgeRelay = relay;
    }

    function setRelayer(address relayer, bool allowed) external onlyOwner {
        if (relayer == address(0)) revert IonDexZeroAddress();
        relayers[relayer] = allowed;
        emit RelayerSet(relayer, allowed);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert IonDexZeroAddress();
        owner = newOwner;
    }

    function setFeeReceiver(address feeReceiver_) external onlyOwner {
        if (feeReceiver_ == address(0)) revert IonDexZeroAddress();
        feeReceiver = feeReceiver_;
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
        if (!_transferFrom(token, msg.sender, address(this), amount)) revert IonDexTokenTransferFailed();
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
        if (!_transfer(token, user, amount)) revert IonDexTokenTransferFailed();
        emit Released(user, token, amount, releaseId);
    }

    function adjustLpShares(address user, int256 deltaShares) external onlyRelayerOrOwner {
        if (user == address(0)) revert IonDexZeroAddress();
        if (deltaShares > 0) {
            // forge-lint: disable-next-line(unsafe-typecast)
            lpShares[user] += uint256(deltaShares);
        } else if (deltaShares < 0) {
            // forge-lint: disable-next-line(unsafe-typecast)
            uint256 dec = uint256(-deltaShares);
            if (lpShares[user] < dec) revert IonDexInsufficientLocked();
            lpShares[user] -= dec;
        }
        emit LpSharesUpdated(user, deltaShares);
    }

    function tokenBalance(address token) external view returns (uint256) {
        return IERC20Vault(token).balanceOf(address(this));
    }

    function _transferFrom(address token, address from, address to, uint256 amount) private returns (bool) {
        return IERC20Vault(token).transferFrom(from, to, amount);
    }

    function _transfer(address token, address to, uint256 amount) private returns (bool) {
        return IERC20Vault(token).transfer(to, amount);
    }
}
