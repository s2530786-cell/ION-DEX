// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20Ion {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title IonWrapper
 * @notice BSC-side ION custody wrapper: lock ION for wrapped balance, burn sends to dead sink.
 * @dev Used for bridge/stress paths — only accepts the configured ION token.
 */
contract IonWrapper {
    error IonDexZeroAddress();
    error IonDexZeroAmount();
    error IonDexInsufficientBalance();
    error IonDexTransferFailed();

    IERC20Ion public immutable ionToken;
    address public constant BURN_SINK = 0x000000000000000000000000000000000000dEaD;

    mapping(address => uint256) public balanceOf;
    uint256 public totalBurned;

    event Minted(address indexed user, uint256 amount);
    event Burned(address indexed user, uint256 amount);

    constructor(address ionToken_) {
        if (ionToken_ == address(0)) revert IonDexZeroAddress();
        ionToken = IERC20Ion(ionToken_);
    }

    function mint(uint256 amount) external {
        if (amount == 0) revert IonDexZeroAmount();
        if (!ionToken.transferFrom(msg.sender, address(this), amount)) revert IonDexTransferFailed();
        balanceOf[msg.sender] += amount;
        emit Minted(msg.sender, amount);
    }

    function burn(uint256 amount) external {
        if (amount == 0) revert IonDexZeroAmount();
        if (balanceOf[msg.sender] < amount) revert IonDexInsufficientBalance();
        balanceOf[msg.sender] -= amount;
        totalBurned += amount;
        if (!ionToken.transfer(BURN_SINK, amount)) revert IonDexTransferFailed();
        emit Burned(msg.sender, amount);
    }
}
