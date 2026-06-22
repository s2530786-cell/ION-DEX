// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {AdminManager} from "./AdminManager.sol";
import {IonProtocolFeeLib} from "./IonProtocolFeeLib.sol";

interface ILiquidityPoolSettlement {
    function payout(address token, address to, uint256 amount) external;
}

contract DexSwapV2 is ReentrancyGuard {
    error IonDexZeroAddress();
    error IonDexZeroAmount();
    error IonDexMinOutput(uint256 amountOut, uint256 amountOutMinimum);
    error IonDexExpired();
    error IonDexSameToken();
    error IonDexPoolNotWhitelisted();
    error IonDexUnauthorized();

    AdminManager public admin;
    address public lpPool;
    address public feeReceiver;
    uint256 public swapFee = 30;
    mapping(address => bool) public poolWhitelist;

    event Swap(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event PoolWhitelisted(address indexed pool, bool allowed);

    constructor(address admin_, address lpPool_) {
        if (admin_ == address(0) || lpPool_ == address(0)) revert IonDexZeroAddress();
        admin = AdminManager(admin_);
        lpPool = lpPool_;
    }

    modifier onlyOwner() {
        if (msg.sender != admin.owner()) revert IonDexUnauthorized();
        _;
    }

    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMinimum,
        uint256 deadline,
        uint256 ionProtocolFee
    ) external nonReentrant returns (uint256 amountOut) {
        if (admin.paused()) revert("Paused");
        if (block.timestamp > deadline) revert IonDexExpired();
        if (amountIn == 0) revert IonDexZeroAmount();
        if (tokenIn == tokenOut) revert IonDexSameToken();
        if (tokenIn == address(0) || tokenOut == address(0)) revert IonDexZeroAddress();
        if (!poolWhitelist[tokenIn] || !poolWhitelist[tokenOut]) revert IonDexPoolNotWhitelisted();

        IonProtocolFeeLib.collectIonFee(feeReceiver, address(this), msg.sender, ionProtocolFee);

        uint256 reserveIn = IERC20(tokenIn).balanceOf(lpPool);
        uint256 reserveOut = IERC20(tokenOut).balanceOf(lpPool);
        if (reserveIn == 0 || reserveOut == 0) revert("Insufficient liquidity");

        if (!IERC20(tokenIn).transferFrom(msg.sender, lpPool, amountIn)) revert("TF fail");

        uint256 amountInAfterFee = (amountIn * (10_000 - swapFee)) / 10_000;
        amountOut = (amountInAfterFee * reserveOut) / (reserveIn + amountInAfterFee);
        if (amountOut == 0) revert("Insufficient output");
        if (amountOut < amountOutMinimum) {
            revert IonDexMinOutput(amountOut, amountOutMinimum);
        }

        ILiquidityPoolSettlement(lpPool).payout(tokenOut, msg.sender, amountOut);
        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    function setLpPool(address lpPool_) external onlyOwner {
        if (lpPool_ == address(0)) revert IonDexZeroAddress();
        lpPool = lpPool_;
    }

    function setFeeReceiver(address feeReceiver_) external onlyOwner {
        if (feeReceiver_ == address(0)) revert IonDexZeroAddress();
        feeReceiver = feeReceiver_;
    }

    function setFee(uint256 newFee) external onlyOwner {
        if (newFee > 100) revert("Fee too high");
        swapFee = newFee;
    }

    function setPoolWhitelist(address token, bool allowed) external onlyOwner {
        if (token == address(0)) revert IonDexZeroAddress();
        poolWhitelist[token] = allowed;
        emit PoolWhitelisted(token, allowed);
    }
}
