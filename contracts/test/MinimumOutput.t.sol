// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IonSwapRouterV2, ISwapPool} from "../bsc/IonSwapRouterV2.sol";
import {IonSwapPoolMock} from "./mocks/IonSwapPoolMock.sol";

contract MinimumOutputTest {
    IonSwapRouterV2 router;
    IonSwapPoolMock pool;

    function setUp() public {
        router = new IonSwapRouterV2(address(this));
        pool = new IonSwapPoolMock(1_000 ether);
        // Router now requires the pool to be whitelisted before it will route a swap.
        router.setPoolWhitelist(address(pool), true);
    }

    function testSwapSucceedsWhenOutputMeetsMinimum() public {
        pool.setFixedOutput(105 ether);
        // deadline must be >= block.timestamp; ionProtocolFee 0 skips the fee pull.
        uint256 out = router.swapExactIn(pool, 1 ether, 100 ether, address(0xBEEF), block.timestamp + 1 hours, 0);
        assert(out == 105 ether);
    }

    function testSwapRevertsWhenOutputBelowMinimum() public {
        pool.setFixedOutput(50 ether);
        try router.swapExactIn(pool, 1 ether, 100 ether, address(0xBEEF), block.timestamp + 1 hours, 0) {
            revert("expected IonDexMinOutput");
        } catch (bytes memory) {
            // router reverts IonDexMinOutput
        }
    }
}
