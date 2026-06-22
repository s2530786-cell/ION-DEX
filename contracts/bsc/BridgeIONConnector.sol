// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title BridgeIONConnector
 * @notice BSC/ION bridge helper for fee calculation, fee splitting, and off-chain proof verification.
 */
contract BridgeIONConnector {
    error IonDexZeroAddress();
    error IonDexZeroAmount();
    error IonDexUnauthorized();
    error IonDexBridgeFeeInsufficient();

    uint256 private constant SECP256K1N_HALF =
        0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0;

    uint256 public constant BRIDGE_FEE_BPS = 10;
    uint256 public constant FEE_DENOMINATOR = 10_000;
    uint256 public constant BPS_TEAM = 2500;
    address public constant MASTER_ADDRESS = 0x8FF2e1210434495C4f5629BD9D8Bd4965a67B84C;
    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    string public constant ION_RPC_URL = "https://api.mainnet.ice.io/http/v2/";

    address public owner;
    address public bridgeRelay;
    address public feeReceiver;
    uint256 public totalBridgedBscToIon;
    uint256 public totalBridgedIonToBsc;
    uint256 public totalFeesCollected;

    event BridgeInitiated(
        address indexed user,
        address indexed token,
        uint256 amount,
        bytes32 ionRecipient,
        uint256 fee,
        uint256 nonce
    );
    event BridgeCompleted(address indexed user, address indexed token, uint256 amount, bytes32 sourceNonce);
    event FeeDistributed(uint256 fee, uint256 toMaster, uint256 toBurn);
    event BridgeRelayUpdated(address indexed previousRelay, address indexed newRelay);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    struct IONBridgeMessage {
        uint32 sourceChainId;
        uint256 sourceNonce;
        uint256 amount;
        bytes32 recipient;
        address token;
    }

    constructor(address owner_, address feeReceiver_) {
        if (owner_ == address(0) || feeReceiver_ == address(0)) revert IonDexZeroAddress();
        owner = owner_;
        feeReceiver = feeReceiver_;
    }

    function calculateBridgeFee(uint256 amount) public pure returns (uint256) {
        return (amount * BRIDGE_FEE_BPS) / FEE_DENOMINATOR;
    }

    function calculateFeeSplit(uint256 fee) public pure returns (uint256 toMaster, uint256 toBurn) {
        toMaster = (fee * BPS_TEAM) / FEE_DENOMINATOR;
        toBurn = fee - toMaster;
    }

    function getBridgeMessageHash(
        uint32 sourceChainId,
        uint256 sourceNonce,
        uint256 amount,
        bytes32 ionRecipient,
        address token
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(sourceChainId, sourceNonce, amount, ionRecipient, token));
    }

    function verifyIONProof(bytes32 messageHash, bytes memory signature, address signer) public pure returns (bool) {
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        return _recoverSigner(ethSignedHash, signature) == signer;
    }

    function _recoverSigner(bytes32 hash, bytes memory sig) internal pure returns (address) {
        if (sig.length != 65) return address(0);
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        if (v < 27) v += 27;
        if (v != 27 && v != 28) return address(0);
        if (uint256(s) > SECP256K1N_HALF) return address(0);
        return ecrecover(hash, v, r, s);
    }

    function setBridgeRelay(address relay) external {
        if (msg.sender != owner) revert IonDexUnauthorized();
        if (relay == address(0)) revert IonDexZeroAddress();
        address previousRelay = bridgeRelay;
        bridgeRelay = relay;
        emit BridgeRelayUpdated(previousRelay, relay);
    }

    function transferOwnership(address newOwner) external {
        if (msg.sender != owner) revert IonDexUnauthorized();
        if (newOwner == address(0)) revert IonDexZeroAddress();
        address previousOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
    }
}
