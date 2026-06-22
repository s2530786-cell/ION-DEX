// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockERC20} from "../bsc/MockERC20.sol";
import {AdminManager} from "../bsc/AdminManager.sol";
import {FeeReceiver} from "../bsc/FeeReceiver.sol";
import {LiquidityMine} from "../bsc/LiquidityMine.sol";
import {IonOracle} from "../bsc/IonOracle.sol";
import {MockAggregator} from "./MockAggregator.sol";

contract LiquidityMineTest is Test {
    address internal constant ION_TOKEN = 0xE1ab61f7b093435204dF32F5b3A405de55445Ea8;
    address internal constant BURN = 0x000000000000000000000000000000000000dEaD;

    AdminManager internal admin;
    FeeReceiver internal feeReceiver;
    LiquidityMine internal mine;
    MockERC20 internal ion;
    MockERC20 internal lpIonUsdt;
    MockERC20 internal lpIonBnb;
    MockAggregator internal priceFeed;
    IonOracle internal oracle;

    address internal owner = address(0xA11CE);
    address internal treasury = address(0xBEEF);
    address internal team = address(0xCAFE);
    address internal staking = address(0x570A);
    address internal keeper = address(0x5EE7);
    address internal user = address(0x75E7);

    uint256 internal poolIonUsdt;
    uint256 internal poolIonBnb;

    function setUp() public {
        deployCodeTo("MockERC20.sol:MockERC20", abi.encode("ION", "ION", 18), ION_TOKEN);
        ion = MockERC20(ION_TOKEN);

        admin = new AdminManager(owner);
        priceFeed = new MockAggregator(100_000_000, 8);
        oracle = new IonOracle(owner, address(priceFeed), "mock");
        feeReceiver = new FeeReceiver(owner, ION_TOKEN, treasury, team, staking, keeper, address(oracle), 90_000_000, 110_000_000);
        mine = new LiquidityMine(address(admin), address(feeReceiver));

        lpIonUsdt = new MockERC20("ION-USDT LP", "IONUSDT", 18);
        lpIonBnb = new MockERC20("ION-BNB LP", "IONBNB", 18);

        vm.startPrank(owner);
        mine.addPool(address(lpIonUsdt), 1 ether, 7, 10_000, 2550, "ION / USDT", "ION-USDT");
        mine.addPool(address(lpIonBnb), 8e17, 14, 10_000, 2280, "ION / BNB", "ION-BNB");
        vm.stopPrank();

        poolIonUsdt = 0;
        poolIonBnb = 1;

        lpIonUsdt.mint(user, 10_000 ether);
        lpIonBnb.mint(user, 10_000 ether);
        ion.mint(address(mine), 1_000_000 ether);
    }

    function test_stake_accrues_and_claim_reward() public {
        vm.startPrank(user);
        lpIonUsdt.approve(address(mine), 1_000 ether);
        mine.stake(poolIonUsdt, 1_000 ether, 0);
        vm.stopPrank();

        vm.roll(block.number + 100);

        uint256 pending = mine.pendingReward(poolIonUsdt, user);
        assertGt(pending, 0);

        vm.prank(user);
        mine.claimReward(poolIonUsdt, 0);
        assertGt(ion.balanceOf(user), 0);
    }

    function test_unstake_respects_lockup() public {
        vm.startPrank(user);
        lpIonUsdt.approve(address(mine), 500 ether);
        mine.stake(poolIonUsdt, 500 ether, 0);

        vm.expectRevert(bytes("Lockup active"));
        mine.unstake(poolIonUsdt, 100 ether);

        vm.warp(1_900_000_000 + 8 days);
        mine.unstake(poolIonUsdt, 100 ether);
        vm.stopPrank();

        assertEq(lpIonUsdt.balanceOf(user), 9_600 ether);
    }

    function test_emergency_withdraw_forfeits_rewards() public {
        vm.startPrank(user);
        lpIonBnb.approve(address(mine), 300 ether);
        mine.stake(poolIonBnb, 300 ether, 0);
        vm.stopPrank();

        vm.roll(block.number + 50);
        assertGt(mine.pendingReward(poolIonBnb, user), 0);

        vm.prank(user);
        mine.emergencyWithdraw(poolIonBnb);

        assertEq(lpIonBnb.balanceOf(user), 10_000 ether);
        assertEq(mine.pendingReward(poolIonBnb, user), 0);
    }

    function test_stake_collects_ion_protocol_fee() public {
        uint256 ionFee = 2 ether;
        ion.mint(user, ionFee);

        vm.startPrank(user);
        ion.approve(address(mine), ionFee);
        lpIonUsdt.approve(address(mine), 200 ether);
        mine.stake(poolIonUsdt, 200 ether, ionFee);
        vm.stopPrank();

        assertEq(ion.balanceOf(BURN), (ionFee * 3000) / 10_000);
    }

    function test_getPoolInfo_and_getUserInfo() public {
        (address lp,, uint256 total,,,, string memory name,, bool active) = mine.getPoolInfo(poolIonUsdt);
        assertEq(lp, address(lpIonUsdt));
        assertEq(total, 0);
        assertEq(name, "ION / USDT");
        assertTrue(active);

        vm.startPrank(user);
        lpIonUsdt.approve(address(mine), 50 ether);
        mine.stake(poolIonUsdt, 50 ether, 0);
        vm.stopPrank();

        (uint256 amount,, uint256 pending, uint256 stakedAt, bool lockupActive) = mine.getUserInfo(poolIonUsdt, user);
        assertEq(amount, 50 ether);
        assertEq(pending, 0);
        assertGt(stakedAt, 0);
        assertTrue(lockupActive);
    }

    function test_revert_when_paused() public {
        vm.prank(owner);
        admin.pause();

        vm.startPrank(user);
        lpIonUsdt.approve(address(mine), 10 ether);
        vm.expectRevert(bytes("Paused"));
        mine.stake(poolIonUsdt, 10 ether, 0);
        vm.stopPrank();
    }
}
