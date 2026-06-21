// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {IOracle} from "./interfaces/IOracle.sol";

/// @title Burn - dynamic burn rate based on ION/USDT price phase
/// @notice Bear market => higher burn, Bull market => lower burn.
contract Burn {
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    address public immutable ION;
    IOracle public immutable oracle;

    uint256 public referencePrice;       // baseline ION/USDT price (1e8)
    uint256 public totalBurned;

    // burn rate bounds in basis points
    uint256 public constant MIN_BURN_BPS = 500;   // 5%  (bull)
    uint256 public constant MAX_BURN_BPS = 3000;  // 30% (bear)

    event Burned(uint256 amount, uint256 burnBps, uint256 price);

    constructor(address ion, address oracle_, uint256 referencePrice_) {
        ION = ion;
        oracle = IOracle(oracle_);
        referencePrice = referencePrice_;
    }

    /// @dev returns dynamic burn rate; price below reference burns more
    function currentBurnBps() public view returns (uint256) {
        uint256 price = oracle.getPrice(ION);
        if (price >= referencePrice * 2) return MIN_BURN_BPS;
        if (price <= referencePrice / 2) return MAX_BURN_BPS;
        // linear interpolation between bounds
        uint256 ratio = (price * 1e4) / referencePrice; // 5000..20000
        uint256 span = MAX_BURN_BPS - MIN_BURN_BPS;
        uint256 reduction = (span * (ratio - 5000)) / 15000;
        return MAX_BURN_BPS - reduction;
    }

    function executeBurn(uint256 amount) external returns (uint256 burnedAmount) {
        uint256 bps = currentBurnBps();
        burnedAmount = (amount * bps) / 10000;
        require(IERC20(ION).transferFrom(msg.sender, BURN_ADDRESS, burnedAmount), "BURN_FAIL");
        totalBurned += burnedAmount;
        emit Burned(burnedAmount, bps, oracle.getPrice(ION));
    }
}
