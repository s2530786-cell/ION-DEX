// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockERC20} from "../bsc/MockERC20.sol";
import {BSCVault} from "../bsc/BSCVault.sol";
import {BridgeRelay} from "../bsc/BridgeRelay.sol";
import {IonMintLedger} from "./mocks/IonMintLedger.sol";

/**
 * @notice P0-1c — BSC lock → ION credit + ION → BSC release E2E (100 rounds each direction).
 */
contract BridgeIonE2ETest is Test {
    MockERC20 internal token;
    BSCVault internal vault;
    BridgeRelay internal relay;
    IonMintLedger internal ionLedger;

    address internal owner = address(0xA11CE);
    address internal user = address(0x75E7);
    address internal ionRelayer = address(0x10AD);

    uint256 internal constant ROUNDS = 100;

    function setUp() public {
        token = new MockERC20("ION", "ION", 18);
        vault = new BSCVault(owner);
        relay = new BridgeRelay(owner, address(vault), 1);
        ionLedger = new IonMintLedger(owner);

        vm.startPrank(owner);
        vault.setBridgeRelay(address(relay));
        vault.setRelayer(address(relay), true);
        relay.addRelayer(address(this));
        ionLedger.setRelayer(ionRelayer, true);
        vm.stopPrank();

        token.mint(user, 10_000_000 ether);
    }

    function _messageId(
        address bscUser,
        address bscToken,
        uint256 amount,
        bytes32 ionRecipient,
        uint256 lockIndex
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("ion-bridge-lock", bscUser, bscToken, amount, ionRecipient, lockIndex));
    }

    /// @dev BSC → ION: lock escrow on BSC, relayer credits ION-side ledger.
    function test_P0_1c_BscLock_to_IonCredit_100Rounds() public {
        vm.startPrank(user);
        token.approve(address(vault), type(uint256).max);
        vm.stopPrank();

        uint256 vaultBefore = token.balanceOf(address(vault));
        uint256 cumulativeLocked;

        for (uint256 i = 0; i < ROUNDS; i++) {
            uint256 amount = 1 ether + (i % 40) * 1e16;
            bytes32 ionRecipient = bytes32(uint256(0x1_0000 + i));
            bytes32 msgId = _messageId(user, address(token), amount, ionRecipient, i);

            vm.prank(user);
            vault.lock(address(token), amount, ionRecipient, 0);
            cumulativeLocked += amount;

            assertEq(vault.lockedBalance(address(token), user), cumulativeLocked);
            assertEq(token.balanceOf(address(vault)), vaultBefore + amount);
            vaultBefore += amount;

            vm.prank(ionRelayer);
            ionLedger.creditFromBscLock(msgId, ionRecipient, amount);

            assertTrue(ionLedger.consumedMessage(msgId));
            assertEq(ionLedger.ionBalances(ionRecipient), amount);
        }
    }

    /// @dev ION → BSC: relayer attestation releases escrow back to user on BSC.
    function test_P0_1c_IonToBsc_Release_100Rounds() public {
        vm.startPrank(user);
        token.approve(address(vault), type(uint256).max);
        vm.stopPrank();

        uint256 userBal = token.balanceOf(user);

        for (uint256 i = 0; i < ROUNDS; i++) {
            uint256 amount = 2 ether + (i % 30) * 1e16;
            bytes32 ionRecipient = bytes32(uint256(0x2_0000 + i));
            bytes32 releaseNonce = keccak256(abi.encodePacked("ion-to-bsc", i));

            vm.prank(user);
            vault.lock(address(token), amount, ionRecipient, 0);
            userBal -= amount;

            relay.attestInbound(releaseNonce, address(token), user, amount);
            userBal += amount;

            assertEq(token.balanceOf(user), userBal);
            assertEq(vault.lockedBalance(address(token), user), 0);
            assertTrue(vault.releaseConsumed(releaseNonce));
        }
    }

    function test_P0_1c_ReplayRejected_on_IonLedger() public {
        bytes32 msgId = _messageId(user, address(token), 1 ether, bytes32(uint256(1)), 0);
        vm.prank(ionRelayer);
        ionLedger.creditFromBscLock(msgId, bytes32(uint256(1)), 1 ether);

        vm.prank(ionRelayer);
        vm.expectRevert(IonMintLedger.IonDexDuplicateMessage.selector);
        ionLedger.creditFromBscLock(msgId, bytes32(uint256(1)), 1 ether);
    }
}
