// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {AdminManager} from "../bsc/AdminManager.sol";
import {DexSwapV2} from "../bsc/DexSwapV2.sol";
import {LiquidityPool} from "../bsc/LiquidityPool.sol";
import {MockERC20} from "../bsc/MockERC20.sol";
import {OrderBookV2} from "../bsc/OrderBookV2.sol";

contract ContractAuditRemediationsTest is Test {
    address internal constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    address internal owner = address(0xA11CE);
    address internal user = address(0xB0B);

    AdminManager internal admin;
    MockERC20 internal tokenA;
    MockERC20 internal tokenB;
    DexSwapV2 internal dex;
    LiquidityPool internal pool;
    OrderBookV2 internal orderBook;

    function setUp() public {
        admin = new AdminManager(owner);
        tokenA = new MockERC20("Token A", "TKA", 18);
        tokenB = new MockERC20("Token B", "TKB", 18);
        dex = new DexSwapV2(address(admin), address(0xD1));
        pool = new LiquidityPool("ION LP", "IONLP", address(tokenA), address(tokenB), address(admin), address(dex));
        orderBook = new OrderBookV2(address(admin), address(tokenB));

        vm.startPrank(owner);
        dex.setLpPool(address(pool));
        dex.setPoolWhitelist(address(tokenA), true);
        dex.setPoolWhitelist(address(tokenB), true);
        vm.stopPrank();

        tokenA.mint(owner, 1_000_000 ether);
        tokenB.mint(owner, 1_000_000 ether);
        tokenA.mint(user, 10_000 ether);
        tokenB.mint(user, 10_000 ether);

        vm.startPrank(owner);
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        pool.addLiquidity(100_000 ether, 100_000 ether);
        vm.stopPrank();
    }

    function test_DexSwapV2_settlesThroughPoolCustody() public {
        uint256 amountIn = 1_000 ether;
        uint256 reserveIn = tokenA.balanceOf(address(pool));
        uint256 reserveOut = tokenB.balanceOf(address(pool));
        uint256 amountInAfterFee = (amountIn * (10_000 - dex.swapFee())) / 10_000;
        uint256 expectedOut = (amountInAfterFee * reserveOut) / (reserveIn + amountInAfterFee);
        uint256 userQuoteBefore = tokenB.balanceOf(user);

        vm.startPrank(user);
        tokenA.approve(address(dex), amountIn);
        uint256 amountOut = dex.swap(address(tokenA), address(tokenB), amountIn, 1, block.timestamp + 1 hours, 0);
        vm.stopPrank();

        assertEq(amountOut, expectedOut);
        assertEq(tokenB.balanceOf(user), userQuoteBefore + expectedOut);
        assertEq(tokenA.balanceOf(address(pool)), reserveIn + amountIn);
        assertEq(tokenB.balanceOf(address(pool)), reserveOut - expectedOut);
    }

    function test_LiquidityPool_locksMinimumLiquidity_andRejectsSkewedAdds() public {
        assertEq(pool.balanceOf(DEAD_ADDRESS), pool.MINIMUM_LIQUIDITY());

        vm.startPrank(user);
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        vm.expectRevert("Invalid ratio");
        pool.addLiquidity(1_000 ether, 500 ether);
        vm.stopPrank();
    }

    function test_OrderBookV2_blocksUnsafeSettlementPaths() public {
        vm.startPrank(user);
        tokenB.approve(address(orderBook), type(uint256).max);
        orderBook.deposit(1_000 ether);
        vm.expectRevert(OrderBookV2.IonDexUnsupportedOrderSide.selector);
        orderBook.placeOrder(false, 100, 1, block.timestamp + 1 hours);
        orderBook.placeOrder(true, 100, 1, block.timestamp + 1 hours);
        vm.expectRevert(OrderBookV2.IonDexSettlementDisabled.selector);
        orderBook.matchOrder(0, 1);
        vm.stopPrank();
    }
}
