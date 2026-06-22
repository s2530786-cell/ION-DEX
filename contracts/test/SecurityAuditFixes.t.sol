// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {BridgeIONConnector} from "../bsc/BridgeIONConnector.sol";
import {IonOracleV2} from "../bsc/IonOracleV2.sol";
import {IonSwapRouterV2} from "../bsc/IonSwapRouterV2.sol";
import {MockAggregator} from "./MockAggregator.sol";
import {IonSwapPoolMock} from "./mocks/IonSwapPoolMock.sol";

contract SecurityAuditFixesTest is Test {
    event BridgeRelayUpdated(address indexed previousRelay, address indexed newRelay);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    BridgeIONConnector internal connector;
    IonOracleV2 internal oracle;
    MockAggregator internal primaryFeed;
    MockAggregator internal backupFeed;
    IonSwapRouterV2 internal router;
    IonSwapPoolMock internal pool;

    address internal owner = address(0xA11CE);
    address internal relayer = address(0xBEEF);

    function setUp() public {
        connector = new BridgeIONConnector(owner, address(0xCAFE));
        primaryFeed = new MockAggregator(100_000_000, 8);
        backupFeed = new MockAggregator(101_000_000, 8);
        oracle = new IonOracleV2(owner, address(primaryFeed), "primary");
        router = new IonSwapRouterV2(owner);
        pool = new IonSwapPoolMock(1 ether);
    }

    function test_BridgeConnector_emitsRelayAndOwnerEvents() public {
        vm.expectEmit(true, true, false, true);
        emit BridgeRelayUpdated(address(0), relayer);
        vm.prank(owner);
        connector.setBridgeRelay(relayer);

        address newOwner = address(0xD00D);
        vm.expectEmit(true, true, false, true);
        emit OwnershipTransferred(owner, newOwner);
        vm.prank(owner);
        connector.transferOwnership(newOwner);
    }

    function test_BridgeConnector_rejectsZeroRelay() public {
        vm.prank(owner);
        vm.expectRevert(BridgeIONConnector.IonDexZeroAddress.selector);
        connector.setBridgeRelay(address(0));
    }

    function test_OracleV2_acceptsFreshBackupInViewPath() public {
        vm.prank(owner);
        oracle.setBackupOracle(address(backupFeed));

        vm.warp(block.timestamp + 2 hours);
        backupFeed.setAnswer(123_000_000);

        (uint256 price, bool stale) = oracle.getPriceView();
        assertEq(price, 123_000_000);
        assertFalse(stale);
    }

    function test_OracleV2_rejectsBackupDecimalsMismatch() public {
        MockAggregator badBackup = new MockAggregator(101_000_000, 18);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IonOracleV2.IonDexInvalidOracleDecimals.selector, uint8(8), uint8(18)));
        oracle.setBackupOracle(address(badBackup));
    }

    function test_OracleV2_rejectsPrimaryDecimalsMismatchWhenBackupExists() public {
        vm.prank(owner);
        oracle.setBackupOracle(address(backupFeed));

        MockAggregator badPrimary = new MockAggregator(99_000_000, 18);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IonOracleV2.IonDexInvalidOracleDecimals.selector, uint8(18), uint8(8)));
        oracle.setOracle(address(badPrimary), "bad-primary");
    }

    function test_RouterV2_usesExternalMockPoolFile() public {
        vm.prank(owner);
        router.setPoolWhitelist(address(pool), true);
        assertTrue(router.poolWhitelist(address(pool)));
        assertEq(pool.fixedOutput(), 1 ether);
    }
}
