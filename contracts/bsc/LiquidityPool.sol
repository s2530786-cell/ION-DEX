// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";

/// @title LiquidityPool - addLiquidity / removeLiquidity with 0.1% pool fee
contract LiquidityPool {
    uint256 public constant POOL_FEE_NUMERATOR = 1;     // 0.1%
    uint256 public constant POOL_FEE_DENOMINATOR = 1000;
    uint256 private constant MIN_LIQUIDITY = 1000;

    address public immutable token0;
    address public immutable token1;

    uint112 private reserve0;
    uint112 private reserve1;
    uint256 public totalLpSupply;
    mapping(address => uint256) public lpBalance;

    uint256 private _locked = 1;
    modifier nonReentrant() { require(_locked == 1, "REENTRANCY"); _locked = 2; _; _locked = 1; }

    event Mint(address indexed to, uint256 amount0, uint256 amount1, uint256 liquidity);
    event Burn(address indexed from, uint256 amount0, uint256 amount1, uint256 liquidity);

    constructor(address _token0, address _token1) {
        require(_token0 != _token1, "IDENTICAL");
        (token0, token1) = _token0 < _token1 ? (_token0, _token1) : (_token1, _token0);
    }

    function getReserves() external view returns (uint112, uint112) {
        return (reserve0, reserve1);
    }

    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) { z = y; uint256 x = y / 2 + 1; while (x < z) { z = x; x = (y / x + x) / 2; } }
        else if (y != 0) { z = 1; }
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) { return a < b ? a : b; }

    function addLiquidity(uint256 amount0, uint256 amount1) external nonReentrant returns (uint256 liquidity) {
        require(IERC20(token0).transferFrom(msg.sender, address(this), amount0), "T0");
        require(IERC20(token1).transferFrom(msg.sender, address(this), amount1), "T1");

        if (totalLpSupply == 0) {
            liquidity = _sqrt(amount0 * amount1) - MIN_LIQUIDITY;
            totalLpSupply = MIN_LIQUIDITY; // permanently locked
        } else {
            liquidity = _min((amount0 * totalLpSupply) / reserve0, (amount1 * totalLpSupply) / reserve1);
        }
        require(liquidity > 0, "INSUFFICIENT_LIQUIDITY_MINTED");

        lpBalance[msg.sender] += liquidity;
        totalLpSupply += liquidity;
        reserve0 += uint112(amount0);
        reserve1 += uint112(amount1);
        emit Mint(msg.sender, amount0, amount1, liquidity);
    }

    function removeLiquidity(uint256 liquidity) external nonReentrant returns (uint256 amount0, uint256 amount1) {
        require(lpBalance[msg.sender] >= liquidity, "INSUFFICIENT_LP");
        amount0 = (liquidity * reserve0) / totalLpSupply;
        amount1 = (liquidity * reserve1) / totalLpSupply;
        require(amount0 > 0 && amount1 > 0, "INSUFFICIENT_BURNED");

        lpBalance[msg.sender] -= liquidity;
        totalLpSupply -= liquidity;
        reserve0 -= uint112(amount0);
        reserve1 -= uint112(amount1);

        require(IERC20(token0).transfer(msg.sender, amount0), "T0_OUT");
        require(IERC20(token1).transfer(msg.sender, amount1), "T1_OUT");
        emit Burn(msg.sender, amount0, amount1, liquidity);
    }
}
