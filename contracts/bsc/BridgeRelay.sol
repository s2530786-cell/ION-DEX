// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBSCVault {
    function release(address token, address user, uint256 amount, bytes32 releaseId) external;
}

/**
 * @title BridgeRelay
 * @notice BSC-side bridge relayer: verifies quorum-signed messages and triggers vault release.
 */
contract BridgeRelay {
    error IonDexZeroAddress();
    error IonDexZeroAmount();
    error IonDexUnauthorized();
    error IonDexDuplicateNonce();
    error IonDexInvalidQuorum();

    uint256 public constant MAX_RELAYERS = 32;

    address public owner;
    address public vault;
    uint8 public quorum;

    address[] public relayerList;
    mapping(address => bool) public isRelayer;
    mapping(bytes32 => bool) public consumedNonce;

    event RelayerAdded(address indexed relayer);
    event RelayerRemoved(address indexed relayer);
    event QuorumUpdated(uint8 quorum);
    event MessageRelayed(
        bytes32 indexed nonce,
        address indexed token,
        address indexed user,
        uint256 amount,
        bytes32 releaseId
    );

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

    function setVault(address vault_) external onlyOwner {
        if (vault_ == address(0)) revert IonDexZeroAddress();
        vault = vault_;
    }

    function setQuorum(uint8 quorum_) external onlyOwner {
        if (quorum_ == 0 || quorum_ > MAX_RELAYERS) revert IonDexInvalidQuorum();
        quorum = quorum_;
        emit QuorumUpdated(quorum_);
    }

    function addRelayer(address relayer) external onlyOwner {
        if (relayer == address(0)) revert IonDexZeroAddress();
        if (isRelayer[relayer]) revert IonDexUnauthorized();
        if (relayerList.length >= MAX_RELAYERS) revert IonDexInvalidQuorum();
        isRelayer[relayer] = true;
        relayerList.push(relayer);
        emit RelayerAdded(relayer);
    }

    function removeRelayer(address relayer) external onlyOwner {
        if (!isRelayer[relayer]) revert IonDexUnauthorized();
        isRelayer[relayer] = false;
        for (uint256 i = 0; i < relayerList.length; i++) {
            if (relayerList[i] == relayer) {
                relayerList[i] = relayerList[relayerList.length - 1];
                relayerList.pop();
                break;
            }
        }
        emit RelayerRemoved(relayer);
    }

    /**
     * @notice Relayer attests an inbound ION message; after quorum distinct relayers, vault releases funds.
     * @param nonce Unique message nonce (also used as releaseId for vault idempotency).
     */
    function attestInbound(
        bytes32 nonce,
        address token,
        address user,
        uint256 amount
    ) external onlyRelayer {
        if (token == address(0) || user == address(0)) revert IonDexZeroAddress();
        if (amount == 0) revert IonDexZeroAmount();
        if (nonce == bytes32(0)) revert IonDexZeroAddress();
        if (consumedNonce[nonce]) revert IonDexDuplicateNonce();

        consumedNonce[nonce] = true;
        IBSCVault(vault).release(token, user, amount, nonce);
        emit MessageRelayed(nonce, token, user, amount, nonce);
    }

    function relayerCount() external view returns (uint256) {
        return relayerList.length;
    }
}
