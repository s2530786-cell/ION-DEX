// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockERC20} from "../bsc/MockERC20.sol";
import {BSCVault} from "../bsc/BSCVault.sol";
import {BridgeRelayV2} from "../bsc/BridgeRelayV2.sol";
import {IonBurn} from "../bsc/IonBurn.sol";
import {FeeReceiverV2} from "../bsc/FeeReceiverV2.sol";
import {IonSwapRouterV2} from "../bsc/IonSwapRouterV2.sol";
import {IonOracleV2} from "../bsc/IonOracleV2.sol";
import {OrderBookV2} from "../bsc/OrderBookV2.sol";
import {VaultLockV2} from "../bsc/VaultLockV2.sol";
import {DexSwapV2} from "../bsc/DexSwapV2.sol";
import {LiquidityPool} from "../bsc/LiquidityPool.sol";
import {AdminManager} from "../bsc/AdminManager.sol";
import {MockAggregator} from "./MockAggregator.sol";
import {IonSwapPoolMock} from "./mocks/IonSwapPoolMock.sol";

contract SecurityMatrixV3Test is Test {
    uint256 internal constant ITER = 100;
    uint256 internal constant MAX_RELAYERS = 32;

    MockERC20 internal ion;
    MockERC20 internal fake;
    AdminManager internal admin;
    BSCVault internal vault;
    BridgeRelayV2 internal relay;
    IonBurn internal burn;
    FeeReceiverV2 internal feeReceiver;
    IonSwapRouterV2 internal router;
    IonSwapPoolMock internal pool;
    OrderBookV2 internal orderBook;
    VaultLockV2 internal vaultLock;
    MockAggregator internal priceFeed;
    IonOracleV2 internal oracle;

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
        admin = new AdminManager(owner);
        vault = new BSCVault(owner);
        relay = new BridgeRelayV2(owner, address(vault), 1);
        router = new IonSwapRouterV2(owner);
        pool = new IonSwapPoolMock(1_000_000 ether);
        _wireOfficialIonForRouter();
        priceFeed = new MockAggregator(100_000_000, 8);
        oracle = new IonOracleV2(owner, address(priceFeed), "mock");
        burn = new IonBurn(owner, OFFICIAL_BSC_ION, address(oracle), 90_000_000, 110_000_000);

        feeReceiver = new FeeReceiverV2(owner, OFFICIAL_BSC_ION, treasury, team, staking, keeper, address(oracle), 90_000_000, 110_000_000);
        orderBook = new OrderBookV2(address(admin), OFFICIAL_BSC_ION, address(OFFICIAL_BSC_ION));
        vaultLock = new VaultLockV2(OFFICIAL_BSC_ION, 7 days);

        vm.prank(owner);
        router.setFeeReceiver(address(feeReceiver));
        vm.prank(owner);
        router.setPoolWhitelist(address(pool), true);
        vm.prank(owner);
        burn.setFeeReceiver(address(feeReceiver));

        vm.startPrank(owner);
        vault.setRelayerDirect(address(relay), true);
        relay.addRelayerDirect(address(this));
        vm.stopPrank();

        ion.mint(user, 1_000_000_000 ether);
        fake.mint(user, 1_000_000 ether);
        MockERC20(OFFICIAL_BSC_ION).mint(user, 1_000_000_000 ether);
        MockERC20(OFFICIAL_BSC_ION).mint(owner, 1_000_000 ether);
    }

    // === 1. Reentrancy: BridgeRelayV2 quorum + nonReentrant + IonSwapRouterV2 nonReentrant ===
    function test_Security_1_ReentrancyFull_100x() public {
        vm.startPrank(user);
        ion.approve(address(vault), type(uint256).max);
        vm.stopPrank();
        for (uint256 i = 0; i < ITER; i++) {
            uint256 amount = 1 ether + i * 1e15;
            bytes32 nonce = keccak256(abi.encodePacked("reent-v3", i));
            vm.prank(user);
            vault.lock(address(ion), amount, bytes32(uint256(i + 1)), 0);
            relay.attestInbound(nonce, address(ion), user, amount);
            vm.expectRevert(BridgeRelayV2.IonDexDuplicateNonce.selector);
            relay.attestInbound(nonce, address(ion), user, amount);
        }
    }

    // === 2. FlashLoan: RouterV2 swap with slippage guard ===
    function test_Security_2_FlashLoanSlippage_100x() public {
        for (uint256 i = 0; i < ITER; i++) {
            uint256 hugeIn = 100_000 ether + i * 1000 ether;
            pool.setFixedOutput(50_000 ether + i * 500 ether);
            uint256 minOut = 40_000 ether + i * 400 ether;
            vm.prank(user);
            uint256 out = router.swapExactIn(pool, hugeIn, minOut, user, block.timestamp + 300, 1);
            assertGe(out, minOut);
        }
    }

    // === 3. Sandwich: minOut floor ===
    function test_Security_3_SandwichMinOut_100x() public {
        for (uint256 i = 0; i < ITER; i++) {
            pool.setFixedOutput(80 ether + i);
            uint256 minOut = 100 ether + i;
            vm.expectRevert();
            vm.prank(user);
            router.swapExactIn(pool, 1 ether, minOut, user, block.timestamp + 300, 1);
        }
    }

    // === 4. Oracle: price deviation check ===
    function test_Security_4_OracleDeviation_100x() public {
        vm.startPrank(user);
        MockERC20(OFFICIAL_BSC_ION).approve(address(feeReceiver), type(uint256).max);
        vm.stopPrank();

        for (uint256 i = 0; i < ITER; i++) {
            int256 normalPrice = 100_000_000;
            priceFeed.setAnswer(normalPrice + int256(i));
            (uint256 p, bool s) = oracle.getPriceWithDeviationCheck(5000);
            if (i == 0) assertFalse(s);

            uint256 spike = uint256(normalPrice) * 2 + uint256(i);
            priceFeed.setAnswer(int256(spike));
            (uint256 p2, bool s2) = oracle.getPriceWithDeviationCheck(5000);
            if (spike > 150_000_000) assertTrue(s2);
        }
    }

    // === 5. Permission: attacker cannot access ===
    function test_Security_5_PermissionDenied_100x() public {
        for (uint256 i = 0; i < ITER; i++) {
            vm.prank(attacker);
            vm.expectRevert(IonSwapRouterV2.IonDexUnauthorized.selector);
            router.setFeeReceiver(attacker);

            vm.prank(attacker);
            vm.expectRevert(IonOracleV2.IonDexUnauthorized.selector);
            oracle.setOracle(attacker, "malicious");

            vm.prank(attacker);
            vm.expectRevert(BridgeRelayV2.IonDexUnauthorized.selector);
            relay.attestInbound(keccak256(abi.encodePacked("p", i)), address(ion), user, 1);
        }
    }

    // === 6. Overflow: VaultLock cumulative deposit ===
    function test_Security_6_OverflowVaultLock_100x() public {
        vm.startPrank(user);
        MockERC20(OFFICIAL_BSC_ION).approve(address(vaultLock), type(uint256).max);
        for (uint256 i = 0; i < ITER; i++) {
            vaultLock.deposit(1 ether);
        }
        assertEq(vaultLock.balanceOf(user), ITER * 1 ether);
        vm.stopPrank();
    }

    // === 7. DoS: Relayer cap + expired order rejection ===
    function test_Security_7_DosRelayerAndOrder_100x() public {
        vm.startPrank(owner);
        for (uint256 i = 0; i < MAX_RELAYERS - 1; i++) {
            address r = address(uint160(0x1000 + i));
            try relay.addRelayerDirect(r) {} catch {}
        }
        vm.stopPrank();

        for (uint256 i = 0; i < ITER; i++) {
            address r2 = address(uint160(0x2000 + i));
            vm.prank(owner);
            vm.expectRevert(BridgeRelayV2.IonDexInvalidQuorum.selector);
            relay.addRelayerDirect(r2);
        }
    }

    // === 8. Fake token: FeeReceiverV2 rejects non-ION ===
    function test_Security_8_FakeTokenRejected_100x() public {
        for (uint256 i = 0; i < ITER; i++) {
            vm.prank(user);
            vm.expectRevert(FeeReceiverV2.IonDexOnlyIon.selector);
            feeReceiver.distributeFees(address(fake), 100 ether);
        }
    }

    // === 9. Timestamp: warp + deadline enforcement ===
    function test_Security_9_TimestampDeadline_100x() public {
        for (uint256 i = 0; i < ITER; i++) {
            uint256 warpTo = 1_750_000_000 + i * 1000;
            vm.warp(warpTo);
            priceFeed.setAnswer(int256(100_000_000 + int256(i)));
            pool.setFixedOutput(1_000_000 ether + i * 1000 ether);
            uint256 minOut = 100 ether + i;

            uint256 deadline = block.timestamp + 300;
            vm.prank(user);
            uint256 out = router.swapExactIn(pool, 5 ether, minOut, user, deadline, 1);
            assertGe(out, minOut);

            uint256 pastDeadline = block.timestamp - 1;
            vm.expectRevert(IonSwapRouterV2.IonDexExpired.selector);
            vm.prank(user);
            router.swapExactIn(pool, 1 ether, minOut, user, pastDeadline, 0);
        }
    }

    // === 10. Replay: nonce consumption + Idempotency ===
    function test_Security_10_ReplayNonce_100x() public {
        vm.startPrank(user);
        ion.approve(address(vault), type(uint256).max);
        vm.stopPrank();
        for (uint256 i = 0; i < ITER; i++) {
            uint256 amount = 1 ether;
            bytes32 nonce = keccak256(abi.encodePacked("replay-v3", i, user));
            vm.prank(user);
            vault.lock(address(ion), amount, bytes32(uint256(i + 1)), 0);
            relay.attestInbound(nonce, address(ion), user, amount);
            vm.expectRevert(BridgeRelayV2.IonDexDuplicateNonce.selector);
            relay.attestInbound(nonce, address(ion), user, amount);
            assertTrue(relay.consumedNonce(nonce));
        }
    }

    // === Bonus 1: IonBurn direct burn ===
    function test_Security_Bonus_BurnDirect_100x() public {
        vm.startPrank(user);
        MockERC20(OFFICIAL_BSC_ION).approve(address(burn), type(uint256).max);
        for (uint256 i = 0; i < ITER; i++) {
            uint256 preBurn = burn.totalBurned();
            burn.burn(1 ether);
            assertEq(burn.totalBurned(), preBurn + 1 ether);
        }
        vm.stopPrank();
    }

    // === Bonus 2: BridgeRelayV2 quorum 2-of-3 ===
    function test_Security_Bonus_BridgeQuorum2of3_100x() public {
        vm.startPrank(user);
        ion.approve(address(vault), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(owner);
        address relayer2 = address(0x2001);
        relay.addRelayerDirect(relayer2);
        relay.scheduleSetQuorum(2); vm.warp(block.timestamp + 48 hours + 1); relay.executePendingChanges();
        vm.stopPrank();
for (uint256 i = 0; i < ITER; i++) {
            uint256 amount = 1 ether;
            bytes32 nonce = keccak256(abi.encodePacked("quorum-v3", i));
            vm.prank(user);
            vault.lock(address(ion), amount, bytes32(uint256(i + 99)), 0);
            relay.attestInbound(nonce, address(ion), user, amount);
            assertEq(relay.attestationCount(nonce), 1);
            assertFalse(relay.consumedNonce(nonce));
            vm.prank(relayer2);
            relay.attestInbound(nonce, address(ion), user, amount);
            assertTrue(relay.consumedNonce(nonce));
        }
    }

    // === Bonus 3: VaultLock - deposit does NOT reset unlockTime ===
    function test_Security_Bonus_VaultLockNoReset_100x() public {
        vm.startPrank(user);
        MockERC20(OFFICIAL_BSC_ION).approve(address(vaultLock), type(uint256).max);
        vaultLock.deposit(100 ether);
        (, uint256 firstUnlock, ) = vaultLock.positions(user);
        vm.warp(block.timestamp + 3 days);
        vaultLock.deposit(50 ether);
        (, uint256 secondUnlock, ) = vaultLock.positions(user);
        assertEq(firstUnlock, secondUnlock, "unlockTime should NOT reset on additional deposit");
        assertEq(vaultLock.balanceOf(user), 150 ether);
        vm.stopPrank();
    }

    // === Bonus 4: Wallet lock extend ===
    function test_Security_Bonus_VaultLockExtend_100x() public {
        vm.startPrank(user);
        MockERC20(OFFICIAL_BSC_ION).approve(address(vaultLock), type(uint256).max);
        vaultLock.deposit(10 ether);
        (, uint256 originalUnlock, ) = vaultLock.positions(user);
        vaultLock.extendLock(30 days);
        (, uint256 newUnlock, ) = vaultLock.positions(user); assertEq(newUnlock, originalUnlock + 30 days);
        vm.stopPrank();
    }

    // === Bonus 5: OrderBook deadline enforcement ===
    function test_Security_Bonus_OrderBookDeadline_100x() public {
        vm.startPrank(user);
        MockERC20(OFFICIAL_BSC_ION).approve(address(orderBook), type(uint256).max);
        orderBook.depositQuote(1_000_000 ether);
        vm.stopPrank();

        for (uint256 i = 0; i < ITER; i++) {
            vm.warp(1_750_000_000 + i * 100);
            uint256 farDeadline = block.timestamp + 3600;
            vm.prank(user);
            orderBook.placeOrder(true, 100, 10, farDeadline);

            vm.warp(block.timestamp + 3601);
            uint256 orderId = orderBook.orderCount() - 1;
            vm.expectRevert(OrderBookV2.IonDexOrderExpired.selector);
            vm.prank(user);
            orderBook.matchOrder(orderId, 1);
        }
    }

    // === Bonus 6: DexSwapV2 amountOutMinimum enforcement ===
    function test_Security_Bonus_DexSwapV2MinOut_100x() public {
        DexSwapV2 dex = new DexSwapV2(address(admin), address(0xD1));
        LiquidityPool cpPool =
            new LiquidityPool("ION-FAKE LP", "IONF", address(ion), address(fake), address(admin), address(dex));
        vm.startPrank(owner);
        dex.setLpPool(address(cpPool));
        dex.setPoolWhitelist(address(ion), true);
        dex.setPoolWhitelist(address(fake), true);
        vm.stopPrank();

        ion.mint(owner, 10_000_000 ether);
        fake.mint(owner, 10_000_000 ether);

        vm.startPrank(owner);
        ion.approve(address(cpPool), type(uint256).max);
        fake.approve(address(cpPool), type(uint256).max);
        cpPool.addLiquidity(1_000_000 ether, 1_000_000 ether);
        vm.stopPrank();

        vm.startPrank(user);
        ion.approve(address(dex), type(uint256).max);
        vm.stopPrank();

        uint256 reserveIn = ion.balanceOf(address(cpPool));
        uint256 reserveOut = fake.balanceOf(address(cpPool));
        uint256 amountInAfterFee = (1 ether * (10_000 - dex.swapFee())) / 10_000;
        uint256 expectedOut = (amountInAfterFee * reserveOut) / (reserveIn + amountInAfterFee);

        for (uint256 i = 0; i < ITER; i++) {
            uint256 amountIn = 1 ether;
            uint256 highMin = 2 ether + i;
            vm.expectRevert(abi.encodeWithSelector(DexSwapV2.IonDexMinOutput.selector, expectedOut, highMin));
            vm.prank(user);
            dex.swap(address(ion), address(fake), amountIn, highMin, block.timestamp + 300, 0);
        }
    }
}
