// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FeeReceiver} from "./FeeReceiver.sol";
import {DynamicBurnConfig, MarketMode, BpsConfig, TimelockProposal} from "./DynamicBurnConfig.sol";
import {IonOracle} from "./IonOracle.sol";

/**
 * @title FeeReceiverAdmin
 * @notice FeeReceiver 管理扩展 — 时间锁、阈值、地址管理 + View 函数
 */
contract FeeReceiverAdmin is FeeReceiver {
    // ── 构造函数 ──────────────────────────────────────────
    constructor(
        address owner_, address ionToken_, address treasury_,
        address team_, address stakingRewards_, address keeper_,
        address oracle_, uint256 bearThreshold_, uint256 bullThreshold_
    ) FeeReceiver(owner_, ionToken_, treasury_, team_, stakingRewards_, keeper_, oracle_, bearThreshold_, bullThreshold_) {}

    // ── 错误 ──────────────────────────────────────────────
    error IonDexBpsInvalid();
    error IonDexTimelockNotReady();
    error IonDexNoPendingProposal();
    error IonDexTeamBpsImmutable();
    error IonDexInvalidThreshold();

    // ── 常量 ──────────────────────────────────────────────
    uint256 public constant TIMELOCK_DURATION = 48 hours;

    // ── 状态 ──────────────────────────────────────────────
    TimelockProposal public pendingProposal;

    // ── 事件 ──────────────────────────────────────────────
    event ThresholdsUpdated(uint256 bearThreshold, uint256 bullThreshold);
    event DestinationsUpdated(address treasury, address team, address stakingRewards, address keeper);
    event TimelockProposed(MarketMode mode, BpsConfig config, uint256 executeAfter);
    event TimelockExecuted(MarketMode mode, BpsConfig config);
    event TimelockCancelled();

    // ══════════════════════════════════════════════════════
    //  View 函数（监控用）
    // ══════════════════════════════════════════════════════

    function getMarketMode() external view returns (MarketMode) {
        return currentMode;
    }

    function getEffectiveBps() external view returns (
        uint256 bpsBurn, uint256 bpsStaking, uint256 bpsTreasury,
        uint256 bpsKeeper, uint256 bpsTeam
    ) {
        BpsConfig memory cfg = DynamicBurnConfig.getConfig(currentMode);
        return (cfg.bpsBurn, cfg.bpsStaking, cfg.bpsTreasury, cfg.bpsKeeper, cfg.bpsTeam);
    }

    function thresholdBreached() external view returns (bool nearBear, bool nearBull) {
        (uint256 price, bool isStale) = oracle.getPriceView();
        if (isStale) return (false, false);
        return DynamicBurnConfig.thresholdBreached(price, bearThreshold, bullThreshold);
    }

    function previewMode(uint256 price) external view returns (MarketMode) {
        if (price < bearThreshold) return MarketMode.Bear;
        if (price >= bullThreshold) return MarketMode.Bull;
        return MarketMode.Neutral;
    }

    // ══════════════════════════════════════════════════════
    //  管理函数（仅 owner）
    // ══════════════════════════════════════════════════════

    function setDestinations(
        address treasury_, address team_, address stakingRewards_, address keeper_
    ) external onlyOwner {
        if (treasury_ == address(0) || team_ == address(0) ||
            stakingRewards_ == address(0) || keeper_ == address(0))
            revert IonDexZeroAddress();
        treasury = treasury_;
        team = team_;
        stakingRewards = stakingRewards_;
        keeper = keeper_;
        emit DestinationsUpdated(treasury_, team_, stakingRewards_, keeper_);
    }

    function proposeThresholds(uint256 bearThreshold_, uint256 bullThreshold_) external onlyOwner {
        if (bearThreshold_ >= bullThreshold_) revert IonDexInvalidThreshold();

        pendingProposal = TimelockProposal({
            executeAfter: block.timestamp + TIMELOCK_DURATION,
            mode: MarketMode.Neutral,
            newConfig: BpsConfig(0, 0, 0, 0, BPS_TEAM_IMMUTABLE),
            executed: false
        });
        pendingProposal.newConfig.bpsBurn = bearThreshold_;
        pendingProposal.newConfig.bpsStaking = bullThreshold_;

        emit TimelockProposed(MarketMode.Neutral, pendingProposal.newConfig, pendingProposal.executeAfter);
    }

    function executeTimelock() external onlyOwner {
        TimelockProposal memory prop = pendingProposal;
        if (prop.executeAfter == 0 || prop.executed) revert IonDexNoPendingProposal();
        if (block.timestamp < prop.executeAfter) revert IonDexTimelockNotReady();

        uint256 newBear = prop.newConfig.bpsBurn;
        uint256 newBull = prop.newConfig.bpsStaking;
        if (newBear >= newBull) revert IonDexInvalidThreshold();

        bearThreshold = newBear;
        bullThreshold = newBull;
        pendingProposal.executed = true;

        emit ThresholdsUpdated(newBear, newBull);
        emit TimelockExecuted(prop.mode, prop.newConfig);
    }

    function cancelTimelock() external onlyOwner {
        if (pendingProposal.executeAfter == 0) revert IonDexNoPendingProposal();
        delete pendingProposal;
        emit TimelockCancelled();
    }

    function setOracle(address oracle_) external onlyOwner {
        if (oracle_ == address(0)) revert IonDexZeroAddress();
        oracle = IonOracle(oracle_);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert IonDexZeroAddress();
        owner = newOwner;
    }

    // ══════════════════════════════════════════════════════
    //  不变量断言
    // ══════════════════════════════════════════════════════

    function assertInvariants() external pure {
        assert(DynamicBurnConfig.isValidConfig(DynamicBurnConfig.bearConfig()));
        assert(DynamicBurnConfig.isValidConfig(DynamicBurnConfig.neutralConfig()));
        assert(DynamicBurnConfig.isValidConfig(DynamicBurnConfig.bullConfig()));
        assert(DynamicBurnConfig.bearConfig().bpsTeam == BPS_TEAM_IMMUTABLE);
        assert(DynamicBurnConfig.neutralConfig().bpsTeam == BPS_TEAM_IMMUTABLE);
        assert(DynamicBurnConfig.bullConfig().bpsTeam == BPS_TEAM_IMMUTABLE);
    }
}
