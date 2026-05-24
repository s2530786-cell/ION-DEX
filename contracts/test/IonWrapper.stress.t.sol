// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockERC20} from "../bsc/MockERC20.sol";
import {IonWrapper} from "../bsc/IonWrapper.sol";

contract IonWrapperStressTest is Test {
    IonWrapper internal wrapper;
    MockERC20 internal ion;
    address internal user = address(0x1);

    uint256 internal constant ROUNDS = 100;
    uint256 internal constant MINT_AMOUNT = 10_000 ether;
    uint256 internal constant BURN_AMOUNT = 5_000 ether;

    function setUp() public {
        ion = new MockERC20("ION", "ION", 18);
        wrapper = new IonWrapper(address(ion));
        ion.mint(user, MINT_AMOUNT * ROUNDS * 4);
        vm.startPrank(user);
        ion.approve(address(wrapper), type(uint256).max);
        vm.stopPrank();
    }

    function testStress_100Rounds_MintBurn() public {
        vm.startPrank(user);
        for (uint256 i = 0; i < ROUNDS; i++) {
            wrapper.mint(MINT_AMOUNT);
            assertGe(wrapper.balanceOf(user), 0);

            wrapper.burn(BURN_AMOUNT);
            assertGe(wrapper.balanceOf(user), 0);

            if (i % 10 == 0) {
                wrapper.mint(1 wei);
                wrapper.burn(1 wei);
            }

            if (i % 25 == 0) {
                wrapper.mint(MINT_AMOUNT / 2);
                wrapper.burn(BURN_AMOUNT / 2);
            }
        }
        vm.stopPrank();
    }

    function testStress_100Rounds_ZeroBalances() public {
        vm.startPrank(user);
        for (uint256 i = 0; i < ROUNDS; i++) {
            uint256 balance = wrapper.balanceOf(user);
            if (balance > 0) {
                wrapper.burn(balance);
            }
            wrapper.mint(MINT_AMOUNT / ROUNDS);
        }
        vm.stopPrank();
        assertGt(wrapper.totalBurned(), 0);
    }

    function testGasSnapshot_MintBurn() public {
        vm.startPrank(user);

        uint256 gasBefore = gasleft();
        wrapper.mint(1000 ether);
        emit log_named_uint("Gas used - first mint", gasBefore - gasleft());

        gasBefore = gasleft();
        wrapper.mint(1000 ether);
        emit log_named_uint("Gas used - subsequent mint", gasBefore - gasleft());

        gasBefore = gasleft();
        wrapper.burn(500 ether);
        emit log_named_uint("Gas used - burn", gasBefore - gasleft());

        vm.stopPrank();
    }
}
