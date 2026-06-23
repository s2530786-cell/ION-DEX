// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockERC20} from "../bsc/MockERC20.sol";
import {AdminManager} from "../bsc/AdminManager.sol";
import {BSCVault} from "../bsc/BSCVault.sol";
import {BridgeRelay} from "../bsc/BridgeRelay.sol";
import {DexSwap} from "../bsc/DexSwap.sol";
import {LiquidityPool} from "../bsc/LiquidityPool.sol";
import {BatchTransfer} from "../bsc/BatchTransfer.sol";

contract AuditFixesTest is Test {
    address internal owner = address(0xA11CE);
    address internal user = address(0xB0B);
    address internal relayerA = address(0x1001);
    address internal relayerB = address(0x1002);

    function testBridgeRelayRequiresDistinctQuorumAttestations() public {
        MockERC20 token = new MockERC20("ION", "ION", 18);
        BSCVault vault = new BSCVault(owner);
        BridgeRelay relay = new BridgeRelay(owner, address(vault), 2);

        vm.startPrank(owner);
        vault.setRelayer(address(relay), true);
        relay.addRelayer(relayerA);
        relay.addRelayer(relayerB);
        vm.stopPrank();

        token.mint(user, 100 ether);
        vm.startPrank(user);
        token.approve(address(vault), 100 ether);
        vault.lock(address(token), 100 ether, bytes32(uint256(1)), 0);
        vm.stopPrank();

        bytes32 nonce = keccak256("quorum");

        vm.prank(relayerA);
        relay.attestInbound(nonce, address(token), user, 100 ether);
        assertEq(vault.lockedBalance(address(token), user), 100 ether);
        assertFalse(vault.releaseConsumed(nonce));

        vm.prank(relayerA);
        vm.expectRevert(BridgeRelay.IonDexDuplicateAttestation.selector);
        relay.attestInbound(nonce, address(token), user, 100 ether);

        vm.prank(relayerB);
        relay.attestInbound(nonce, address(token), user, 100 ether);
        assertEq(vault.lockedBalance(address(token), user), 0);
        assertTrue(vault.releaseConsumed(nonce));
    }

    function testLiquidityPoolMintsAgainstPreDepositReserves() public {
        MockERC20 tokenA = new MockERC20("A", "A", 18);
        MockERC20 tokenB = new MockERC20("B", "B", 18);
        AdminManager admin = new AdminManager(owner);
        LiquidityPool pool = new LiquidityPool("LP", "LP", address(tokenA), address(tokenB), address(admin), address(0));

        address lp1 = address(0x1111);
        address lp2 = address(0x2222);

        tokenA.mint(lp1, 1_000 ether);
        tokenB.mint(lp1, 1_000 ether);
        vm.startPrank(lp1);
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        uint256 firstMint = pool.addLiquidity(1_000 ether, 1_000 ether);
        vm.stopPrank();

        tokenA.mint(lp2, 100 ether);
        tokenB.mint(lp2, 100 ether);
        vm.startPrank(lp2);
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        uint256 secondMint = pool.addLiquidity(100 ether, 100 ether);
        vm.stopPrank();

        assertEq(secondMint, firstMint / 10);
    }

    function testDexSwapPaysOutFromPoolAndUsesPreSwapReserves() public {
        MockERC20 tokenA = new MockERC20("A", "A", 18);
        MockERC20 tokenB = new MockERC20("B", "B", 18);
        AdminManager admin = new AdminManager(owner);
        LiquidityPool pool = new LiquidityPool("LP", "LP", address(tokenA), address(tokenB), address(admin), address(0));
        DexSwap dex = new DexSwap(address(admin), address(pool));

        vm.prank(owner);
        pool.setDexContract(address(dex));

        tokenA.mint(owner, 1_000 ether);
        tokenB.mint(owner, 1_000 ether);
        vm.startPrank(owner);
        tokenA.approve(address(pool), type(uint256).max);
        tokenB.approve(address(pool), type(uint256).max);
        pool.addLiquidity(1_000 ether, 1_000 ether);
        vm.stopPrank();

        tokenA.mint(user, 100 ether);
        vm.startPrank(user);
        tokenA.approve(address(dex), type(uint256).max);
        uint256 amountOut = dex.swap(address(tokenA), address(tokenB), 100 ether, 0);
        vm.stopPrank();

        uint256 amountInAfterFee = (100 ether * 9_970) / 10_000;
        uint256 expectedOut = (amountInAfterFee * 1_000 ether) / (1_000 ether + amountInAfterFee);
        assertEq(amountOut, expectedOut);
        assertEq(tokenB.balanceOf(user), expectedOut);
        assertEq(tokenA.balanceOf(address(pool)), 1_100 ether);
        assertEq(tokenB.balanceOf(address(pool)), 1_000 ether - expectedOut);
    }

    function testBatchNativeRejectsExcessMsgValue() public {
        BatchTransfer batch = new BatchTransfer();
        address[] memory tos = new address[](2);
        tos[0] = address(0x1);
        tos[1] = address(0x2);
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1 ether;
        amounts[1] = 2 ether;

        vm.expectRevert(bytes("Value mismatch"));
        batch.batchNative{value: 4 ether}(tos, amounts);
    }
}
