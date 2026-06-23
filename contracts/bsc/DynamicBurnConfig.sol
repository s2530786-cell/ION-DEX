// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DynamicBurnConfig
 * @notice 动态费率分配配置库 — 根据市场模式（熊市/中性/牛市）返回不同的 BPS 比例
 *
 * ══════════════════════════════════════════════════════════
 *  FunC 移植注意事项：
 *  1. 本库使用 pure 函数 + 结构体，FunC 可用 tuple (cell) 替代
 *  2. MarketMode 枚举 → FunC 用 int8: 0=bear, 1=neutral, 2=bull
 *  3. BpsConfig 结构体 → FunC 扁平化为 5 个 int64 字段顺序存储
 *  4. 不使用 mapping / nested struct / abi.encodePacked
 *  5. 所有比例硬编码为常量，FunC 中同样硬编码
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
 * 铁律：Master 永远 25%（BPS_TEAM = 2500），三种模式均不变
 * 不变量：所有比例之和 = 10000
 */

// ── 市场模式枚举 ──────────────────────────────────────────
enum MarketMode {
    Bear,     // 0 — 熊市：低价多烧
    Neutral,  // 1 — 中性：均衡分配
    Bull      // 2 — 牛市：少烧多锁
}

// ── BPS 配置结构体（扁平，5 字段） ────────────────────────
struct BpsConfig {
    uint256 bpsBurn;      // 销毁比例
    uint256 bpsStaking;   // 质押比例
    uint256 bpsTreasury;  // 国库比例
    uint256 bpsKeeper;    // Keeper 比例
    uint256 bpsTeam;      // Master 比例（永远 2500）
}

// ── 时间锁提议结构体 ──────────────────────────────────────
struct TimelockProposal {
    uint256 executeAfter;   // 可执行时间戳（0=无待执行）
    MarketMode mode;        // 目标模式
    BpsConfig newConfig;    // 待生效配置
    bool executed;          // 是否已执行
}

library DynamicBurnConfig {
    uint256 internal constant FEE_DENOMINATOR = 10_000;
    uint256 internal constant BPS_TEAM_IMMUTABLE = 2500; // 铁律：不可修改

    // ── 三种模式的硬编码配置 ──────────────────────────────
    // 熊市：低价多烧=通缩效率最高，多质押支撑，国库紧缩
    function bearConfig() internal pure returns (BpsConfig memory) {
        return BpsConfig({
            bpsBurn:     4000,
            bpsStaking:  2500,
            bpsTreasury: 800,
            bpsKeeper:   200,
            bpsTeam:     2500  // 铁律
        });
    }

    // 中性：均衡分配
    function neutralConfig() internal pure returns (BpsConfig memory) {
        return BpsConfig({
            bpsBurn:     3000,
            bpsStaking:  2500,
            bpsTreasury: 1500,
            bpsKeeper:   500,
            bpsTeam:     2500  // 铁律
        });
    }

    // 牛市：少烧多锁仓
    function bullConfig() internal pure returns (BpsConfig memory) {
        return BpsConfig({
            bpsBurn:     1500,
            bpsStaking:  3500,
            bpsTreasury: 2000,
            bpsKeeper:   500,
            bpsTeam:     2500  // 铁律
        });
    }

    // ── 根据模式返回配置 ──────────────────────────────────
    function getConfig(MarketMode mode) internal pure returns (BpsConfig memory) {
        if (mode == MarketMode.Bear) return bearConfig();
        if (mode == MarketMode.Neutral) return neutralConfig();
        return bullConfig();
    }

    // ── 不变量检查：比例之和 = 10000 且 Master = 2500 ─────
    function isValidConfig(BpsConfig memory cfg) internal pure returns (bool) {
        return cfg.bpsTeam == BPS_TEAM_IMMUTABLE
            && (cfg.bpsBurn + cfg.bpsStaking + cfg.bpsTreasury + cfg.bpsKeeper + cfg.bpsTeam) == FEE_DENOMINATOR;
    }

    // ── 判断是否接近阈值切换边界（±10% 范围内） ──────────
    // 返回 (nearBearThreshold, nearBullThreshold)
    function thresholdBreached(
        uint256 price,
        uint256 bearThreshold,
        uint256 bullThreshold
    ) internal pure returns (bool nearBear, bool nearBull) {
        uint256 bearZone = bearThreshold / 10; // 10% 缓冲带
        uint256 bullZone = bullThreshold / 10;
        nearBear = (price >= bearThreshold && price < bearThreshold + bearZone);
        nearBull = (price >= bullThreshold && price < bullThreshold + bullZone);
    }
}
