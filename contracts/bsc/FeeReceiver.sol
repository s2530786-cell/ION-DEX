// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DynamicBurnConfig, MarketMode, BpsConfig, TimelockProposal} from "./DynamicBurnConfig.sol";
import {IonOracle} from "./IonOracle.sol";

/**
 * @title FeeReceiver
 * @notice 动态费率分配合约 — 根据市场模式自动调整销毁/质押/国库比例
 *
 * ══════════════════════════════════════════════════════════
 *  FunC 移植注意事项：
 *  1. 本合约使用 OpenZeppelin ReentrancyGuard → FunC 中用全局锁 cell 替代
 *  2. mapping 在 FunC 中用 dict 替代（key→value）
 *  3. struct TimelockProposal → FunC 扁平化为多个 cell 字段
 *  4. emit 事件 → FunC 用 out_action 发送消息
 *  5. msg.sender 检查 → FunC 中用 sender() 替代
 *  6. block.timestamp → FunC 中用 now() 替代
 *  7. address 类型 → FunC 中用 slice/msg_addr
 *  8. 避免使用 abi.encodePacked，FunC 无等价物
 * ══════════════════════════════════════════════════════════
 *
 * ┌──────────┬───────┬───────┬───────┬───────┬───────┐
 * │ 模式     │ 销毁  │ 质押  │ 国库  │Keeper │ Master│
 * ├──────────┼───────┼───────┼───────┼───────┼───────┤
 * │ 熊市     │ 4000  │ 2500  │ 800   │ 200   │ 2500  │
 * │ 中性     │ 3000  │ 2500  │ 1500  │ 500   │ 2500  │
 * │ 牛市     │ 1500  │ 3500  │ 2000  │ 500   │ 2500  │
 * └──────────┴───────┴───────┴───────┴───────┴───────┘
 *
 * 铁律（Master 2026-05-30 钦定）：
 * - BPS_TEAM = 2500 (25%) 永远不可修改
 * - 比例之和永远 = 10000
 * - 预言机失效时 fallback 到中性模式
 */

interface IERC20Fee {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract FeeReceiver {
    // ── 错误 ──────────────────────────────────────────────
    error IonDexZeroAddress();
    error IonDexZeroAmount();
    error IonDexUnauthorized();
    error IonDexTokenTransferFailed();
    error IonDexBpsInvalid();
    error IonDexOnlyIon();
    error IonDexTimelockNotReady();
    error IonDexNoPendingProposal();
    error IonDexTeamBpsImmutable();
    error IonDexInvalidThreshold();

    // ── 常量 ──────────────────────────────────────────────
    uint256 public constant FEE_DENOMINATOR = 10_000;
    uint256 public constant BPS_TEAM_IMMUTABLE = 2500;  // 铁律：Master 永远 25%
    uint256 public constant TIMELOCK_DURATION = 48 hours; // 时间锁：48 小时
    uint256 public constant BSC_BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    // ── 不可变 ────────────────────────────────────────────
    address public immutable ionToken;

    // ── 状态变量（扁平，FunC 友好） ──────────────────────
    address public owner;
    address public treasury;
    address public team;
    address public stakingRewards;
    address public keeper;
    IonOracle public oracle;

    // 阈值（8 位小数精度，与 Chainlink 一致）
    uint256 public bearThreshold;   // 低于此价 = 熊市
    uint256 public bullThreshold;   // 高于此价 = 牛市

    // 当前市场模式
    MarketMode public currentMode;

    // 时间锁提议
    TimelockProposal public pendingProposal;

    // 重入锁
    uint256 private _locked = 1; // 1=未锁定, 2=已锁定

    // ── 事件 ──────────────────────────────────────────────
    event FeeDistributionDetail(
        address indexed token,
        uint256 amount,
        uint256 toBurn,
        uint256 toTeam,
        uint256 toStaking,
        uint256 toTreasury,
        uint256 toKeeper,
        MarketMode mode
    );
    event MarketModeChanged(
        MarketMode oldMode,
        MarketMode newMode,
        uint256 price,
        bool oracleStale
    );
    event OracleStaleWarning(
        uint256 lastValidPrice,
        uint256 currentTime
    );
    event ThresholdsUpdated(
        uint256 bearThreshold,
        uint256 bullThreshold
    );
    event DestinationsUpdated(
        address treasury,
        address team,
        address stakingRewards,
        address keeper
    );
    event TimelockProposed(
        MarketMode mode,
        BpsConfig config,
        uint256 executeAfter
    );
    event TimelockExecuted(
        MarketMode mode,
        BpsConfig config
    );
    event TimelockCancelled();

    // ── 修饰符 ────────────────────────────────────────────
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

