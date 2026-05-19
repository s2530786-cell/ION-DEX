// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title BSCFeeVault
 * @notice Accumulates ION-denominated protocol fees on BSC and distributes 35/25/20/15/5.
 * @dev PancakeSwap router is the canonical swap entry for fee-token routing audits.
 */
contract BSCFeeVault is Ownable2Step, Pausable, ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    address public constant PANCAKE_ROUTER = 0x10ED43C718714eb63d5aA57B78B54704E256024E;
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    uint256 public constant BPS_BURN = 3500;
    uint256 public constant BPS_TEAM = 2500;
    uint256 public constant BPS_STAKING = 2000;
    uint256 public constant BPS_TREASURY = 1500;
    uint256 public constant BPS_OPS = 500;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    bytes32 private constant DISTRIBUTE_TYPEHASH =
        keccak256("DistributeFees(uint256 nonce,uint256 deadline)");

    IERC20 public immutable ionToken;

    address public teamWallet;
    address public stakingWallet;
    address public treasuryWallet;
    address public operationsWallet;
    address public feeRouter;

    uint256 public threshold;
    uint256 public accruedFees;
    uint256 public totalDistributed;
    uint256 public distributeNonce;

    mapping(address => bool) public isSigner;
    address[] public signers;

    event IonFeeDeposited(address indexed from, uint256 amount, uint256 accruedFees);
    event FeesDistributed(
        uint256 gross,
        uint256 burned,
        uint256 team,
        uint256 staking,
        uint256 treasury,
        uint256 operations
    );
    event SignersUpdated(address[] signers, uint256 threshold);
    event FeeWalletsUpdated(
        address teamWallet,
        address stakingWallet,
        address treasuryWallet,
        address operationsWallet,
        address feeRouter
    );

    error ZeroAddress();
    error InvalidThreshold();
    error NothingToDistribute();
    error InvalidDeadline(uint256 deadline);
    error InsufficientSignatures(uint256 required, uint256 provided);
    error NotAuthorized();

    constructor(
        address ionToken_,
        address teamWallet_,
        address stakingWallet_,
        address treasuryWallet_,
        address operationsWallet_,
        address feeRouter_,
        address[] memory initialSigners_,
        uint256 threshold_
    ) EIP712("BSCFeeVault", "1") Ownable(msg.sender) {
        if (ionToken_ == address(0)) revert ZeroAddress();
        ionToken = IERC20(ionToken_);
        _setWallets(teamWallet_, stakingWallet_, treasuryWallet_, operationsWallet_, feeRouter_);
        _setSigners(initialSigners_, threshold_);
    }

    function depositIonFee(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) {
            return;
        }
        ionToken.safeTransferFrom(msg.sender, address(this), amount);
        accruedFees += amount;
        emit IonFeeDeposited(msg.sender, amount, accruedFees);
    }

    function distributeFees() external nonReentrant whenNotPaused {
        if (!_canDistribute(msg.sender)) revert NotAuthorized();
        _distribute(accruedFees);
    }

    function distributeFeesWithSignatures(uint256 deadline, bytes[] calldata signatures)
        external
        nonReentrant
        whenNotPaused
    {
        if (block.timestamp > deadline) revert InvalidDeadline(deadline);
        uint256 amount = accruedFees;
        if (amount == 0) revert NothingToDistribute();

        uint256 nonce = distributeNonce;
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(DISTRIBUTE_TYPEHASH, nonce, deadline))
        );
        uint256 valid = _countValidSignatures(digest, signatures);
        if (valid < threshold) revert InsufficientSignatures(threshold, valid);

        distributeNonce = nonce + 1;
        _distribute(amount);
    }

    function setFeeWallets(
        address teamWallet_,
        address stakingWallet_,
        address treasuryWallet_,
        address operationsWallet_,
        address feeRouter_
    ) external onlyOwner {
        _setWallets(teamWallet_, stakingWallet_, treasuryWallet_, operationsWallet_, feeRouter_);
    }

    function setSigners(address[] calldata newSigners, uint256 threshold_) external onlyOwner {
        for (uint256 i = 0; i < signers.length; i++) {
            isSigner[signers[i]] = false;
        }
        delete signers;
        _setSigners(newSigners, threshold_);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function pancakeRouter() external pure returns (address) {
        return PANCAKE_ROUTER;
    }

    function _setWallets(
        address teamWallet_,
        address stakingWallet_,
        address treasuryWallet_,
        address operationsWallet_,
        address feeRouter_
    ) internal {
        if (
            teamWallet_ == address(0) || stakingWallet_ == address(0) || treasuryWallet_ == address(0)
                || operationsWallet_ == address(0) || feeRouter_ == address(0)
        ) {
            revert ZeroAddress();
        }
        teamWallet = teamWallet_;
        stakingWallet = stakingWallet_;
        treasuryWallet = treasuryWallet_;
        operationsWallet = operationsWallet_;
        feeRouter = feeRouter_;
        emit FeeWalletsUpdated(teamWallet, stakingWallet, treasuryWallet, operationsWallet, feeRouter);
    }

    function _setSigners(address[] memory newSigners, uint256 threshold_) internal {
        if (threshold_ == 0 || threshold_ > newSigners.length) revert InvalidThreshold();
        for (uint256 i = 0; i < newSigners.length; i++) {
            address signer = newSigners[i];
            if (signer == address(0)) revert ZeroAddress();
            if (!isSigner[signer]) {
                signers.push(signer);
            }
            isSigner[signer] = true;
        }
        threshold = threshold_;
        emit SignersUpdated(signers, threshold);
    }

    function _canDistribute(address caller) internal view returns (bool) {
        return caller == owner() || caller == feeRouter || isSigner[caller];
    }

    function _distribute(uint256 amount) internal {
        if (amount == 0) revert NothingToDistribute();

        uint256 burnAmount = (amount * BPS_BURN) / BPS_DENOMINATOR;
        uint256 teamAmount = (amount * BPS_TEAM) / BPS_DENOMINATOR;
        uint256 stakingAmount = (amount * BPS_STAKING) / BPS_DENOMINATOR;
        uint256 treasuryAmount = (amount * BPS_TREASURY) / BPS_DENOMINATOR;
        uint256 opsAmount = amount - burnAmount - teamAmount - stakingAmount - treasuryAmount;

        accruedFees = 0;
        totalDistributed += amount;

        if (burnAmount > 0) {
            ionToken.safeTransfer(BURN_ADDRESS, burnAmount);
        }
        if (teamAmount > 0) {
            ionToken.safeTransfer(teamWallet, teamAmount);
        }
        if (stakingAmount > 0) {
            ionToken.safeTransfer(stakingWallet, stakingAmount);
        }
        if (treasuryAmount > 0) {
            ionToken.safeTransfer(treasuryWallet, treasuryAmount);
        }
        if (opsAmount > 0) {
            ionToken.safeTransfer(operationsWallet, opsAmount);
        }

        emit FeesDistributed(amount, burnAmount, teamAmount, stakingAmount, treasuryAmount, opsAmount);
    }

    function _countValidSignatures(bytes32 digest, bytes[] calldata signatures)
        internal
        view
        returns (uint256 validCount)
    {
        address lastSigner = address(0);
        for (uint256 i = 0; i < signatures.length; i++) {
            address recovered = digest.recover(signatures[i]);
            if (!isSigner[recovered] || recovered <= lastSigner) {
                continue;
            }
            lastSigner = recovered;
            validCount++;
        }
    }
}
