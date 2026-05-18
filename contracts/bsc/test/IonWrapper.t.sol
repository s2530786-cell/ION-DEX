// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/IonWrapper.sol";

contract IonWrapperTest is Test {
    IonWrapper public wion;
    address public bridge = address(0x1);
    address public owner = address(0x2);
    address public user = address(0x3);
    uint256 public constant MINT_CAP = 1_000_000 ether;

    function setUp() public {
        vm.prank(owner);
        wion = new IonWrapper(bridge, owner, MINT_CAP);
    }

    function test_InitialState() public {
        assertEq(wion.name(), "Wrapped ION");
        assertEq(wion.symbol(), "wION");
        assertEq(wion.bridge(), bridge);
        assertEq(wion.owner(), owner);
        assertEq(wion.mintCap(), MINT_CAP);
    }

    function test_Mint() public {
        bytes32 txHash = keccak256("tx1");
        vm.prank(bridge);
        wion.mint(user, 100 ether, txHash);
        assertEq(wion.balanceOf(user), 100 ether);
        assertEq(wion.totalBridged(), 100 ether);
    }

    function test_Mint_RevertIfNotBridge() public {
        bytes32 txHash = keccak256("tx1");
        vm.prank(user);
        vm.expectRevert(IonWrapper.NotBridge.selector);
        wion.mint(user, 100 ether, txHash);
    }

    function test_Mint_RevertIfAlreadyProcessed() public {
        bytes32 txHash = keccak256("tx1");
        vm.prank(bridge);
        wion.mint(user, 100 ether, txHash);

        vm.prank(bridge);
        vm.expectRevert(abi.encodeWithSelector(IonWrapper.TxAlreadyProcessed.selector, txHash));
        wion.mint(user, 100 ether, txHash);
    }

    function test_Mint_RevertExceedsCap() public {
        vm.prank(bridge);
        vm.expectRevert(abi.encodeWithSelector(IonWrapper.ExceedsMintCap.selector, MINT_CAP + 1, MINT_CAP));
        wion.mint(user, MINT_CAP + 1, keccak256("oversized"));
    }

    function test_Burn() public {
        bytes32 mintTx = keccak256("mint1");
        bytes32 burnTx = keccak256("burn1");

        vm.prank(bridge);
        wion.mint(user, 100 ether, mintTx);

        vm.prank(user);
        wion.burn(50 ether, burnTx);

        assertEq(wion.balanceOf(user), 50 ether);
        assertEq(wion.totalBridged(), 50 ether);
    }

    function test_Burn_RevertZeroAmount() public {
        vm.prank(user);
        vm.expectRevert(IonWrapper.InvalidAmount.selector);
        wion.burn(0, keccak256("zero"));
    }

    function test_Pause() public {
        vm.prank(owner);
        wion.pause();

        bytes32 txHash = keccak256("paused");
        vm.prank(bridge);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        wion.mint(user, 100 ether, txHash);
    }
}
