// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title IonWrapper
 * @notice ERC20 wrapper for ION token on BSC (BEP-20 compatible)
 * @dev Used for bridging ION tokens from ION chain to BSC
 *      Acts as the canonical wrapped representation: wION
 */
contract IonWrapper is ERC20, Ownable, Pausable, EIP712 {
    /// @notice Emitted when tokens are minted (bridge lock → mint)
    event Mint(address indexed to, uint256 amount, bytes32 indexed bridgeTxHash);
    /// @notice Emitted when tokens are burned (burn → bridge unlock)
    event Burn(address indexed from, uint256 amount, bytes32 indexed bridgeTxHash);

    /// @notice Bridge operator address (authorized to mint/burn)
    address public bridge;

    /// @notice Mapping of processed bridge transaction hashes (anti-replay)
    mapping(bytes32 => bool) public processedTxs;

    /// @notice Mint cap (anti-inflation)
    uint256 public mintCap;

    /// @notice Total minted through bridge
    uint256 public totalBridged;

    error NotBridge();
    error TxAlreadyProcessed(bytes32 txHash);
    error ExceedsMintCap(uint256 requested, uint256 cap);
    error InvalidAmount();

    modifier onlyBridge() {
        if (msg.sender != bridge) revert NotBridge();
        _;
    }

    constructor(
        address _bridge,
        address _owner,
        uint256 _mintCap
    ) ERC20("Wrapped ION", "wION") EIP712("IonWrapper", "1") Ownable(_owner) {
        bridge = _bridge;
        mintCap = _mintCap;
        _transferOwnership(_owner);
    }

    /**
     * @notice Mint wION tokens on BSC (called by bridge operator)
     * @param to Recipient address
     * @param amount Amount to mint
     * @param bridgeTxHash ION chain transaction hash (anti-replay)
     */
    function mint(address to, uint256 amount, bytes32 bridgeTxHash) external onlyBridge whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        if (processedTxs[bridgeTxHash]) revert TxAlreadyProcessed(bridgeTxHash);
        if (totalBridged + amount > mintCap && mintCap > 0) revert ExceedsMintCap(amount, mintCap);

        processedTxs[bridgeTxHash] = true;
        totalBridged += amount;

        _mint(to, amount);
        emit Mint(to, amount, bridgeTxHash);
    }

    /**
     * @notice Burn wION tokens (pre-step before bridge unlock on ION chain)
     * @param amount Amount to burn
     * @param bridgeTxHash Generated unique hash for this burn
     */
    function burn(uint256 amount, bytes32 bridgeTxHash) external whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        if (processedTxs[bridgeTxHash]) revert TxAlreadyProcessed(bridgeTxHash);

        processedTxs[bridgeTxHash] = true;
        totalBridged -= amount;

        _burn(msg.sender, amount);
        emit Burn(msg.sender, amount, bridgeTxHash);
    }

    /**
     * @notice Update bridge operator address
     */
    function setBridge(address _bridge) external onlyOwner {
        bridge = _bridge;
    }

    /**
     * @notice Update mint cap
     */
    function setMintCap(uint256 _mintCap) external onlyOwner {
        mintCap = _mintCap;
    }

    /**
     * @notice Pause all bridge operations (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause bridge operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
