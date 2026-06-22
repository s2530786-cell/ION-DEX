// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {DynamicBurnConfig, MarketMode, BpsConfig} from "./DynamicBurnConfig.sol";
import {IonOracleV2} from "./IonOracleV2.sol";

contract IonBurn {
    error IonDexZeroAddress();
    error IonDexZeroAmount();
    error IonDexUnauthorized();
    error IonDexTokenTransferFailed();
    error IonDexOnlyIon();

    uint256 public constant FEE_DENOMINATOR = 10_000;
    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    address public immutable ionToken;
    address public owner;
    address public feeReceiver;
    IonOracleV2 public oracle;
    uint256 public totalBurned;
    uint256 public bearThreshold;
    uint256 public bullThreshold;
    uint256 internal _locked = 1;

    event Burned(address indexed from, uint256 amount, MarketMode mode, uint256 totalBurned);
    event FeeReceiverSet(address indexed feeReceiver);

    modifier onlyOwner() {
        if (msg.sender != owner) revert IonDexUnauthorized();
        _;
    }

    modifier nonReentrant() {
        if (_locked != 1) revert IonDexUnauthorized();
        _locked = 2;
        _;
        _locked = 1;
    }

    constructor(
        address owner_,
        address ionToken_,
        address oracle_,
        uint256 bearThreshold_,
        uint256 bullThreshold_
    ) {
        if (owner_ == address(0) || ionToken_ == address(0) || oracle_ == address(0))
            revert IonDexZeroAddress();
        if (bearThreshold_ >= bullThreshold_) revert IonDexUnauthorized();
        owner = owner_;
        ionToken = ionToken_;
        oracle = IonOracleV2(oracle_);
        bearThreshold = bearThreshold_;
        bullThreshold = bullThreshold_;
    }

    function executeBurn(uint256 amount) external nonReentrant {
        if (msg.sender != feeReceiver && msg.sender != owner) revert IonDexUnauthorized();
        if (amount == 0) revert IonDexZeroAmount();
        MarketMode mode = _getMarketMode();
        totalBurned += amount;
        if (!IERC20(ionToken).transfer(DEAD_ADDRESS, amount))
            revert IonDexTokenTransferFailed();
        emit Burned(msg.sender, amount, mode, totalBurned);
    }

    function burn(uint256 amount) external nonReentrant {
        if (amount == 0) revert IonDexZeroAmount();
        if (!IERC20(ionToken).transferFrom(msg.sender, DEAD_ADDRESS, amount))
            revert IonDexTokenTransferFailed();
        totalBurned += amount;
        emit Burned(msg.sender, amount, _getMarketMode(), totalBurned);
    }

    function _getMarketMode() internal view returns (MarketMode) {
        (uint256 price, bool isStale) = oracle.getPriceView();
        if (isStale) return MarketMode.Neutral;
        if (price < bearThreshold) return MarketMode.Bear;
        if (price >= bullThreshold) return MarketMode.Bull;
        return MarketMode.Neutral;
    }

    function setFeeReceiver(address feeReceiver_) external onlyOwner {
        if (feeReceiver_ == address(0)) revert IonDexZeroAddress();
        feeReceiver = feeReceiver_;
        emit FeeReceiverSet(feeReceiver_);
    }

    function setThresholds(uint256 bearThreshold_, uint256 bullThreshold_) external onlyOwner {
        if (bearThreshold_ >= bullThreshold_) revert IonDexUnauthorized();
        bearThreshold = bearThreshold_;
        bullThreshold = bullThreshold_;
    }

    function setOracle(address oracle_) external onlyOwner {
        if (oracle_ == address(0)) revert IonDexZeroAddress();
        oracle = IonOracleV2(oracle_);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert IonDexZeroAddress();
        owner = newOwner;
    }

    function getMarketMode() external view returns (MarketMode) {
        return _getMarketMode();
    }
}