// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AdminManager.sol";

/// @notice DEX 恒定乘积 AMM 兑换合约
contract DexSwap is ReentrancyGuard {
    AdminManager public admin;
    address public lpPool;
    uint256 public swapFee = 30; // 0.3% (basis points, 10000 = 100%)

    event Swap(
        address indexed user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(address _admin, address _lpPool) {
        admin = AdminManager(_admin);
        lpPool = _lpPool;
    }

    /// @notice 恒定乘积 X*Y=K 兑换
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external nonReentrant returns (uint256 amountOut) {
        require(!admin.paused(), "Paused");
        require(amountIn > 0, "Amount zero");
        require(tokenIn != tokenOut, "Same token");
        require(tokenIn != address(0) && tokenOut != address(0), "Zero address");

        // 用户转入代币到池子
        require(IERC20(tokenIn).transferFrom(msg.sender, lpPool, amountIn), "TF fail");

        // 计算池中储备
        uint256 reserveIn = IERC20(tokenIn).balanceOf(lpPool);
        uint256 reserveOut = IERC20(tokenOut).balanceOf(lpPool);
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");

        // 扣手续费后计算输出
        uint256 amountInAfterFee = amountIn * (10000 - swapFee) / 10000;
        amountOut = (amountInAfterFee * reserveOut) / (reserveIn + amountInAfterFee);
        require(amountOut > 0, "Insufficient output");

        // 从池子转 output 给用户
        require(IERC20(tokenOut).transfer(msg.sender, amountOut), "TF fail");

        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    /// @notice 设置池子地址
    function setLpPool(address _lpPool) external onlyOwner {
        lpPool = _lpPool;
    }

    /// @notice 修改手续费（管理员，最高1%）
    function setFee(uint256 newFee) external onlyOwner {
        require(newFee <= 100, "Fee too high");
        swapFee = newFee;
    }

    modifier onlyOwner() {
        require(msg.sender == admin.owner(), "Not owner");
        _;
    }
}
