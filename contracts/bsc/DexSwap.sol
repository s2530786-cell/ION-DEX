// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {IFeeReceiver} from "./interfaces/IFeeReceiver.sol";

/// @title DexSwap - constant-product AMM swap with hardcoded 0.3% fee
/// @notice All protocol fees are collected and forwarded in ION via FeeReceiver.
contract DexSwap {
    uint256 public constant FEE_NUMERATOR = 3;       // 0.3%
    uint256 public constant FEE_DENOMINATOR = 1000;

    address public immutable ION;
    IFeeReceiver public immutable feeReceiver;

    // reserves keyed by token pair hash
    mapping(bytes32 => uint112) public reserveA;
    mapping(bytes32 => uint112) public reserveB;

    uint256 private _locked = 1;
    modifier nonReentrant() {
        require(_locked == 1, "REENTRANCY");
        _locked = 2;
        _;
        _locked = 1;
    }

    event Swap(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut, uint256 feeIon);

    constructor(address ion, address feeReceiver_) {
        require(ion != address(0) && feeReceiver_ != address(0), "ZERO_ADDR");
        ION = ion;
        feeReceiver = IFeeReceiver(feeReceiver_);
    }

    function _pairKey(address a, address b) internal pure returns (bytes32) {
        return a < b ? keccak256(abi.encodePacked(a, b)) : keccak256(abi.encodePacked(b, a));
    }

    function getReserves(address tokenIn, address tokenOut) public view returns (uint112 rIn, uint112 rOut) {
        bytes32 k = _pairKey(tokenIn, tokenOut);
        if (tokenIn < tokenOut) return (reserveA[k], reserveB[k]);
        return (reserveB[k], reserveA[k]);
    }

    /// @dev x*y=k pricing with 0.3% fee deducted from amountIn
    function getAmountOut(uint256 amountIn, uint256 rIn, uint256 rOut) public pure returns (uint256) {
        require(amountIn > 0, "INSUFFICIENT_INPUT");
        require(rIn > 0 && rOut > 0, "NO_LIQUIDITY");
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_NUMERATOR);
        uint256 numerator = amountInWithFee * rOut;
        uint256 denominator = rIn * FEE_DENOMINATOR + amountInWithFee;
        return numerator / denominator;
    }

    function swapExactTokensForTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address to,
        uint256 deadline
    ) external nonReentrant returns (uint256 amountOut) {
        require(block.timestamp <= deadline, "EXPIRED");
        (uint112 rIn, uint112 rOut) = getReserves(tokenIn, tokenOut);
        amountOut = getAmountOut(amountIn, rIn, rOut);
        require(amountOut >= minAmountOut, "SLIPPAGE");

        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "TRANSFER_IN");

        // protocol fee routed to FeeReceiver in ION terms (0.3% of input value)
        uint256 feeIon = (amountIn * FEE_NUMERATOR) / FEE_DENOMINATOR;
        IERC20(tokenIn).approve(address(feeReceiver), feeIon);
        feeReceiver.collect(tokenIn, feeIon);

        _update(tokenIn, tokenOut, amountIn, amountOut);
        require(IERC20(tokenOut).transfer(to, amountOut), "TRANSFER_OUT");

        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut, feeIon);
    }

    function swapTokensForExactTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountOut,
        uint256 maxAmountIn,
        address to,
        uint256 deadline
    ) external nonReentrant returns (uint256 amountIn) {
        require(block.timestamp <= deadline, "EXPIRED");
        (uint112 rIn, uint112 rOut) = getReserves(tokenIn, tokenOut);
        require(amountOut < rOut, "INSUFFICIENT_LIQUIDITY");
        uint256 numerator = uint256(rIn) * amountOut * FEE_DENOMINATOR;
        uint256 denominator = (uint256(rOut) - amountOut) * (FEE_DENOMINATOR - FEE_NUMERATOR);
        amountIn = (numerator / denominator) + 1;
        require(amountIn <= maxAmountIn, "EXCESSIVE_INPUT");

        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "TRANSFER_IN");
        _update(tokenIn, tokenOut, amountIn, amountOut);
        require(IERC20(tokenOut).transfer(to, amountOut), "TRANSFER_OUT");
        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut, 0);
    }

    function _update(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut) internal {
        bytes32 k = _pairKey(tokenIn, tokenOut);
        if (tokenIn < tokenOut) {
            reserveA[k] += uint112(amountIn);
            reserveB[k] -= uint112(amountOut);
        } else {
            reserveB[k] += uint112(amountIn);
            reserveA[k] -= uint112(amountOut);
        }
    }
}
