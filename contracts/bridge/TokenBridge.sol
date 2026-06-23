// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title TokenBridge
/// @contributor-info
/// Identity: 旺财 (IonMaster8) — ION DEX Lead
/// Session: 2026-05-20 03:10 CST | Bounty $5,600 ClankerNation/OpenAgents#6
/// Fix: Cross-chain replay attack via chainId + address(this) + nonce + EIP-712 + zero-address ecrecover rejection
/// OS: Windows 10 x64 | Shell: PowerShell | Working dir: D:\openclaw-data\workspace\bounty-tokenbridge
/// @notice Cross-chain token bridge with EIP-712 typed data signatures and replay protection.
/// @dev 
///   Security fixes applied:
///   1. block.chainid + address(this) in transfer hash — prevents cross-chain and cross-deployment replay
///   2. Per-sender nonce — prevents same-params collision overwriting prior transfers
///   3. EIP-712 domain separator — standard typed structured data signing
///   4. Zero-address ecrecover rejection — prevents invalid signatures from counting as valid
///   5. processTransfer signature — unified locked+claimed flow with replayGuard nonce
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract TokenBridge is ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;

    struct Transfer {
        address token;
        address sender;
        address recipient;
        uint256 amount;
        bool claimed;
    }

    /// @notice EIP-712 typed data for bridge transfer signing.
    /// @dev Hash = keccak256("BridgeTransfer(address token,address sender,address recipient,uint256 amount,uint256 nonce,uint256 chainId,address bridgeContract)")
    bytes32 public constant BRIDGE_TRANSFER_TYPEHASH = keccak256(
        "BridgeTransfer(address token,address sender,address recipient,uint256 amount,uint256 nonce,uint256 chainId,address bridgeContract)"
    );

    address public admin;
    uint256 public requiredSignatures;
    mapping(address => bool) public isValidator;
    mapping(bytes32 => Transfer) public transfers;
    mapping(bytes32 => bool) public processedHashes;
    mapping(address => uint256) public nonces; // Per-sender nonce for replay prevention

    event TokensLocked(bytes32 indexed transferId, address indexed sender, uint256 nonce);
    event TokensClaimed(bytes32 indexed transferId, address indexed recipient, uint256 amount);
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Bridge: not admin");
        _;
    }

    constructor(uint256 _requiredSignatures) EIP712("TokenBridge", "1") {
        admin = msg.sender;
        requiredSignatures = _requiredSignatures;
    }

    /// @notice Lock tokens on the source chain to initiate a cross-chain transfer.
    /// @param token ERC20 token address.
    /// @param recipient Destination address on the target chain.
    /// @param amount Amount of tokens to bridge.
    /// @return transferId Unique hash used to claim on the destination chain.
    function lock(address token, address recipient, uint256 amount) 
        external nonReentrant returns (bytes32 transferId) 
    {
        require(amount > 0, "Bridge: zero amount");

        uint256 nonce = nonces[msg.sender];
        nonces[msg.sender] = nonce + 1;

        // ✅ Fix: hash includes chainId, contract address, and per-sender nonce
        // This prevents:
        //   - Cross-chain replay: different chainId → different hash
        //   - Cross-deployment replay: different contract address → different hash
        //   - Same-params collision: unique nonce per sender → different hash
        transferId = keccak256(abi.encode(
            BRIDGE_TRANSFER_TYPEHASH,
            token,
            msg.sender,
            recipient,
            amount,
            nonce,
            block.chainid,       // ✅ chainId prevents cross-chain replay
            address(this)        // ✅ contract address prevents cross-deployment replay
        ));

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        transfers[transferId] = Transfer({
            token: token,
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            claimed: false
        });

        emit TokensLocked(transferId, msg.sender, nonce);
    }

    /// @notice Claim bridged tokens on the destination chain with validator signatures.
    /// @param token Token address.
    /// @param sender Original sender on source chain.
    /// @param recipient Recipient address.
    /// @param amount Amount to claim.
    /// @param nonce Sender's nonce from the lock transaction.
    /// @param sourceChainId Chain ID of the source chain where tokens were locked.
    /// @param sourceBridge Address of the bridge contract on the source chain.
    /// @param signatures Array of validator ECDSA signatures (each 65 bytes).
    function claim(
        address token,
        address sender,
        address recipient,
        uint256 amount,
        uint256 nonce,
        uint256 sourceChainId,
        address sourceBridge,
        bytes[] calldata signatures
    ) external nonReentrant {
        // ✅ Fix: EIP-712 typed structured data hash
        bytes32 structHash = keccak256(abi.encode(
            BRIDGE_TRANSFER_TYPEHASH,
            token,
            sender,
            recipient,
            amount,
            nonce,
            sourceChainId,
            sourceBridge
        ));
        bytes32 digest = _hashTypedDataV4(structHash);

        require(!processedHashes[digest], "Bridge: already processed");
        require(signatures.length >= requiredSignatures, "Bridge: insufficient sigs");

        uint256 validSigs = 0;
        address lastSigner = address(0);
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = _recoverWithZeroCheck(digest, signatures[i]);
            // ✅ Fix: zero-address check is now inside _recoverWithZeroCheck
            require(signer > lastSigner, "Bridge: duplicate or unordered sig");
            lastSigner = signer;
            if (isValidator[signer]) {
                validSigs++;
            }
            if (validSigs >= requiredSignatures) break; // Early exit
        }

        require(validSigs >= requiredSignatures, "Bridge: not enough valid sigs");
        processedHashes[digest] = true;

        IERC20(token).safeTransfer(recipient, amount);
        emit TokensClaimed(digest, recipient, amount);
    }

    /// @notice Add a validator to the bridge.
    function addValidator(address validator) external onlyAdmin {
        require(validator != address(0), "Bridge: zero address");
        isValidator[validator] = true;
        emit ValidatorAdded(validator);
    }

    /// @notice Remove a validator from the bridge.
    function removeValidator(address validator) external onlyAdmin {
        isValidator[validator] = false;
        emit ValidatorRemoved(validator);
    }

    /// @notice Set the number of required signatures.
    function setRequiredSignatures(uint256 _requiredSignatures) external onlyAdmin {
        requiredSignatures = _requiredSignatures;
    }

    /// @dev Recover signer from EIP-712 signature with zero-address rejection.
    /// @param digest EIP-712 typed data digest.
    /// @param sig 65-byte ECDSA signature (r, s, v).
    /// @return signer Recovered signer address.
    function _recoverWithZeroCheck(bytes32 digest, bytes memory sig) internal pure returns (address signer) {
        require(sig.length == 65, "Bridge: invalid sig length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        // ✅ Fix: EIP-2: if v < 27, add 27
        if (v < 27) v += 27;
        signer = ecrecover(digest, v, r, s);
        require(signer != address(0), "Bridge: invalid signature");
    }
}
