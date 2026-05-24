// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IonProtocolFeeLib} from "./IonProtocolFeeLib.sol";

/**
 * @title IonSwapRouter
 * @notice Minimal BSC swap router enforcing amountOutMinimum (slippage floor) on every exact-input swap.
 * @dev Pairs with off-chain quote math in backend/src/lib/minimum-output.ts — fee first, then slippage bps.
 */
interface ISwapPool {
    function swapExactIn(uint256 amountIn, uint256 amountOutMinimum) external returns (uint256 amountOut);
}

interface IERC20Minimal {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function transfer(address to, uint256 value) external returns (bool);
}

contract IonSwapRouter {
    error IonDexMinOutput(uint256 amountOut, uint256 amountOutMinimum);
    error IonDexZeroAddress();
    error IonDexZeroAmount();

    address public owner;
    address public feeReceiver;

    event SwapExactIn(
        address indexed caller,
        address indexed pool,
        uint256 amountIn,
        uint256 amountOut,
        uint256 amountOutMinimum
    );

    constructor(address owner_) {
        if (owner_ == address(0)) revert IonDexZeroAddress();
        owner = owner_;
    }

    function setFeeReceiver(address feeReceiver_) external {
        if (msg.sender != owner) revert IonDexZeroAddress();
        feeReceiver = feeReceiver_;
    }

    /**
     * @param pool           Reviewed AMM/pool executor (must return actual output).
     * @param amountIn       Input token amount already approved to this router.
     * @param amountOutMinimum Minimum acceptable output — MUST match off-chain quote minimumReceivedUnits.
     * @param recipient      Output token recipient.
     */
    function swapExactIn(
        ISwapPool pool,
        uint256 amountIn,
        uint256 amountOutMinimum,
        address recipient,
        uint256 ionProtocolFee
    ) external returns (uint256 amountOut) {
        if (address(pool) == address(0) || recipient == address(0)) {
            revert IonDexZeroAddress();
        }
        if (amountIn == 0) {
            revert IonDexZeroAmount();
        }

        IonProtocolFeeLib.collectIonFee(feeReceiver, address(this), msg.sender, ionProtocolFee);

        amountOut = pool.swapExactIn(amountIn, amountOutMinimum);
        if (amountOut < amountOutMinimum) {
            revert IonDexMinOutput(amountOut, amountOutMinimum);
        }

        emit SwapExactIn(msg.sender, address(pool), amountIn, amountOut, amountOutMinimum);
        recipient;
    }
}

/**
 * @dev Test/double pool used by Foundry or manual harness — returns fixed output for invariant checks.
 */
contract IonSwapPoolMock is ISwapPool {
    uint256 public fixedOutput;

    constructor(uint256 output_) {
        fixedOutput = output_;
    }

    function setFixedOutput(uint256 output_) external {
        fixedOutput = output_;
    }

    function swapExactIn(uint256, uint256) external view returns (uint256 amountOut) {
        return fixedOutput;
    }
}
