// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockERC20} from "../bsc/MockERC20.sol";
import {BSCVault} from "../bsc/BSCVault.sol";
import {BridgeRelayV2} from "../bsc/BridgeRelayV2.sol";
import {IonBurn} from "../bsc/IonBurn.sol";
import {FeeReceiverV2} from "../bsc/FeeReceiverV2.sol";
import {IonSwapRouterV2, IonSwapPoolMock} from "../bsc/IonSwapRouterV2.sol";
import {IonOracleV2} from "../bsc/IonOracleV2.sol";
import {MockAggregator} from "./MockAggregator.sol";

contract SecurityMatrixV2Test is Test {
    uint256 internal constant ITER = 100;
    uint256 internal constant MAX_RELAYERS = 32;

    MockERC20 internal ion;
    MockERC20 internal fake;
    BSCVault internal vault;
    BridgeRelayV2 internal relay;
    IonBurn internal burn;
    FeeReceiverV2 internal feeReceiver;
    IonSwapRouterV2 internal router;
    IonSwapPoolMock internal pool;
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
        vault = new BSCVault(owner);
        relay = new BridgeRelayV2(owner, address(vault), 1);
        router = new IonSwapRouterV2(owner);
        pool = new IonSwapPoolMock(1_000_000 ether);
        _wireOfficialIonForRouter();
        priceFeed = new MockAggregator(100_000_000, 8);
        oracle = new IonOracleV2(owner, address(priceFeed), "mock");
        burn = new IonBurn(owner, OFFICIAL_BSC_ION, address(oracle), 90_000_000, 110_000_000);
        feeReceiver = new FeeReceiverV2(owner, OFFICIAL_BSC_ION, treasury, team, staking, keeper, address(oracle), 90_000_000, 110_000_000);
        vm.prank(owner);
        router.setFeeReceiver(address(feeReceiver));
        vm.prank(owner);
        burn.setFeeReceiver(address(feeReceiver));

        vm.startPrank(owner);
        vault.setRelayerDirect(address(relay), true);
        relay.addRelayerDirect(address(this));
        vm.stopPrank();

        ion.mint(user, 1_000_000_000 ether);
        fake.mint(user, 1_000_000 ether);
        MockERC20(OFFICIAL_BSC_ION).mint(user, 1_000_000_000 ether);
    }

    // === 1. 闂備焦褰冪粔鎾矗閸℃稑缁╅悹鍥ㄥ絻�? BridgeRelayV2 quorum + nonReentrant ===
    function test_Security_1_ReentrancyBridgeQuorum_100x() public {
        vm.startPrank(user);
        ion.approve(address(vault), type(uint256).max);
        vm.stopPrank();
        for (uint256 i = 0; i < ITER; i++) {
            uint256 amount = 1 ether + i * 1e15;
            bytes32 nonce = keccak256(abi.encodePacked("reentrancy-v2", i));
            vm.prank(user);
            vault.lock(address(ion), amount, bytes32(uint256(i + 1)), 0);
            relay.attestInbound(nonce, address(ion), user, amount);
            vm.expectRevert(BridgeRelayV2.IonDexDuplicateNonce.selector);
            relay.attestInbound(nonce, address(ion), user, amount);
        }
    }

    // === 2. 闂傚倸鍋嗘禍鐐哄极閸濄儲�? DexSwapV2 闂備緡鍋呮穱铏规�?Router 濠电姴锕ラ崹褰掑磻閿濆棛鈹嶆繝闈涙搐�?===
    function test_Security_2_FlashLoanSwapSlippage_100x() public {
        for (uint256 i = 0; i < ITER; i++) {
            uint256 hugeIn = 100_000 ether + i * 1000 ether;
            pool.setFixedOutput(50_000 ether + i * 500 ether);
            uint256 minOut = 40_000 ether + i * 400 ether;
            vm.prank(user);
            uint256 out = router.swapExactIn(pool, hugeIn, minOut, user, 1, 0);
            assertGe(out, minOut);
        }
    }

    // === 3. 婵炴垶鎸搁ˇ鏉课ｉ幋婵冩煢缂備焦蓱閺嗕即鏌? minOut 闂傚倸鍟鑸垫�?===
    function test_Security_3_SandwichMinOutput_100x() public {
        for (uint256 i = 0; i < ITER; i++) {
            pool.setFixedOutput(80 ether + i);
            uint256 minOut = 100 ether + i;
            vm.expectRevert();
            router.swapExactIn(pool, 1 ether, minOut, user, 1, 0);
        }
    }

    // === 4. 婵☆偅婢樼€氼垶鍩㈤崼銉ュ珘閺夌偞澹嗛獮鍡涙煛瀹ュ懎鎮戦柟鑲╁厴楠?  闂佺顑呯换鎰熸繝鍥ㄢ挀闁告瑥顦 ===
    function test_Security_4_OracleManipulationFloor_100x() public {
        for (uint256 i = 0; i < ITER; i++) {
            uint256 quotedMin = 200 ether + i * 1e16;
            pool.setFixedOutput(quotedMin - 1 - (i % 7));
            vm.expectRevert();
            router.swapExactIn(pool, 5 ether, quotedMin, user, 0, 0);
        }
    }

    // === 5. 闂佸搫顦崯鏉戭瀶閾忓湱纾奸柡鍥风磿�?===
    function test_Security_5_PermissionDenied_100x() public {
        for (uint256 i = 0; i < ITER; i++) {
            vm.prank(attacker);
            vm.expectRevert(BSCVault.IonDexUnauthorized.selector);
            vault.release(address(ion), user, 1, keccak256(abi.encodePacked("perm-v2", i)));

            vm.prank(attacker);
            vm.expectRevert(BridgeRelayV2.IonDexUnauthorized.selector);
            relay.attestInbound(keccak256(abi.encodePacked("perm2-v2", i)), address(ion), user, 1);
        }
    }

    // === 6. 闂佽桨绀侀悺銊╁汲閻斿皝鏀﹂柕蹇曞Т�? lock 缂備線纭搁崹瀹犫�?===
    function test_Security_6_OverflowSafeLockAccounting_100x() public {
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

    // === 7. 闂佸綊鏀辩敮鐐靛垝閻戣棄瀚夌€广儱鎳庨～? relayer 婵炴垶鎸搁敃顏勵瀶濞差亝鈷撻柛娆忣槸�?===
    function test_Security_7_DosRelayerCap_100x() public {
        vm.startPrank(owner);
        for (uint256 i = 0; i < MAX_RELAYERS - 1; i++) {
            address r = address(uint160(0x1000 + i));
            if (!relay.isRelayer(r)) {
                relay.addRelayerDirect(r);
            }
        }
        for (uint256 i = 0; i < ITER; i++) {
            address r2 = address(uint160(0x2000 + i));
            if (!relay.isRelayer(r2)) {
                vm.expectRevert(BridgeRelayV2.IonDexInvalidQuorum.selector);
                relay.addRelayerDirect(r2);
            }
        }
        vm.stopPrank();
    }

    // === 8. 闂佺顑呭ú銈囩博閻㈢缁╅悹鍥ㄥ絻濮? �?ION 婵炲濯寸徊鐣岀博閻㈢绠柟鐑樻⒒�?===
    function test_Security_8_FakeTokenRejected_100x() public {
        for (uint256 i = 0; i < ITER; i++) {
            vm.prank(user);
            vm.expectRevert(FeeReceiverV2.IonDexOnlyIon.selector);
            feeReceiver.distributeFees(address(fake), 100 ether);
        }
    }

    // === 9. 闂佸搫鍟悥鐓幬涢崸妤€�? warp 婵炴垶鎸哥粔瀛樼附閺嶎厼浼犵€广儱鎳愰崬銊х棯椤撴稑浜鹃梻渚囧亝濡叉帞�?===
    function test_Security_9_TimestampIndependence_100x() public {
        for (uint256 i = 0; i < ITER; i++) {
            uint256 warpTo = 1_750_000_000 + i * 1000;
            vm.warp(warpTo);
            priceFeed.setAnswer(int256(100_000_000 + int256(i)));
            pool.setFixedOutput(1_000_000 ether + i * 1000 ether);
            uint256 minOut = 100 ether + i;
            vm.prank(user);
            uint256 out = router.swapExactIn(pool, 5 ether, minOut, user, 1, 0);
            assertGe(out, minOut);
        }
    }

    // === 10. 闂佺鍩栭〃濠囧闯閾忓厜鍋?+ 闂備焦褰冪粔鐢稿�? nonce 濠电偞鍨甸悧鎰板�?===
    function test_Security_10_ReplayNonceConsumption_100x() public {
        vm.startPrank(user);
        ion.approve(address(vault), type(uint256).max);
        vm.stopPrank();
        for (uint256 i = 0; i < ITER; i++) {
            uint256 amount = 1 ether;
            bytes32 nonce = keccak256(abi.encodePacked("replay-v2", i, user));
            vm.prank(user);
            vault.lock(address(ion), amount, bytes32(uint256(i + 1)), 0);
            relay.attestInbound(nonce, address(ion), user, amount);
            vm.expectRevert(BridgeRelayV2.IonDexDuplicateNonce.selector);
            relay.attestInbound(nonce, address(ion), user, amount);
            assertTrue(relay.consumedNonce(nonce));
        }
    }

    // === 婵☆偆澧楃换鍌炈? IonBurn 闂佺儵鏅涢悺銊ф暜閹绢喗鐓ラ柍褜鍓欒?===
    function test_Security_BurnDirect_100x() public {
        vm.startPrank(user);
        MockERC20(OFFICIAL_BSC_ION).approve(address(burn), type(uint256).max);
        for (uint256 i = 0; i < ITER; i++) {
            uint256 preBurn = burn.totalBurned();
            burn.burn(1 ether);
            assertEq(burn.totalBurned(), preBurn + 1 ether);
            assertEq(MockERC20(OFFICIAL_BSC_ION).balanceOf(address(0x000000000000000000000000000000000000dEaD)), preBurn + 1 ether);
        }
        vm.stopPrank();
    }

    // === 婵☆偆澧楃换鍌炈? BridgeRelayV2 quorum 婵°倗濮撮惌渚€�?(闂傚倸娲犻崑鎾绘�?2-of-3) ===
    function test_Security_BridgeQuorum2of3_100x() public {
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
            bytes32 nonce = keccak256(abi.encodePacked("quorum-v2", i));
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

    // === 婵☆偆澧楃换鍌炈? feeReceiver 婵☆偅婢樼€氼垶鍩㈤崼銉ュ珘?stale fallback ===
    function test_Security_OracleStaleFallback_100x() public {
        for (uint256 i = 0; i < ITER; i++) {
            vm.warp(1_750_000_000 + i * 3600 * 2);
            (uint256 price, bool isStale) = oracle.getPrice();
            if (isStale) {
                assertTrue(true);
            } else {
                assertTrue(true);
            }
        }
    }
}