    // ── 构造函数 ──────────────────────────────────────────
    constructor(
        address owner_,
        address ionToken_,
        address treasury_,
        address team_,
        address stakingRewards_,
        address keeper_,
        address oracle_,
        uint256 bearThreshold_,
        uint256 bullThreshold_
    ) {
        if (owner_ == address(0) || ionToken_ == address(0) || oracle_ == address(0))
            revert IonDexZeroAddress();
        if (treasury_ == address(0) || team_ == address(0) ||
            stakingRewards_ == address(0) || keeper_ == address(0))
            revert IonDexZeroAddress();
        if (bearThreshold_ >= bullThreshold_) revert IonDexInvalidThreshold();

        owner = owner_;
        ionToken = ionToken_;
        treasury = treasury_;
        team = team_;
        stakingRewards = stakingRewards_;
        keeper = keeper_;
        oracle = IonOracle(oracle_);
        bearThreshold = bearThreshold_;
        bullThreshold = bullThreshold_;

        // 初始模式为中性（安全默认值）
        currentMode = MarketMode.Neutral;

        // 验证硬编码配置不变量
        assert(DynamicBurnConfig.isValidConfig(DynamicBurnConfig.bearConfig()));
        assert(DynamicBurnConfig.isValidConfig(DynamicBurnConfig.neutralConfig()));
        assert(DynamicBurnConfig.isValidConfig(DynamicBurnConfig.bullConfig()));
    }

    // ══════════════════════════════════════════════════════
    //  核心函数：分配手续费
    // ══════════════════════════════════════════════════════

    /**
     * @notice 拉取 amount 数量的 token 并按当前市场模式分配
     * @dev 重入保护 + 仅接受 ION token
     */
    function distributeFees(address token, uint256 amount) external nonReentrant {
        if (token == address(0)) revert IonDexZeroAddress();
        if (token != ionToken) revert IonDexOnlyIon();
        if (amount == 0) revert IonDexZeroAmount();

        // 1. 拉取代币
        if (!_transferFrom(token, msg.sender, address(this), amount))
            revert IonDexTokenTransferFailed();

        // 2. 确定市场模式
        _updateMarketMode();

        // 3. 获取当前配置
        BpsConfig memory cfg = _getEffectiveConfig();

        // 4. 按比例分配
        uint256 toBurn     = (amount * cfg.bpsBurn)     / FEE_DENOMINATOR;
        uint256 toTeam     = (amount * cfg.bpsTeam)     / FEE_DENOMINATOR;
        uint256 toStaking  = (amount * cfg.bpsStaking)  / FEE_DENOMINATOR;
        uint256 toTreasury = (amount * cfg.bpsTreasury) / FEE_DENOMINATOR;
        // Keeper 获得余量（避免精度损失）
        uint256 toKeeper   = amount - toBurn - toTeam - toStaking - toTreasury;

        // 5. 执行转账（优先支付 Master）
        if (toTeam > 0 && !_transfer(token, team, toTeam))
            revert IonDexTokenTransferFailed();
        if (toBurn > 0 && !_transfer(token, address(BSC_BURN_ADDRESS), toBurn))
            revert IonDexTokenTransferFailed();
        if (toStaking > 0 && !_transfer(token, stakingRewards, toStaking))
            revert IonDexTokenTransferFailed();
        if (toTreasury > 0 && !_transfer(token, treasury, toTreasury))
            revert IonDexTokenTransferFailed();
        if (toKeeper > 0 && !_transfer(token, keeper, toKeeper))
            revert IonDexTokenTransferFailed();

        emit FeeDistributionDetail(
            token, amount, toBurn, toTeam, toStaking, toTreasury, toKeeper, currentMode
        );
    }

    // ══════════════════════════════════════════════════════
    //  市场模式判定
    // ══════════════════════════════════════════════════════

