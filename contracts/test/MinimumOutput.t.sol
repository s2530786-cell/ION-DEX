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
    }

    function testSwapSucceedsWhenOutputMeetsMinimum() public {
        pool.setFixedOutput(105 ether);
        uint256 out = router.swapExactIn(pool, 1 ether, 100 ether, address(0xBEEF), 0);
        assert(out == 105 ether);
    }

    function testSwapRevertsWhenOutputBelowMinimum() public {
        pool.setFixedOutput(50 ether);
        try router.swapExactIn(pool, 1 ether, 100 ether, address(0xBEEF), 0) {
            revert("expected IonDexMinOutput");
        } catch (bytes memory) {
            // router reverts IonDexMinOutput
        }
    }
}
