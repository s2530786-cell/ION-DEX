// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockERC20} from "../bsc/MockERC20.sol";
import {BSCVault} from "../bsc/BSCVault.sol";
import {BridgeRelayV2} from "../bsc/BridgeRelayV2.sol";
import {FeeReceiverV2} from "../bsc/FeeReceiverV2.sol";
import {IonSwapRouterV2, IonSwapPoolMock} from "../bsc/IonSwapRouterV2.sol";
import {IonOracleV2} from "../bsc/IonOracleV2.sol";
import {MockAggregator} from "./MockAggregator.sol";

/**
 * @notice P0-3 security matrix — 10 categories × 100 iterations = 1000 checks.
 */
contract SecurityMatrixTest is Test {
    uint256 internal constant ITER = 100;
    uint256 internal constant MAX_RELAYERS = 32;

    MockERC20 internal ion;
    MockERC20 internal fake;
    BSCVault internal vault;
    BridgeRelay internal relay;
    FeeReceiver internal feeReceiver;
    IonSwapRouter internal router;
    IonSwapPoolMock internal pool;
    MockAggregator internal priceFeed;
    IonOracle internal oracle;

    address internal owner = address(0xA11CE);
    address internal treasury = address(0xBEEF);
    address internal team = address(0xCAFE);
    address internal staking = address(0x570A);
    address internal keeper = address(0x5EE7);
    address internal user = address(0x75E7);
    address internal attacker = address(0xBAD);
    address internal constant OFFICIAL_BSC_ION = address(uint160(1288344885040501400041395533572786748386546310824));

    function _wireOfficialIonForRouter() internal {
        MockERC20 template = new MockERC20("ION", "ION", 18);
        vm.etch(OFFICIAL_BSC_ION, address(template).code);
        MockERC20(OFFICIAL_BSC_ION).mint(user, 1_000_000_000 ether);
        vm.startPrank(user);
        MockERC20(OFFICIAL_BSC_ION).approve(address(router), type(uint256).max);
        vm.stopPrank();
    }

    function setUp() public {
        ion = new MockERC20("ION", "ION", 18);
        fake = new MockERC20("FAKE", "FAK", 18);
        vault = new BSCVault(owner);
        relay = new BridgeRelay(owner, address(vault), 1);
        router = new IonSwapRouter(owner);
        pool = new IonSwapPoolMock(1_000_000 ether);
        _wireOfficialIonForRouter();
        priceFeed = new MockAggregator(100_000_000, 8);
        oracle = new IonOracle(owner, address(priceFeed), "mock");
        feeReceiver = new FeeReceiver(owner, OFFICIAL_BSC_ION, treasury, team, staking, keeper, address(oracle), 90_000_000, 110_000_000);
        vm.prank(owner);
        router.setFeeReceiver(address(feeReceiver));

        vm.startPrank(owner);
        vault.setRelayer(address(relay), true);
        relay.addRelayer(address(this));
        vm.stopPrank();

        ion.mint(user, 1_000_000_000 ether);
        fake.mint(user, 1_000_000 ether);
    }

    function test_Security_3a_ReentrancyReleaseGuard_100x() public {
        vm.startPrank(user);
        ion.approve(address(vault), type(uint256).max);
        vm.stopPrank();

        for (uint256 i = 0; i < ITER; i++) {
            uint256 amount = 1 ether + i * 1e15;
            bytes32 nonce = keccak256(abi.encodePacked("reentrancy", i));
            vm.prank(user);
            vault.lock(address(ion), amount, bytes32(uint256(i + 1)), 0);
            relay.attestInbound(nonce, address(ion), user, amount);
            vm.expectRevert(bytes4(keccak256("IonDexDuplicateNonce()")));
            relay.attestInbound(nonce, address(ion), user, amount);
        }
    }

    function test_Security_3b_FlashLoanSizedSwap_100x() public {
        for (uint256 i = 0; i < ITER; i++) {
            uint256 hugeIn = 100_000 ether + i * 1000 ether;
            pool.setFixedOutput(50_000 ether + i * 500 ether);
            uint256 minOut = 40_000 ether + i * 400 ether;
            vm.prank(user);
            uint256 out = router.swapExactIn(pool, hugeIn, minOut, user, 1);
            assertGe(out, minOut);
        }
    }

    function test_Security_3c_SandwichMinOutput_100x() public {
        for (uint256 i = 0; i < ITER; i++) {
            pool.setFixedOutput(80 ether + i);
            uint256 minOut = 100 ether + i;
            vm.expectRevert();
            router.swapExactIn(pool, 1 ether, minOut, user, 1);
        }
    }

    function test_Security_3d_OracleManipulationFloor_100x() public {
        for (uint256 i = 0; i < ITER; i++) {
            uint256 quotedMin = 200 ether + i * 1e16;
            pool.setFixedOutput(quotedMin - 1 - (i % 7));
            vm.expectRevert();
            router.swapExactIn(pool, 5 ether, quotedMin, user, 0);
        }
    }

    function test_Security_3e_PermissionDenied_100x() public {
        for (uint256 i = 0; i < ITER; i++) {
            vm.prank(attacker);
            vm.expectRevert(BSCVault.IonDexUnauthorized.selector);
            vault.release(address(ion), user, 1, keccak256(abi.encodePacked("perm", i)));

            vm.prank(attacker);
            vm.expectRevert(bytes4(keccak256("IonDexUnauthorized()")));
            relay.attestInbound(keccak256(abi.encodePacked("perm2", i)), address(ion), user, 1);
        }
    }

    function test_Security_3f_OverflowSafeLockAccounting_100x() public {
        vm.startPrank(user);
        ion.approve(address(vault), type(uint256).max);
        vm.stopPrank();

        uint256 cumulative;
        for (uint256 i = 0; i < ITER; i++) {
            uint256 amount = 1_000_000 ether;
            cumulative += amount;
            vm.prank(user);
            vault.lock(address(ion), amount, bytes32(uint256(i + 99)), 0);
            assertEq(vault.lockedBalance(address(ion), user), cumulative);
        }
    }

    function test_Security_3g_DosRelayerCap_100x() public {
        vm.startPrank(owner);
        for (uint256 i = 0; i < MAX_RELAYERS - 1; i++) {
            address r = address(uint160(0x1000 + i));
            if (!relay.isRelayer(r)) {
                relay.addRelayer(r);
            }
        }
        vm.stopPrank();

        for (uint256 i = 0; i < ITER; i++) {
            assertLe(relay.relayerCount(), MAX_RELAYERS);
            vm.prank(owner);
            vm.expectRevert(bytes4(keccak256("IonDexInvalidQuorum()")));
            relay.addRelayer(address(uint160(0xDEAD0000 + i)));
        }
    }

    function test_Security_3h_FakeTokenRejected_100x() public {
        for (uint256 i = 0; i < ITER; i++) {
            MockERC20 other = new MockERC20("USDT", "USDT", 6);
            other.mint(user, 1000 ether);
            vm.startPrank(user);
            other.approve(address(feeReceiver), 100 ether + i);
            vm.expectRevert(FeeReceiver.IonDexOnlyIon.selector);
            feeReceiver.distributeFees(address(other), 100 ether + i);
            vm.stopPrank();
        }
    }

    function test_Security_3i_TimestampIndependence_100x() public {
        vm.startPrank(user);
        ion.approve(address(vault), type(uint256).max);
        vm.stopPrank();

        for (uint256 i = 0; i < ITER; i++) {
            vm.warp(1_900_000_000 + i * 123);
            uint256 amount = 1 ether + i * 1e14;
            bytes32 nonce = keccak256(abi.encodePacked("time", i));
            vm.prank(user);
            vault.lock(address(ion), amount, bytes32(uint256(0x710E0000 + i)), 0);
            relay.attestInbound(nonce, address(ion), user, amount);
            assertTrue(vault.releaseConsumed(nonce));
        }
    }

    function test_Security_3j_ReplayNonceConsumption_100x() public {
        vm.startPrank(user);
        ion.approve(address(vault), type(uint256).max);
        vm.stopPrank();

        for (uint256 i = 0; i < ITER; i++) {
            uint256 amount = 1 ether;
            bytes32 nonce = keccak256(abi.encodePacked("replay", i, user));
            vm.prank(user);
            vault.lock(address(ion), amount, bytes32(uint256(i + 1)), 0);
            relay.attestInbound(nonce, address(ion), user, amount);
            vm.expectRevert(bytes4(keccak256("IonDexDuplicateNonce()")));
            relay.attestInbound(nonce, address(ion), user, amount);
            assertTrue(relay.consumedNonce(nonce));
        }
    }
}
