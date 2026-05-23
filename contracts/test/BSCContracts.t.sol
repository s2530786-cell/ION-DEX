// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockERC20} from "../bsc/MockERC20.sol";
import {BSCVault} from "../bsc/BSCVault.sol";
import {FeeReceiver} from "../bsc/FeeReceiver.sol";
import {BridgeRelay} from "../bsc/BridgeRelay.sol";

contract BSCContractsTest is Test {
    MockERC20 internal token;
    BSCVault internal vault;
    FeeReceiver internal feeReceiver;
    BridgeRelay internal relay;

    address internal owner = address(0xA11CE);
    address internal treasury = address(0xBEEF);
    address internal team = address(0xCAFE);
    address internal staking = address(0x570A);
    address internal keeper = address(0x5EE7);
    address internal user = address(0x75E7);

    function setUp() public {
        token = new MockERC20("ION", "ION", 18);
        vault = new BSCVault(owner);
        feeReceiver = new FeeReceiver(owner, treasury, team, staking, keeper);
        relay = new BridgeRelay(owner, address(vault), 1);
        vm.prank(owner);
        vault.setBridgeRelay(address(relay));
        vm.prank(owner);
        vault.setRelayer(address(relay), true);
        vm.prank(owner);
        relay.addRelayer(address(this));
        token.mint(user, 1_000_000 ether);
    }

    function test_lock_and_release_via_relay() public {
        bytes32 ionRecipient = bytes32(uint256(0x1234));
        vm.startPrank(user);
        token.approve(address(vault), 100 ether);
        vault.lock(address(token), 100 ether, ionRecipient);
        vm.stopPrank();

        bytes32 nonce = keccak256("msg-1");
        relay.attestInbound(nonce, address(token), user, 100 ether);

        assertEq(token.balanceOf(user), 1_000_000 ether);
        assertEq(vault.lockedBalance(address(token), user), 0);
        assertTrue(vault.releaseConsumed(nonce));
    }

    function test_fee_receiver_splits_bps() public {
        uint256 amount = 10_000 ether;
        vm.prank(user);
        token.approve(address(feeReceiver), amount);
        vm.prank(user);
        feeReceiver.distributeFees(address(token), amount);

        assertEq(token.balanceOf(address(0x000000000000000000000000000000000000dEaD)), (amount * 3500) / 10_000);
        assertEq(token.balanceOf(team), (amount * 2500) / 10_000);
        assertEq(token.balanceOf(staking), (amount * 2000) / 10_000);
        assertEq(token.balanceOf(treasury), (amount * 1500) / 10_000);
        assertEq(token.balanceOf(keeper), amount - (amount * 3500) / 10_000 - (amount * 2500) / 10_000 - (amount * 2000) / 10_000 - (amount * 1500) / 10_000);
    }

    function test_revert_duplicate_nonce() public {
        bytes32 nonce = keccak256("dup");
        vm.startPrank(user);
        token.approve(address(vault), 50 ether);
        vault.lock(address(token), 50 ether, bytes32(uint256(1)));
        vm.stopPrank();
        relay.attestInbound(nonce, address(token), user, 50 ether);
        vm.expectRevert(BridgeRelay.IonDexDuplicateNonce.selector);
        relay.attestInbound(nonce, address(token), user, 50 ether);
    }
}
