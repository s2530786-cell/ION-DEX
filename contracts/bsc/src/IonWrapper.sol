// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./interfaces/IBridgeValidator.sol";

/**
 * @title IonWrapper
 * @notice ERC20 wrapper for ION token on BSC (BEP-20 compatible)
 * @dev Bridge mint is operator-only; user burns require 2-of-N validator sigs above threshold.
 */
contract IonWrapper is ERC20, Ownable, Pausable, EIP712, IBridgeValidator {
    using ECDSA for bytes32;

    event Mint(address indexed to, uint256 amount, bytes32 indexed bridgeTxHash);
    event Burn(address indexed from, uint256 amount, bytes32 indexed bridgeTxHash);

    address public bridge;
    mapping(bytes32 => bool) public processedTxs;
    uint256 public mintCap;
    uint256 public totalBridged;

    address[] public validators;
    mapping(address => bool) public isValidator;
    uint256 public doubleSigThreshold;

    uint256 public constant MAX_VALIDATORS = 10;
    uint256 public constant REQUIRED_SIGNATURES = 2;

    bytes32 private constant BRIDGE_REQUEST_TYPEHASH = keccak256(
        "BridgeRequest(address sender,uint256 amount,uint256 deadline,uint256 nonce,bytes32 targetChain)"
    );
    bytes32 private constant TARGET_CHAIN_ION = keccak256("ION_MAINNET");
    bytes32 private constant TARGET_CHAIN_BSC = keccak256("BSC_MAINNET");

    error NotBridge();
    error TxAlreadyProcessed(bytes32 txHash);
    error ExceedsMintCap(uint256 requested, uint256 cap);
    error InvalidAmount();
    error InsufficientValidatorSignatures(uint256 required, uint256 provided);
    error InvalidDeadline(uint256 deadline);
    error ZeroAddress();
    error AlreadyValidator();
    error NotAValidator();
    error TooManyValidators();

    modifier onlyBridge() {
        if (msg.sender != bridge) revert NotBridge();
        _;
    }

    constructor(address _bridge, address _owner, uint256 _mintCap)
        ERC20("Wrapped ION", "wION")
        EIP712("IonWrapper", "1")
        Ownable(_owner)
    {
        bridge = _bridge;
        mintCap = _mintCap;
        doubleSigThreshold = 10_000 ether;
        _transferOwnership(_owner);
    }

    function mint(address to, uint256 amount, bytes32 bridgeTxHash) external onlyBridge whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        if (processedTxs[bridgeTxHash]) revert TxAlreadyProcessed(bridgeTxHash);
        if (mintCap > 0 && totalBridged + amount > mintCap) revert ExceedsMintCap(amount, mintCap);
        if (amount >= doubleSigThreshold) revert InsufficientValidatorSignatures(REQUIRED_SIGNATURES, 0);
        processedTxs[bridgeTxHash] = true;
        totalBridged += amount;
        _mint(to, amount);
        emit Mint(to, amount, bridgeTxHash);
    }

    /// @notice Large inbound mints (>= doubleSigThreshold) require 2-of-N validator EIP-712 signatures.
    function mint(
        address to,
        uint256 amount,
        bytes32 bridgeTxHash,
        uint256 deadline,
        uint256 nonce,
        bytes[] calldata validatorSigs
    ) external onlyBridge whenNotPaused {
        _mintWithSigs(to, amount, bridgeTxHash, deadline, nonce, validatorSigs);
    }

    function _mintWithSigs(
        address to,
        uint256 amount,
        bytes32 bridgeTxHash,
        uint256 deadline,
        uint256 nonce,
        bytes[] calldata validatorSigs
    ) internal {
        if (amount == 0) revert InvalidAmount();
        if (processedTxs[bridgeTxHash]) revert TxAlreadyProcessed(bridgeTxHash);
        if (mintCap > 0 && totalBridged + amount > mintCap) {
            revert ExceedsMintCap(amount, mintCap);
        }

        if (amount >= doubleSigThreshold) {
            if (block.timestamp > deadline) revert InvalidDeadline(deadline);
            bytes32 digest = _bridgeRequestDigest(to, amount, deadline, nonce, TARGET_CHAIN_BSC);
            uint256 valid = _countValidSignatures(digest, validatorSigs);
            if (valid < REQUIRED_SIGNATURES) {
                revert InsufficientValidatorSignatures(REQUIRED_SIGNATURES, valid);
            }
        }

        processedTxs[bridgeTxHash] = true;
        totalBridged += amount;
        _mint(to, amount);
        emit Mint(to, amount, bridgeTxHash);
    }

  /**
     * @notice Burn wION to initiate unlock on ION chain.
     * @param validatorSigs Required when amount >= doubleSigThreshold (EIP-712, 65 bytes each).
     */
    function burn(
        uint256 amount,
        bytes32 bridgeTxHash,
        uint256 deadline,
        uint256 nonce,
        bytes[] calldata validatorSigs
    ) external whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        if (processedTxs[bridgeTxHash]) revert TxAlreadyProcessed(bridgeTxHash);

        if (amount >= doubleSigThreshold) {
            if (block.timestamp > deadline) revert InvalidDeadline(deadline);
            bytes32 digest = _bridgeRequestDigest(msg.sender, amount, deadline, nonce, TARGET_CHAIN_ION);
            uint256 valid = _countValidSignatures(digest, validatorSigs);
            if (valid < REQUIRED_SIGNATURES) {
                revert InsufficientValidatorSignatures(REQUIRED_SIGNATURES, valid);
            }
        }

        processedTxs[bridgeTxHash] = true;
        totalBridged -= amount;
        _burn(msg.sender, amount);
        emit Burn(msg.sender, amount, bridgeTxHash);
    }

    function verifySignatures(bytes32 digest, bytes[] calldata signatures)
        external
        view
        returns (bool valid)
    {
        return _countValidSignatures(digest, signatures) >= REQUIRED_SIGNATURES;
    }

    function validatorCount() external view returns (uint256) {
        return validators.length;
    }

    function addValidator(address validator) external onlyOwner {
        if (validator == address(0)) revert ZeroAddress();
        if (isValidator[validator]) revert AlreadyValidator();
        if (validators.length >= MAX_VALIDATORS) revert TooManyValidators();
        validators.push(validator);
        isValidator[validator] = true;
        emit ValidatorAdded(validator);
    }

    function removeValidator(address validator) external onlyOwner {
        if (!isValidator[validator]) revert NotAValidator();
        for (uint256 i = 0; i < validators.length; i++) {
            if (validators[i] == validator) {
                validators[i] = validators[validators.length - 1];
                validators.pop();
                break;
            }
        }
        isValidator[validator] = false;
        emit ValidatorRemoved(validator);
    }

    function setDoubleSigThreshold(uint256 newThreshold) external onlyOwner {
        emit ThresholdUpdated(doubleSigThreshold, newThreshold);
        doubleSigThreshold = newThreshold;
    }

    function setBridge(address _bridge) external onlyOwner {
        bridge = _bridge;
    }

    function DOMAIN_SEPARATOR() public view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function setMintCap(uint256 _mintCap) external onlyOwner {
        mintCap = _mintCap;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _bridgeRequestDigest(
        address sender,
        uint256 amount,
        uint256 deadline,
        uint256 nonce,
        bytes32 targetChain
    ) internal view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(abi.encode(BRIDGE_REQUEST_TYPEHASH, sender, amount, deadline, nonce, targetChain))
        );
    }

    function _countValidSignatures(bytes32 digest, bytes[] calldata signatures)
        internal
        view
        returns (uint256 validCount)
    {
        address[] memory seen = new address[](signatures.length);
        uint256 seenLen;
        for (uint256 i = 0; i < signatures.length; i++) {
            address recovered = digest.recover(signatures[i]);
            if (!isValidator[recovered]) {
                continue;
            }
            bool dup;
            for (uint256 j = 0; j < seenLen; j++) {
                if (seen[j] == recovered) {
                    dup = true;
                    break;
                }
            }
            if (dup) {
                continue;
            }
            seen[seenLen++] = recovered;
            validCount++;
        }
    }
}
