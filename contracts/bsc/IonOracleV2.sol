// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface AggregatorV3Interface {
    function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
    function decimals() external view returns (uint8);
}

contract IonOracleV2 {
    error IonDexZeroAddress();
    error IonDexUnauthorized();
    error IonDexPriceDeviation(uint256 price, uint256 lastPrice, uint256 deviationBps);
    error IonDexInvalidOracleDecimals(uint8 expected, uint8 actual);

    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event BackupOracleUpdated(address indexed oldBackupOracle, address indexed newBackupOracle);
    event OracleStaleWarning(uint256 updatedAt, uint256 currentTime, uint256 staleSeconds);
    event FallbackPriceUsed(uint256 fallbackPrice, string reason);
    event PriceDeviationDetected(uint256 price, uint256 lastPrice, uint256 deviationBps);

    uint256 public constant STALE_THRESHOLD = 1 hours;
    uint256 public constant FEE_DENOMINATOR = 10_000;

    address public owner;
    AggregatorV3Interface public priceOracle;
    address public backupOracle;
    uint8   public oracleDecimals;
    uint256 public lastValidPrice;
    uint256 public lastValidTimestamp;
    string  public oracleLabel;

    modifier onlyOwner() { if (msg.sender != owner) revert IonDexUnauthorized(); _; }

    constructor(address owner_, address oracle_, string memory label_) {
        if (owner_ == address(0) || oracle_ == address(0)) revert IonDexZeroAddress();
        owner = owner_;
        priceOracle = AggregatorV3Interface(oracle_);
        oracleDecimals = priceOracle.decimals();
        oracleLabel = label_;
    }

    function getPrice() external returns (uint256 price, bool isStale) {
        return _getPriceInternal(0);
    }

    function getPriceWithDeviationCheck(uint256 maxDeviationBps) external returns (uint256 price, bool isStale) {
        return _getPriceInternal(maxDeviationBps);
    }

    function getPriceView() external view returns (uint256 price, bool isStale) {
        (uint256 primaryPrice,, bool primaryValid) = _readFreshPrice(priceOracle);
        if (primaryValid) return (primaryPrice, false);

        if (backupOracle != address(0)) {
            (uint256 backupPrice,, bool backupValid) = _readFreshPrice(AggregatorV3Interface(backupOracle));
            if (backupValid) return (backupPrice, false);
        }

        return (lastValidPrice, true);
    }

    function _getPriceInternal(uint256 maxDeviationBps) internal returns (uint256 price, bool isStale) {
        (uint256 currentPrice, uint256 updatedAt, bool primaryValid) = _readFreshPrice(priceOracle);
        if (!primaryValid) {
            if (backupOracle != address(0)) {
                (uint256 backupPrice, uint256 backupUpdatedAt, bool backupValid) =
                    _readFreshPrice(AggregatorV3Interface(backupOracle));
                if (backupValid) {
                    lastValidPrice = backupPrice;
                    lastValidTimestamp = backupUpdatedAt;
                    return (backupPrice, false);
                }
            }
            emit OracleStaleWarning(updatedAt, block.timestamp, _staleSeconds(updatedAt));
            emit FallbackPriceUsed(lastValidPrice, "primary and backup unavailable");
            return (lastValidPrice, true);
        }

        if (maxDeviationBps > 0 && lastValidPrice > 0) {
            uint256 deviation;
            if (currentPrice > lastValidPrice) {
                deviation = ((currentPrice - lastValidPrice) * FEE_DENOMINATOR) / lastValidPrice;
            } else {
                deviation = ((lastValidPrice - currentPrice) * FEE_DENOMINATOR) / lastValidPrice;
            }
            if (deviation > maxDeviationBps) {
                emit PriceDeviationDetected(currentPrice, lastValidPrice, deviation);
                return (lastValidPrice, true);
            }
        }

        lastValidPrice = currentPrice;
        lastValidTimestamp = updatedAt;
        return (currentPrice, false);
    }

    function _readFreshPrice(AggregatorV3Interface oracle_) internal view returns (uint256 price, uint256 updatedAt, bool valid) {
        (, int256 answer,, uint256 oracleUpdatedAt,) = oracle_.latestRoundData();
        if (answer <= 0) return (0, oracleUpdatedAt, false);
        if (oracleUpdatedAt == 0 || block.timestamp > oracleUpdatedAt + STALE_THRESHOLD) {
            return (0, oracleUpdatedAt, false);
        }
        return (uint256(answer), oracleUpdatedAt, true);
    }

    function _staleSeconds(uint256 updatedAt) internal view returns (uint256) {
        if (updatedAt == 0 || updatedAt >= block.timestamp) return 0;
        return block.timestamp - updatedAt;
    }

    function setOracle(address newOracle, string memory newLabel) external onlyOwner {
        if (newOracle == address(0)) revert IonDexZeroAddress();
        address oldOracle = address(priceOracle);
        priceOracle = AggregatorV3Interface(newOracle);
        oracleDecimals = priceOracle.decimals();
        if (backupOracle != address(0)) {
            uint8 backupDecimals = AggregatorV3Interface(backupOracle).decimals();
            if (backupDecimals != oracleDecimals) revert IonDexInvalidOracleDecimals(oracleDecimals, backupDecimals);
        }
        oracleLabel = newLabel;
        emit OracleUpdated(oldOracle, newOracle);
    }

    function setBackupOracle(address backup) external onlyOwner {
        if (backup != address(0)) {
            uint8 backupDecimals = AggregatorV3Interface(backup).decimals();
            if (backupDecimals != oracleDecimals) revert IonDexInvalidOracleDecimals(oracleDecimals, backupDecimals);
        }
        address oldBackupOracle = backupOracle;
        backupOracle = backup;
        emit BackupOracleUpdated(oldBackupOracle, backup);
    }

    function getOracleInfo() external view returns (address oracleAddr, uint8 decimals, uint256 cachedPrice, uint256 cachedTimestamp, string memory label) {
        return (address(priceOracle), oracleDecimals, lastValidPrice, lastValidTimestamp, oracleLabel);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert IonDexZeroAddress();
        owner = newOwner;
    }
}
