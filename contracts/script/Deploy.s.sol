// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {MockERC20} from "../bsc/MockERC20.sol";
import {BSCVault} from "../bsc/BSCVault.sol";
import {BridgeRelay} from "../bsc/BridgeRelay.sol";
import {FeeReceiver} from "../bsc/FeeReceiver.sol";
import {IonWrapper} from "../bsc/IonWrapper.sol";
import {IonSwapRouter} from "../bsc/IonSwapRouter.sol";
import {IonOracle} from "../bsc/IonOracle.sol";

interface IMockAggregator {
    function decimals() external view returns (uint8);
}

contract DeployMockAggregator is IMockAggregator {
    int256 private _answer;
    uint8 private immutable _decimals;
    uint256 private _updatedAt;

    constructor(int256 answer_, uint8 decimals_) {
        _answer = answer_;
        _decimals = decimals_;
        _updatedAt = block.timestamp;
    }

    function decimals() external view returns (uint8) {
        return _decimals;
    }

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (1, _answer, _updatedAt, _updatedAt, 1);
    }
}

/**
 * @notice BSC testnet deploy script — requires PRIVATE_KEY and BSC_TESTNET_RPC in env.
 * @dev Run: forge script script/Deploy.s.sol --rpc-url $BSC_TESTNET_RPC --broadcast
 */
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        MockERC20 ion = new MockERC20("ION", "ION", 18);
        BSCVault vault = new BSCVault(deployer);
        BridgeRelay relay = new BridgeRelay(deployer, address(vault), 1);
        DeployMockAggregator priceFeed = new DeployMockAggregator(100_000_000, 8);
        IonOracle oracle = new IonOracle(deployer, address(priceFeed), "deploy-mock");
        FeeReceiver feeReceiver = new FeeReceiver(
            deployer,
            address(ion),
            deployer,
            deployer,
            deployer,
            deployer,
            address(oracle),
            90_000_000,
            110_000_000
        );
        IonWrapper wrapper = new IonWrapper(address(ion));
        IonSwapRouter router = new IonSwapRouter(deployer);

        vault.setBridgeRelay(address(relay));
        vault.setRelayer(address(relay), true);
        vault.setFeeReceiver(address(feeReceiver));
        router.setFeeReceiver(address(feeReceiver));

        vm.stopBroadcast();

        console.log("ION_TOKEN", address(ion));
        console.log("BSC_VAULT", address(vault));
        console.log("BRIDGE_RELAY", address(relay));
        console.log("ION_ORACLE", address(oracle));
        console.log("FEE_RECEIVER", address(feeReceiver));
        console.log("ION_WRAPPER", address(wrapper));
        console.log("ION_SWAP_ROUTER", address(router));
    }
}
