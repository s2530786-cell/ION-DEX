// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IonMintLedger
 * @notice Test harness simulating ION-side credit after a BSC `Locked` event (P0-1c).
 * @dev Mirrors BridgeInbox nonce + relayer gate without FunC VM in Foundry.
 */
contract IonMintLedger {
    error IonDexZeroAmount();
    error IonDexZeroRecipient();
    error IonDexUnauthorizedRelayer();
    error IonDexDuplicateMessage();

    address public owner;
    mapping(address => bool) public relayers;
    mapping(bytes32 => bool) public consumedMessage;
    mapping(bytes32 => uint256) public ionBalances;

    event IonCredited(bytes32 indexed messageId, bytes32 indexed ionRecipient, uint256 amount);

    constructor(address owner_) {
        owner = owner_;
    }

    function setRelayer(address relayer, bool allowed) external {
        if (msg.sender != owner) revert IonDexUnauthorizedRelayer();
        relayers[relayer] = allowed;
    }

    /**
     * @param messageId Unique id derived from BSC lock (keccak256 of lock fields).
     * @param ionRecipient ION-side recipient (bytes32 from BSC lock).
     */
    function creditFromBscLock(bytes32 messageId, bytes32 ionRecipient, uint256 amount) external {
        if (!relayers[msg.sender]) revert IonDexUnauthorizedRelayer();
        if (messageId == bytes32(0) || ionRecipient == bytes32(0)) revert IonDexZeroRecipient();
        if (amount == 0) revert IonDexZeroAmount();
        if (consumedMessage[messageId]) revert IonDexDuplicateMessage();

        consumedMessage[messageId] = true;
        ionBalances[ionRecipient] += amount;
        emit IonCredited(messageId, ionRecipient, amount);
    }
}
