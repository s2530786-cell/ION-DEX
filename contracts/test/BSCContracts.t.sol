// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockERC20} from "../bsc/MockERC20.sol";
import {BSCVault} from "../bsc/BSCVault.sol";
import {FeeReceiverV2} from "../bsc/FeeReceiverV2.sol";
import {BridgeRelayV2} from "../bsc/BridgeRelayV2.sol";
import {IonOracleV2} from "../bsc/IonOracleV2.sol";
import {MockAggregator} from "./MockAggregator.sol";

contract NoReturnERC20 {
    string public name = "NoReturn";
    string public symbol = "NORET";
    uint8 public immutable decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
    }

    function transfer(address to, uint256 amount) external {
        _transfer(msg.sender, to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) external {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            if (amount > allowed) revert();
            allowance[from][msg.sender] = allowed - amount;
        }
        _transfer(from, to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        if (to == address(0) || amount == 0 || balanceOf[from] < amount) revert();
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}

contract FalseReturnERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address, uint256) external pure returns (bool) {
        return false;
    }

    function transferFrom(address, address, uint256) external pure returns (bool) {
        return false;
    }
}

contract BSCContractsTest is Test {
    MockERC20 internal token;
    BSCVault internal vault;
    FeeReceiverV2 internal feeReceiver;
    BridgeRelayV2 internal relay;
    MockAggregator internal priceFeed;
    IonOracleV2 internal oracle;

    address internal owner = address(0xA11CE);
    address internal treasury = address(0xBEEF);
    address internal team = address(0xCAFE);
    address internal staking = address(0x570A);
    address internal keeper = address(0x5EE7);
    address internal user = address(0x75E7);
    address internal constant BURN = 0x000000000000000000000000000000000000dEaD;

    function setUp() public {
        token = new MockERC20("ION", "ION", 18);
        vault = new BSCVault(owner);
        priceFeed = new MockAggregator(100_000_000, 8);
        oracle = new IonOracleV2(owner, address(priceFeed), "mock");
        feeReceiver = new FeeReceiverV2(owner, address(token), treasury, team, staking, keeper, address(oracle), 90_000_000, 110_000_000);
        relay = new BridgeRelayV2(owner, address(vault), 1);
        vm.prank(owner);
        vault.setBridgeRelay(address(relay));
        vm.prank(owner);
        vault.setRelayerDirect(address(relay), true);
        vm.prank(owner);
        relay.addRelayerDirect(address(this));
        token.mint(user, 1_000_000 ether);
    }

    function test_lock_and_release_via_relay() public {
        bytes32 ionRecipient = bytes32(uint256(0x1234));
        vm.startPrank(user);
        token.approve(address(vault), 100 ether);
        vault.lock(address(token), 100 ether, ionRecipient, 0);
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

        assertEq(token.balanceOf(BURN), (amount * 3000) / 10_000);
        assertEq(token.balanceOf(team), (amount * 2500) / 10_000);
        assertEq(token.balanceOf(staking), (amount * 2500) / 10_000);
        assertEq(token.balanceOf(treasury), (amount * 1500) / 10_000);
        assertEq(token.balanceOf(keeper), (amount * 500) / 10_000);
    }

    function test_fee_receiver_rejects_non_ion() public {
        MockERC20 other = new MockERC20("USDT", "USDT", 18);
        other.mint(user, 100 ether);
        vm.startPrank(user);
        other.approve(address(feeReceiver), 100 ether);
        vm.expectRevert(FeeReceiverV2.IonDexOnlyIon.selector);
        feeReceiver.distributeFees(address(other), 100 ether);
        vm.stopPrank();
    }

    function test_vault_lock_collects_ion_protocol_fee() public {
        vm.prank(owner);
        vault.setFeeReceiver(address(feeReceiver));
        bytes32 ionRecipient = bytes32(uint256(0x5678));
        uint256 ionFee = 1 ether;
        vm.startPrank(user);
        token.approve(address(vault), 100 ether + ionFee);
        vault.lock(address(token), 100 ether, ionRecipient, ionFee);
        vm.stopPrank();
        assertEq(token.balanceOf(BURN), (ionFee * 3000) / 10_000);
    }

    function test_revert_duplicate_nonce() public {
        bytes32 nonce = keccak256("dup");
        vm.startPrank(user);
        token.approve(address(vault), 50 ether);
        vault.lock(address(token), 50 ether, bytes32(uint256(1)), 0);
        vm.stopPrank();
        relay.attestInbound(nonce, address(token), user, 50 ether);
        vm.expectRevert(bytes4(keccak256("IonDexDuplicateNonce()")));
        relay.attestInbound(nonce, address(token), user, 50 ether);
    }

    function test_vault_lock_accepts_erc20_without_return_value() public {
        NoReturnERC20 noReturnToken = new NoReturnERC20();
        noReturnToken.mint(user, 100 ether);

        vm.startPrank(user);
        noReturnToken.approve(address(vault), 100 ether);
        vault.lock(address(noReturnToken), 25 ether, bytes32(uint256(0xCA11)), 0);
        vm.stopPrank();

        assertEq(noReturnToken.balanceOf(address(vault)), 25 ether);
        assertEq(vault.lockedBalance(address(noReturnToken), user), 25 ether);
    }

    function test_vault_lock_reverts_on_false_erc20_return_value() public {
        FalseReturnERC20 falseReturnToken = new FalseReturnERC20();
        falseReturnToken.mint(user, 100 ether);

        vm.startPrank(user);
        falseReturnToken.approve(address(vault), 100 ether);
        vm.expectRevert(BSCVault.IonDexTokenTransferFailed.selector);
        vault.lock(address(falseReturnToken), 25 ether, bytes32(uint256(0xFA11)), 0);
        vm.stopPrank();
    }

    function test_vault_adjust_lp_shares_rejects_min_int_delta() public {
        vm.prank(owner);
        vm.expectRevert();
        vault.adjustLpShares(user, type(int256).min);
    }
}
