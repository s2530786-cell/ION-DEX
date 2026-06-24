// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IBSCVault {
    function release(address token, address user, uint256 amount, bytes32 releaseId) external;
}

contract BridgeRelayV2 is ReentrancyGuard {
    error IonDexZeroAddress();
    error IonDexZeroAmount();
    error IonDexUnauthorized();
    error IonDexDuplicateAttestation();
    error IonDexDuplicateNonce();
    error IonDexInvalidQuorum();
    error IonDexQuorumNotMet(uint256 attestations, uint256 required);
    error IonDexParamMismatch();
    error IonDexTimelockActive(uint256 unlockTime);

    uint256 public constant MAX_RELAYERS = 32;
    uint256 public constant TIMELOCK = 48 hours;

    address public owner;
    address public vault;
    uint8 public quorum;

    address[] public relayerList;
    mapping(address => bool) public isRelayer;
    mapping(bytes32 => bool) public consumedNonce;
    mapping(bytes32 => uint256) public attestationMask;
    mapping(bytes32 => uint8) public attestationCount;
    mapping(bytes32 => bytes32) public nonceParamHash;

    // ─── Timelock ────────────────────────────────────────────────────────
    struct PendingChange {
        uint8 quorumValue;
        address relayerAddr;
        bool isAdd;
        bool isRemove;
        uint256 unlockTime;
        bool hasQuorum;
        bool hasRelayer;
    }
    PendingChange public pending;

    event PendingChangeScheduled(uint256 unlockTime, bool hasQuorum, bool hasRelayer);
    event PendingChangeExecuted();
    event PendingChangeCancelled();

    event RelayerAdded(address indexed relayer, uint8 index);
    event RelayerRemoved(address indexed relayer);
    event QuorumUpdated(uint8 quorum);
    event MessageRelayed(bytes32 indexed nonce, address indexed token, address indexed user, uint256 amount, bytes32 releaseId);
    event AttestationRecorded(bytes32 indexed nonce, address indexed relayer, uint8 count);

    modifier onlyOwner() {
        if (msg.sender != owner) revert IonDexUnauthorized();
        _;
    }

    modifier onlyRelayer() {
        if (!isRelayer[msg.sender]) revert IonDexUnauthorized();
        _;
    }

    constructor(address owner_, address vault_, uint8 quorum_) {
        if (owner_ == address(0) || vault_ == address(0)) revert IonDexZeroAddress();
        if (quorum_ == 0 || quorum_ > MAX_RELAYERS) revert IonDexInvalidQuorum();
        owner = owner_;
        vault = vault_;
        quorum = quorum_;
    }

    // ─── Non-timelocked setter ───────────────────────────────────────────

    function setVault(address vault_) external onlyOwner {
        if (vault_ == address(0)) revert IonDexZeroAddress();
        vault = vault_;
    }

    /// @notice Direct relayer add (no timelock) — for test/deploy convenience only.
    function addRelayerDirect(address relayer) external onlyOwner {
        if (relayer == address(0)) revert IonDexZeroAddress();
        if (isRelayer[relayer]) revert IonDexUnauthorized();
        if (relayerList.length >= MAX_RELAYERS) revert IonDexInvalidQuorum();
        isRelayer[relayer] = true;
        relayerList.push(relayer);
        emit RelayerAdded(relayer, uint8(relayerList.length - 1));
    }

    // ─── Timelocked setters ──────────────────────────────────────────────

    function scheduleSetQuorum(uint8 quorum_) external onlyOwner {
        if (quorum_ == 0 || quorum_ > uint8(relayerList.length)) revert IonDexInvalidQuorum();
        pending.quorumValue = quorum_;
        pending.hasQuorum = true;
        pending.unlockTime = block.timestamp + TIMELOCK;
        emit PendingChangeScheduled(pending.unlockTime, true, pending.hasRelayer);
    }

    function scheduleAddRelayer(address relayer) external onlyOwner {
        if (relayer == address(0)) revert IonDexZeroAddress();
        if (isRelayer[relayer]) revert IonDexUnauthorized();
        if (relayerList.length >= MAX_RELAYERS) revert IonDexInvalidQuorum();
        pending.relayerAddr = relayer;
        pending.isAdd = true;
        pending.isRemove = false;
        pending.hasRelayer = true;
        pending.unlockTime = block.timestamp + TIMELOCK;
        emit PendingChangeScheduled(pending.unlockTime, pending.hasQuorum, true);
    }

    function scheduleRemoveRelayer(address relayer) external onlyOwner {
        if (!isRelayer[relayer]) revert IonDexUnauthorized();
        pending.relayerAddr = relayer;
        pending.isAdd = false;
        pending.isRemove = true;
        pending.hasRelayer = true;
        pending.unlockTime = block.timestamp + TIMELOCK;
        emit PendingChangeScheduled(pending.unlockTime, pending.hasQuorum, true);
    }

    function executePendingChanges() external onlyOwner {
        if (block.timestamp < pending.unlockTime) revert IonDexTimelockActive(pending.unlockTime);
        if (pending.hasQuorum) {
            quorum = pending.quorumValue;
            pending.hasQuorum = false;
            emit QuorumUpdated(quorum);
        }
        if (pending.hasRelayer) {
            if (pending.isAdd) {
                isRelayer[pending.relayerAddr] = true;
                relayerList.push(pending.relayerAddr);
                emit RelayerAdded(pending.relayerAddr, uint8(relayerList.length - 1));
            } else if (pending.isRemove) {
                isRelayer[pending.relayerAddr] = false;
                for (uint256 i = 0; i < relayerList.length; i++) {
                    if (relayerList[i] == pending.relayerAddr) {
                        relayerList[i] = relayerList[relayerList.length - 1];
                        relayerList.pop();
                        break;
                    }
                }
                if (quorum > uint8(relayerList.length)) {
                    quorum = uint8(relayerList.length);
                    emit QuorumUpdated(quorum);
                }
                emit RelayerRemoved(pending.relayerAddr);
            }
            pending.isAdd = false;
            pending.isRemove = false;
            pending.hasRelayer = false;
        }
        emit PendingChangeExecuted();
    }

    function cancelPendingChanges() external onlyOwner {
        delete pending;
        emit PendingChangeCancelled();
    }

    // ─── Relayer logic ───────────────────────────────────────────────────

    function getRelayerIndex(address relayer) internal view returns (uint8) {
        for (uint8 i = 0; i < uint8(relayerList.length); i++) {
            if (relayerList[i] == relayer) return i;
        }
        revert IonDexUnauthorized();
    }

    function attestInbound(bytes32 nonce, address token, address user, uint256 amount) external nonReentrant onlyRelayer {
        if (token == address(0) || user == address(0)) revert IonDexZeroAddress();
        if (amount == 0) revert IonDexZeroAmount();
        if (nonce == bytes32(0)) revert IonDexZeroAddress();
        if (consumedNonce[nonce]) revert IonDexDuplicateNonce();

        bytes32 paramHash = keccak256(abi.encodePacked(token, user, amount));
        bytes32 storedHash = nonceParamHash[nonce];
        if (storedHash == bytes32(0)) {
            nonceParamHash[nonce] = paramHash;
        } else if (storedHash != paramHash) {
            revert IonDexParamMismatch();
        }

        uint8 idx = getRelayerIndex(msg.sender);
        uint256 mask = attestationMask[nonce];
        // forge-lint: disable-next-line(incorrect-shift)
        if ((mask & (1 << idx)) != 0) revert IonDexDuplicateAttestation();

        // forge-lint: disable-next-line(incorrect-shift)
        attestationMask[nonce] = mask | (1 << idx);
        uint8 count = attestationCount[nonce] + 1;
        attestationCount[nonce] = count;
        emit AttestationRecorded(nonce, msg.sender, count);

        if (count >= quorum) {
            consumedNonce[nonce] = true;
            IBSCVault(vault).release(token, user, amount, nonce);
            emit MessageRelayed(nonce, token, user, amount, nonce);
        }
    }

    function relayerCount() external view returns (uint256) {
        return relayerList.length;
    }
}
