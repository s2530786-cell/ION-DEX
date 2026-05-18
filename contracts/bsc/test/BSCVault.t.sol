// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../src/BSCVault.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Mock", "MCK") {
        _mint(msg.sender, 1_000_000 ether);
    }
}

contract BSCVaultTest is Test {
    BSCVault public vault;
    MockToken public token;
    address public admin = address(0x1);
    address public signer1 = address(0x2);
    address public signer2 = address(0x3);
    address public signer3 = address(0x4);
    address public user = address(0x5);

    uint256 public signer1Key = 0x1;
    uint256 public signer2Key = 0x2;
    uint256 public signer3Key = 0x3;

    function setUp() public {
        address[] memory signers = new address[](3);
        signers[0] = vm.addr(signer1Key);
        signers[1] = vm.addr(signer2Key);
        signers[2] = vm.addr(signer3Key);

        vm.prank(admin);
        vault = new BSCVault(signers, 2, 1 days, 100_000 ether);

        token = new MockToken();
    }

    function test_InitialState() public {
        assertEq(vault.threshold(), 2);
        assertEq(vault.timelockDelay(), 1 days);
        assertEq(vault.dailyLimit(), 100_000 ether);
        assertTrue(vault.hasRole(vault.SIGNER_ROLE(), vm.addr(signer1Key)));
    }

    function test_Deposit() public {
        token.approve(address(vault), 100 ether);
        vault.deposit(address(token), 100 ether);
        assertEq(token.balanceOf(address(vault)), 100 ether);
    }

    function test_Deposit_RevertZeroAddress() public {
        vm.expectRevert(BSCVault.ZeroAddress.selector);
        vault.deposit(address(0), 100 ether);
    }

    function test_WithdrawalRequiresThreshold() public {
        token.approve(address(vault), 100 ether);
        vault.deposit(address(token), 100 ether);

        uint256 deadline = block.timestamp + 1 hours;
        bytes[] memory sigs = new bytes[](1);

        // Only 1 sig when threshold is 2
        sigs[0] = _signTyped(signer1Key, address(token), user, 50 ether, deadline, address(this));

        vm.expectRevert(abi.encodeWithSelector(BSCVault.InsufficientSignatures.selector, 2, 1));
        vault.requestWithdrawal(address(token), user, 50 ether, deadline, sigs);
    }

    function test_Pause() public {
        vm.prank(admin);
        vault.pause();

        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        vault.deposit(address(token), 100 ether);
    }

    // ── Helpers ────────────────────────────────────────────────

    function _signTyped(
        uint256 signerKey,
        address tokenAddr,
        address to,
        uint256 amount,
        uint256 deadline,
        address caller
    ) internal view returns (bytes memory) {
        uint256 nonce = vault.nonces(caller);

        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("BSCVault")),
                keccak256(bytes("1")),
                block.chainid,
                address(vault)
            )
        );

        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Withdrawal(address token,address to,uint256 amount,uint256 nonce,uint256 deadline)"),
                tokenAddr,
                to,
                amount,
                nonce,
                deadline
            )
        );

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerKey, digest);
        return abi.encodePacked(r, s, v);
    }
}
