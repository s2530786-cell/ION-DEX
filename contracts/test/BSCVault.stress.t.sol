// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockERC20} from "../bsc/MockERC20.sol";
import {BSCVault} from "../bsc/BSCVault.sol";
import {BridgeRelay} from "../bsc/BridgeRelay.sol";

contract BSCVaultStressTest is Test {
    MockERC20 internal token;
    BSCVault internal vault;
    BridgeRelay internal relay;

    address internal owner = address(0xA11CE);
    address internal user = address(0x75E7);

    uint256 internal constant ROUNDS = 100;

    function setUp() public {
        token = new MockERC20("ION", "ION", 18);
        vault = new BSCVault(owner);
        relay = new BridgeRelay(owner, address(vault), 1);
        vm.startPrank(owner);
        vault.setBridgeRelay(address(relay));
        vault.setRelayer(address(relay), true);
        relay.addRelayer(address(this));
        vm.stopPrank();
        token.mint(user, 1_000_000_000 ether);
    }

    function testStress_100Rounds_LockRelease() public {
        vm.startPrank(user);
        token.approve(address(vault), type(uint256).max);
        vm.stopPrank();

        for (uint256 i = 0; i < ROUNDS; i++) {
            uint256 amount = 1 ether + (i % 50) * 1e15;
            bytes32 ionRecipient = bytes32(uint256(0x1000 + i));
            bytes32 nonce = keccak256(abi.encodePacked("stress", i));

            vm.startPrank(user);
            vault.lock(address(token), amount, ionRecipient, 0);
            vm.stopPrank();

            relay.attestInbound(nonce, address(token), user, amount);
            assertTrue(vault.releaseConsumed(nonce));
            assertEq(vault.lockedBalance(address(token), user), 0);
        }
    }

    function testStress_100Rounds_LpShares() public {
        for (uint256 i = 0; i < ROUNDS; i++) {
            int256 delta = int256(1 + (i % 20));
            vm.prank(owner);
            vault.adjustLpShares(user, delta);
            assertGe(vault.lpShares(user), 0);

            if (i % 7 == 0 && vault.lpShares(user) > 0) {
                vm.prank(owner);
                vault.adjustLpShares(user, -int256(1));
            }
        }
    }

    function testStress_LpSharesRejectsMinIntDelta() public {
        vm.prank(owner);
        vm.expectRevert();
        vault.adjustLpShares(user, type(int256).min);
    }

    function testGasSnapshot_LockRelease() public {
        vm.startPrank(user);
        token.approve(address(vault), type(uint256).max);
        vault.lock(address(token), 100 ether, bytes32(uint256(1)), 0);
        vm.stopPrank();

        uint256 gasBefore = gasleft();
        relay.attestInbound(keccak256("gas-1"), address(token), user, 100 ether);
        emit log_named_uint("Gas used - release via relay", gasBefore - gasleft());
    }
}