    /**
     * @notice 根据预言机价格更新市场模式
     * @dev 预言机失效时 fallback 到中性模式，不 revert
     */
    function _updateMarketMode() internal {
        (uint256 price, bool isStale) = oracle.getPrice();
        MarketMode newMode;

        if (isStale) {
            // 预言机失效 → fallback 中性模式
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

    /**
     * @notice 获取当前生效的 BPS 配置
     */
    function _getEffectiveConfig() internal view returns (BpsConfig memory) {
        // 如果有待执行且已过期的时间锁配置，仍用当前模式配置
        return DynamicBurnConfig.getConfig(currentMode);
    }

    // ══════════════════════════════════════════════════════
    //  View 函数（监控用）
    // ══════════════════════════════════════════════════════

    /**
     * @notice 返回当前市场模式
     */
    function getMarketMode() external view returns (MarketMode) {
        return currentMode;
    }

    /**
     * @notice 返回当前生效的各分配比例
     */
    function getEffectiveBps() external view returns (
        uint256 bpsBurn,
        uint256 bpsStaking,
        uint256 bpsTreasury,
        uint256 bpsKeeper,
        uint256 bpsTeam
    ) {
        BpsConfig memory cfg = DynamicBurnConfig.getConfig(currentMode);
        return (cfg.bpsBurn, cfg.bpsStaking, cfg.bpsTreasury, cfg.bpsKeeper, cfg.bpsTeam);
    }

    /**
     * @notice 返回当前是否接近模式切换阈值
     * @return nearBear 是否接近熊市阈值
     * @return nearBull 是否接近牛市阈值
     */
    function thresholdBreached() external view returns (bool nearBear, bool nearBull) {
        (uint256 price, bool isStale) = oracle.getPriceView();
        if (isStale) return (false, false);
        return DynamicBurnConfig.thresholdBreached(price, bearThreshold, bullThreshold);
    }

    /**
     * @notice 预览：给定价格会进入什么模式
     */
    function previewMode(uint256 price) external view returns (MarketMode) {
        if (price < bearThreshold) return MarketMode.Bear;
        if (price >= bullThreshold) return MarketMode.Bull;
        return MarketMode.Neutral;
    }

    // ══════════════════════════════════════════════════════
    //  管理函数（仅 owner）
    // ══════════════════════════════════════════════════════

    /**
     * @notice 更新目标地址
     */
    function setDestinations(
        address treasury_,
        address team_,
        address stakingRewards_,
        address keeper_
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

    /**
     * @notice 更新市场模式阈值（需要 48 小时时间锁）
     * @dev 阈值变更影响市场模式判定，属于高风险操作
     */
    function proposeThresholds(
        uint256 bearThreshold_,
        uint256 bullThreshold_
    ) external onlyOwner {
        if (bearThreshold_ >= bullThreshold_) revert IonDexInvalidThreshold();

        pendingProposal = TimelockProposal({
            executeAfter: block.timestamp + TIMELOCK_DURATION,
            mode: MarketMode.Neutral, // 占位，阈值变更不用 mode
            newConfig: BpsConfig(0, 0, 0, 0, BPS_TEAM_IMMUTABLE), // 占位
            executed: false
        });

        // 阈值直接存储在提议外（简化结构体复用）
        // 实际阈值在 executeTimelock 时从参数设置
        // 这里先把新阈值存到 pendingProposal 的闲置字段
        // bearThreshold_ 存入 newConfig.bpsBurn, bullThreshold_ 存入 newConfig.bpsStaking
        pendingProposal.newConfig.bpsBurn = bearThreshold_;
        pendingProposal.newConfig.bpsStaking = bullThreshold_;

        emit TimelockProposed(
            MarketMode.Neutral,
            pendingProposal.newConfig,
            pendingProposal.executeAfter
        );
    }

    /**
     * @notice 执行待定的时间锁提议
     */
    function executeTimelock() external onlyOwner {
        TimelockProposal memory prop = pendingProposal;
        if (prop.executeAfter == 0) revert IonDexNoPendingProposal();
        if (prop.executed) revert IonDexNoPendingProposal();
        if (block.timestamp < prop.executeAfter) revert IonDexTimelockNotReady();

        // 执行阈值变更
        uint256 newBearThreshold = prop.newConfig.bpsBurn;
        uint256 newBullThreshold = prop.newConfig.bpsStaking;
        if (newBearThreshold >= newBullThreshold) revert IonDexInvalidThreshold();

        bearThreshold = newBearThreshold;
        bullThreshold = newBullThreshold;

        // 标记已执行
        pendingProposal.executed = true;

        emit ThresholdsUpdated(newBearThreshold, newBullThreshold);
        emit TimelockExecuted(prop.mode, prop.newConfig);
    }

    /**
     * @notice 取消待定的时间锁提议
     */
    function cancelTimelock() external onlyOwner {
        if (pendingProposal.executeAfter == 0) revert IonDexNoPendingProposal();
        delete pendingProposal;
        emit TimelockCancelled();
    }

    /**
     * @notice 更新预言机地址
     */
    function setOracle(address oracle_) external onlyOwner {
        if (oracle_ == address(0)) revert IonDexZeroAddress();
        oracle = IonOracle(oracle_);
    }

    /**
     * @notice 转移所有权
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert IonDexZeroAddress();
        owner = newOwner;
    }

    // ══════════════════════════════════════════════════════
    //  不变量断言（部署后可调用验证）
    // ══════════════════════════════════════════════════════

    /**
     * @notice 验证所有硬编码配置的不变量
     * @dev Master 25% + 比例之和 = 10000
     */
    function assertInvariants() external pure {
        assert(DynamicBurnConfig.isValidConfig(DynamicBurnConfig.bearConfig()));
        assert(DynamicBurnConfig.isValidConfig(DynamicBurnConfig.neutralConfig()));
        assert(DynamicBurnConfig.isValidConfig(DynamicBurnConfig.bullConfig()));
        // 铁律：三种模式 Master 都是 2500
        assert(DynamicBurnConfig.bearConfig().bpsTeam == BPS_TEAM_IMMUTABLE);
        assert(DynamicBurnConfig.neutralConfig().bpsTeam == BPS_TEAM_IMMUTABLE);
        assert(DynamicBurnConfig.bullConfig().bpsTeam == BPS_TEAM_IMMUTABLE);
    }

    // ══════════════════════════════════════════════════════
    //  内部辅助
    // ══════════════════════════════════════════════════════

    function _transferFrom(address token, address from, address to, uint256 amount) private returns (bool) {
        return IERC20Fee(token).transferFrom(from, to, amount);
    }

    function _transfer(address token, address to, uint256 amount) private returns (bool) {
        return IERC20Fee(token).transfer(to, amount);
    }
}
