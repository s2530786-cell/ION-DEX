// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/IonWrapper.sol";
import "../src/BSCVault.sol";

/**
 * @title DeployScript
 * @notice Deploy ION DEX BSC contracts
 */
contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address bridge = vm.envAddress("BRIDGE_ADDRESS");
        address[] memory signers = new address[](3);
        signers[0] = vm.envAddress("SIGNER_1");
        signers[1] = vm.envAddress("SIGNER_2");
        signers[2] = vm.envAddress("SIGNER_3");

        vm.startBroadcast(deployerKey);

        // Deploy IonWrapper
        IonWrapper wion = new IonWrapper(
            bridge,
            msg.sender,
            10_000_000 ether  // 10M cap
        );
        console.log("IonWrapper deployed at:", address(wion));

        // Deploy BSCVault
        BSCVault vault = new BSCVault(
            signers,
            2,              // 2-of-3 multi-sig
            1 days,         // 24h timelock
            100_000 ether   // 100k daily limit
        );
        console.log("BSCVault deployed at:", address(vault));

        vm.stopBroadcast();
    }
}
