// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockERC20} from "../bsc/MockERC20.sol";
import {Dividend} from "../bsc/Dividend.sol";

contract DividendTest is Test {
    MockERC20 internal reward;
    Dividend internal dividend;

    address internal owner = address(this);
    address internal manager = address(0x1111);
    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    function setUp() public {
        reward = new MockERC20("ION", "ION", 18);
        dividend = new Dividend(address(reward));
        dividend.setShareManager(manager);
        reward.mint(owner, 1_000 ether);
        reward.approve(address(dividend), type(uint256).max);
    }

    function testOnlyShareManagerCanAssignShares() public {
        vm.prank(alice);
        vm.expectRevert(Dividend.IonDexUnauthorized.selector);
        dividend.stakeFor(alice, 100 ether);
    }

    function testRewardDistributionUsesManagedShares() public {
        vm.startPrank(manager);
        dividend.stakeFor(alice, 100 ether);
        dividend.stakeFor(bob, 300 ether);
        vm.stopPrank();

        dividend.depositReward(400 ether);

        vm.prank(alice);
        dividend.harvest();
        vm.prank(bob);
        dividend.harvest();

        assertEq(reward.balanceOf(alice), 100 ether);
        assertEq(reward.balanceOf(bob), 300 ether);
    }

    function testUnstakeForReducesSharesSafely() public {
        vm.startPrank(manager);
        dividend.stakeFor(alice, 200 ether);
        dividend.unstakeFor(alice, 50 ether);
        vm.stopPrank();

        assertEq(dividend.shares(alice), 150 ether);
        assertEq(dividend.totalShares(), 150 ether);
    }
}
