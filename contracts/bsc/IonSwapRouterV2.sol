// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IonProtocolFeeLib} from "./IonProtocolFeeLib.sol";

interface ISwapPool {
    function swapExactIn(uint256 amountIn, uint256 amountOutMinimum, address recipient) external returns (uint256 amountOut);
}

contract IonSwapRouterV2 is ReentrancyGuard {
    error IonDexMinOutput(uint256 amountOut, uint256 amountOutMinimum);
    error IonDexZeroAddress();
    error IonDexZeroAmount();
    error IonDexUnauthorized();
    error IonDexExpired();

    address public owner;
    address public feeReceiver;
    mapping(address => bool) public poolWhitelist;

    event SwapExactIn(address indexed caller, address indexed pool, uint256 amountIn, uint256 amountOut, uint256 amountOutMinimum);
    event PoolWhitelisted(address indexed pool, bool allowed);
    event FeeReceiverSet(address indexed feeReceiver);

    modifier onlyOwner() {
        if (msg.sender != owner) revert IonDexUnauthorized();
        _;
    }

    constructor(address owner_) {
        if (owner_ == address(0)) revert IonDexZeroAddress();
        owner = owner_;
    }

    function setFeeReceiver(address feeReceiver_) external onlyOwner {
        if (feeReceiver_ == address(0)) revert IonDexZeroAddress();
        feeReceiver = feeReceiver_;
        emit FeeReceiverSet(feeReceiver_);
    }

    function setPoolWhitelist(address pool, bool allowed) external onlyOwner {
        poolWhitelist[pool] = allowed;
        emit PoolWhitelisted(pool, allowed);
    }

    function swapExactIn(
        ISwapPool pool,
        uint256 amountIn,
        uint256 amountOutMinimum,
        address recipient,
        uint256 deadline,
        uint256 ionProtocolFee
    ) external nonReentrant returns (uint256 amountOut) {
        if (address(pool) == address(0) || recipient == address(0)) revert IonDexZeroAddress();
        if (amountIn == 0) revert IonDexZeroAmount();
        if (block.timestamp > deadline) revert IonDexExpired();
        if (!poolWhitelist[address(pool)]) revert IonDexUnauthorized();

        IonProtocolFeeLib.collectIonFee(feeReceiver, address(this), msg.sender, ionProtocolFee);

        amountOut = pool.swapExactIn(amountIn, amountOutMinimum, recipient);
        if (amountOut < amountOutMinimum) revert IonDexMinOutput(amountOut, amountOutMinimum);

        emit SwapExactIn(msg.sender, address(pool), amountIn, amountOut, amountOutMinimum);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert IonDexZeroAddress();
        owner = newOwner;
    }
}

contract IonSwapPoolMock is ISwapPool {
    uint256 public fixedOutput;

    constructor(uint256 _fixedOutput) {
        fixedOutput = _fixedOutput;
    }

    function setFixedOutput(uint256 _output) external {
        fixedOutput = _output;
    }

    function swapExactIn(uint256, uint256, address) external view returns (uint256) {
        return fixedOutput;
    }
}
