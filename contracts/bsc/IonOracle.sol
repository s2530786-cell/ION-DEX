// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IonOracle
 * @notice ION/USD 预言机封装 — 可插拔设计，支持 Chainlink + TWAP 备选
 *
 * ══════════════════════════════════════════════════════════
 *  FunC 移植注意事项：
 *  1. AggregatorV3Interface 在 FunC 中用 get_method 替代
 *  2. 价格存储为 int256 → FunC 用 int64 足够（精度 8 位小数）
 *  3. updatedAt 用 uint256 → FunC 用 uint32 unix timestamp
 *  4. 不使用 mapping 嵌套，仅用扁平 state 变量
 *  5. fallback 逻辑（过期→中性模式）在 FeeReceiver 中处理，此处只提供数据
 * ══════════════════════════════════════════════════════════
 *
 * 设计要点：
 * - 初始接入 Chainlink BNB/USD（BSC 主网）
 * - 预留 ION/USD 直连接口（setOracle 切换）
 * - 价格时效性检查：updatedAt 超过 1 小时视为过期
 * - 过期时返回 isStale=true，由调用方决定 fallback 策略
 * - 价格 ≤ 0 视为无效，isStale=true
 */

interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80  roundId,
        int256  answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80  answeredInRound
    );
    function decimals() external view returns (uint8);
}

contract IonOracle {
    error IonDexZeroAddress();
    error IonDexUnauthorized();
    error IonDexInvalidOracle();

    // ── 事件 ──────────────────────────────────────────────
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event OracleStaleWarning(uint256 updatedAt, uint256 currentTime, uint256 staleSeconds);
    event FallbackPriceUsed(uint256 fallbackPrice, string reason);

    // ── 常量 ──────────────────────────────────────────────
    uint256 public constant STALE_THRESHOLD = 1 hours;  // 数据过期阈值

    // ── 状态变量（扁平，FunC 友好） ──────────────────────
    address public owner;
    AggregatorV3Interface public priceOracle;  // 当前生效的预言机
    uint8   public oracleDecimals;              // 预言机小数位数
    uint256 public lastValidPrice;              // 最后有效价格（用于 fallback）
    uint256 public lastValidTimestamp;          // 最后有效时间戳
    string  public oracleLabel;                 // 预言机标签（如 "Chainlink BNB/USD"）

    // ── 修饰符 ────────────────────────────────────────────
    modifier onlyOwner() {
        if (msg.sender != owner) revert IonDexUnauthorized();
        _;
    }

    // ── 构造函数 ──────────────────────────────────────────
    constructor(
        address owner_,
        address oracle_,
        string  memory label_
    ) {
        if (owner_ == address(0)) revert IonDexZeroAddress();
        if (oracle_ == address(0)) revert IonDexZeroAddress();
        owner = owner_;
        priceOracle = AggregatorV3Interface(oracle_);
        oracleDecimals = priceOracle.decimals();
        oracleLabel = label_;
    }

    // ── 核心函数：获取当前价格 ─────────────────────────────
    // 返回：(price, isStale)
    // - price: 8 位小数精度的 USD 价格
    // - isStale: true 表示数据过期或无效，调用方应 fallback
    function getPrice() external returns (uint256 price, bool isStale) {
        (, int256 answer,, uint256 updatedAt,) = priceOracle.latestRoundData();

        // 检查价格有效性
        if (answer <= 0) {
            emit OracleStaleWarning(0, block.timestamp, block.timestamp - lastValidTimestamp);
            emit FallbackPriceUsed(lastValidPrice, "price <= 0");
            return (lastValidPrice, true);
        }

        // 检查时效性
        uint256 currentTime = block.timestamp;
        if (updatedAt == 0 || currentTime > updatedAt + STALE_THRESHOLD) {
            emit OracleStaleWarning(updatedAt, currentTime, currentTime - updatedAt);
            emit FallbackPriceUsed(lastValidPrice, "data stale");
            return (lastValidPrice, true);
        }

        // 有效数据 → 更新缓存
        lastValidPrice = uint256(answer);
        lastValidTimestamp = updatedAt;
        return (uint256(answer), false);
    }

    // ── view 版本：不更新缓存，不触发事件 ─────────────────
    function getPriceView() external view returns (uint256 price, bool isStale) {
        (, int256 answer,, uint256 updatedAt,) = priceOracle.latestRoundData();

        if (answer <= 0) {
            return (lastValidPrice, true);
        }

        uint256 currentTime = block.timestamp;
        if (updatedAt == 0 || currentTime > updatedAt + STALE_THRESHOLD) {
            return (lastValidPrice, true);
        }

        return (uint256(answer), false);
    }

    // ── 切换预言机（可插拔设计） ──────────────────────────
    function setOracle(address newOracle, string memory newLabel) external onlyOwner {
        if (newOracle == address(0)) revert IonDexZeroAddress();
        address oldOracle = address(priceOracle);
        priceOracle = AggregatorV3Interface(newOracle);
        oracleDecimals = priceOracle.decimals();
        oracleLabel = newLabel;
        emit OracleUpdated(oldOracle, newOracle);
    }

    // ── 获取预言机元信息 ──────────────────────────────────
    function getOracleInfo() external view returns (
        address oracleAddr,
        uint8   decimals,
        uint256 cachedPrice,
        uint256 cachedTimestamp,
        string  memory label
    ) {
        return (address(priceOracle), oracleDecimals, lastValidPrice, lastValidTimestamp, oracleLabel);
    }

    // ── 转移所有权 ────────────────────────────────────────
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert IonDexZeroAddress();
        owner = newOwner;
    }
}
