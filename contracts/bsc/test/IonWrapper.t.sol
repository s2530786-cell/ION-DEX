// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/IonWrapper.sol";

contract IonWrapperTest is Test {
    IonWrapper public wion;
    address public bridge = address(0x1);
    address public owner = address(0x2);
    address public user = address(0x3);
    address public validator1;
    address public validator2;
    uint256 public validator1Key;
    uint256 public validator2Key;
    uint256 public constant MINT_CAP = 1_000_000 ether;

    function setUp() public {
        validator1Key = 0xA11CE;
        validator2Key = 0xB0B;
        validator1 = vm.addr(validator1Key);
        validator2 = vm.addr(validator2Key);

        vm.prank(owner);
        wion = new IonWrapper(bridge, owner, MINT_CAP);

        vm.prank(owner);
        wion.addValidator(validator1);
        vm.prank(owner);
        wion.addValidator(validator2);
    }

    function test_InitialState() public {
        assertEq(wion.name(), "Wrapped ION");
        assertEq(wion.symbol(), "wION");
        assertEq(wion.bridge(), bridge);
        assertEq(wion.owner(), owner);
        assertEq(wion.mintCap(), MINT_CAP);
        assertEq(wion.doubleSigThreshold(), 10_000 ether);
        assertEq(wion.REQUIRED_SIGNATURES(), 2);
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

    function test_BurnSmall_NoValidatorsRequired() public {
        bytes32 mintTx = keccak256("mint1");
        bytes32 burnTx = keccak256("burn1");

        vm.prank(bridge);
        wion.mint(user, 100 ether, mintTx);

        bytes[] memory sigs = new bytes[](0);
        vm.prank(user);
        wion.burn(50 ether, burnTx, block.timestamp + 1 hours, 1, sigs);

        assertEq(wion.balanceOf(user), 50 ether);
        assertEq(wion.totalBridged(), 50 ether);
    }

    function test_BurnLarge_RequiresValidatorSigs() public {
        bytes32 mintTx = keccak256("mint-large");
        bytes32 burnTx = keccak256("burn-large");
        uint256 amount = 20_000 ether;
        uint256 deadline = block.timestamp + 1 hours;
        uint256 nonce = 42;

        vm.prank(bridge);
        wion.mint(user, amount, mintTx);

        bytes[] memory sigs = new bytes[](0);
        vm.prank(user);
        vm.expectRevert(
            abi.encodeWithSelector(IonWrapper.InsufficientValidatorSignatures.selector, 2, 0)
        );
        wion.burn(amount, burnTx, deadline, nonce, sigs);
    }

    function test_BurnLarge_WithTwoValidatorSigs() public {
        bytes32 mintTx = keccak256("mint-large-ok");
        bytes32 burnTx = keccak256("burn-large-ok");
        uint256 amount = 20_000 ether;
        uint256 deadline = block.timestamp + 1 hours;
        uint256 nonce = 7;

        vm.prank(bridge);
        wion.mint(user, amount, mintTx);

        bytes32 digest = _bridgeDigest(user, amount, deadline, nonce);
        bytes[] memory sigs = new bytes[](2);
        sigs[0] = _sign(validator1Key, digest);
        sigs[1] = _sign(validator2Key, digest);

        vm.prank(user);
        wion.burn(amount, burnTx, deadline, nonce, sigs);

        assertEq(wion.balanceOf(user), 0);
    }

    function test_Burn_RevertZeroAmount() public {
        bytes[] memory sigs = new bytes[](0);
        vm.prank(user);
        vm.expectRevert(IonWrapper.InvalidAmount.selector);
        wion.burn(0, keccak256("zero"), block.timestamp + 1 hours, 0, sigs);
    }

    function test_Pause() public {
        vm.prank(owner);
        wion.pause();

        bytes32 txHash = keccak256("paused");
        vm.prank(bridge);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        wion.mint(user, 100 ether, txHash);
    }

    function _bridgeDigest(address sender, uint256 amount, uint256 deadline, uint256 nonce)
        internal
        view
        returns (bytes32)
    {
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "BridgeRequest(address sender,uint256 amount,uint256 deadline,uint256 nonce,bytes32 targetChain)"
                ),
                sender,
                amount,
                deadline,
                nonce,
                keccak256("ION_MAINNET")
            )
        );
        return keccak256(abi.encodePacked("\x19\x01", wion.DOMAIN_SEPARATOR(), structHash));
    }

    function _sign(uint256 privateKey, bytes32 digest) internal pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }
}
