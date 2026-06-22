// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {DynamicBurnConfig, MarketMode, BpsConfig} from "./DynamicBurnConfig.sol";
import {IonOracleV2} from "./IonOracleV2.sol";

interface IERC20Fee {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract FeeReceiverV2 {
    error IonDexZeroAddress();
    error IonDexZeroAmount();
    error IonDexUnauthorized();
    error IonDexTokenTransferFailed();
    error IonDexOnlyIon();
    error IonDexPriceDeviation(uint256 price, uint256 lastPrice, uint256 deviationBps);

    uint256 public constant FEE_DENOMINATOR = 10_000;
    uint256 public constant BPS_TEAM_IMMUTABLE = 2500;
    uint256 public constant MAX_PRICE_DEVIATION_BPS = 5000; // 50% max deviation
    address public constant BSC_BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    address public immutable ionToken;
    address public owner;
    address public treasury;
    address public team;
    address public stakingRewards;
    address public keeper;
    IonOracleV2 public oracle;
    uint256 public bearThreshold;
    uint256 public bullThreshold;
    MarketMode public currentMode;
    uint256 internal _locked = 1;

    event FeeDistributionDetail(address indexed token, uint256 amount, uint256 toBurn, uint256 toTeam, uint256 toStaking, uint256 toTreasury, uint256 toKeeper, MarketMode mode);
    event MarketModeChanged(MarketMode oldMode, MarketMode newMode, uint256 price, bool oracleStale);
    event OracleStaleWarning(uint256 lastValidPrice, uint256 currentTime);

    modifier onlyOwner() { if (msg.sender != owner) revert IonDexUnauthorized(); _; }
    modifier nonReentrant() { if (_locked != 1) revert IonDexUnauthorized(); _locked = 2; _; _locked = 1; }

    constructor(address owner_, address ionToken_, address treasury_, address team_, address stakingRewards_, address keeper_, address oracle_, uint256 bearThreshold_, uint256 bullThreshold_) {
        if (owner_ == address(0) || ionToken_ == address(0) || oracle_ == address(0)) revert IonDexZeroAddress();
        if (treasury_ == address(0) || team_ == address(0) || stakingRewards_ == address(0) || keeper_ == address(0)) revert IonDexZeroAddress();
        if (bearThreshold_ >= bullThreshold_) revert IonDexUnauthorized();
        owner = owner_; ionToken = ionToken_; treasury = treasury_; team = team_;
        stakingRewards = stakingRewards_; keeper = keeper_;
        oracle = IonOracleV2(oracle_); bearThreshold = bearThreshold_; bullThreshold = bullThreshold_;
        currentMode = MarketMode.Neutral;
        assert(DynamicBurnConfig.isValidConfig(DynamicBurnConfig.bearConfig()));
        assert(DynamicBurnConfig.isValidConfig(DynamicBurnConfig.neutralConfig()));
        assert(DynamicBurnConfig.isValidConfig(DynamicBurnConfig.bullConfig()));
    }

    function distributeFees(address token, uint256 amount) external nonReentrant {
        if (token == address(0)) revert IonDexZeroAddress();
        if (token != ionToken) revert IonDexOnlyIon();
        if (amount == 0) revert IonDexZeroAmount();
        if (!_transferFrom(token, msg.sender, address(this), amount)) revert IonDexTokenTransferFailed();

        _updateMarketMode();
        BpsConfig memory cfg = _getEffectiveConfig();

        uint256 toBurn     = (amount * cfg.bpsBurn)     / FEE_DENOMINATOR;
        uint256 toTeam     = (amount * cfg.bpsTeam)     / FEE_DENOMINATOR;
        uint256 toStaking  = (amount * cfg.bpsStaking)  / FEE_DENOMINATOR;
        uint256 toTreasury = (amount * cfg.bpsTreasury) / FEE_DENOMINATOR;
        uint256 toKeeper   = amount - toBurn - toTeam - toStaking - toTreasury;

        if (toTeam > 0 && !_transfer(token, team, toTeam)) revert IonDexTokenTransferFailed();
        if (toBurn > 0 && !_transfer(token, BSC_BURN_ADDRESS, toBurn)) revert IonDexTokenTransferFailed();
        if (toStaking > 0 && !_transfer(token, stakingRewards, toStaking)) revert IonDexTokenTransferFailed();
        if (toTreasury > 0 && !_transfer(token, treasury, toTreasury)) revert IonDexTokenTransferFailed();
        if (toKeeper > 0 && !_transfer(token, keeper, toKeeper)) revert IonDexTokenTransferFailed();

        emit FeeDistributionDetail(token, amount, toBurn, toTeam, toStaking, toTreasury, toKeeper, currentMode);
    }

    function _updateMarketMode() internal {
        (uint256 price, bool isStale) = oracle.getPriceWithDeviationCheck(MAX_PRICE_DEVIATION_BPS);
        MarketMode newMode;
        if (isStale) {
            newMode = MarketMode.Neutral;
            emit OracleStaleWarning(price, block.timestamp);
        } else if (price < bearThreshold) {
            newMode = MarketMode.Bear;
        } else if (price >= bullThreshold) {
            newMode = MarketMode.Bull;
        } else {
            newMode = MarketMode.Neutral;
        }
        if (newMode != currentMode) {
            MarketMode oldMode = currentMode;
            currentMode = newMode;
            emit MarketModeChanged(oldMode, newMode, price, isStale);
        }
    }

    function _getEffectiveConfig() internal view returns (BpsConfig memory) {
        return DynamicBurnConfig.getConfig(currentMode);
    }

    function _transferFrom(address token, address from, address to, uint256 amount) internal returns (bool) {
        return IERC20Fee(token).transferFrom(from, to, amount);
    }
    function _transfer(address token, address to, uint256 amount) internal returns (bool) {
        return IERC20Fee(token).transfer(to, amount);
    }

    function setDestinations(address treasury_, address team_, address stakingRewards_, address keeper_) external onlyOwner {
        if (treasury_ == address(0) || team_ == address(0) || stakingRewards_ == address(0) || keeper_ == address(0)) revert IonDexZeroAddress();
        treasury = treasury_; team = team_; stakingRewards = stakingRewards_; keeper = keeper_;
    }
    function setThresholds(uint256 bear_, uint256 bull_) external onlyOwner { if (bear_ >= bull_) revert IonDexUnauthorized(); bearThreshold = bear_; bullThreshold = bull_; }
    function setOracle(address oracle_) external onlyOwner { if (oracle_ == address(0)) revert IonDexZeroAddress(); oracle = IonOracleV2(oracle_); }
    function transferOwnership(address no) external onlyOwner { if (no == address(0)) revert IonDexZeroAddress(); owner = no; }
    function getMarketMode() external view returns (MarketMode) { return currentMode; }
}