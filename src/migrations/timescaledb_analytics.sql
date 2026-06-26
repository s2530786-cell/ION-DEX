-- ION DEX Advanced Analytics: TimescaleDB Schema
-- Focus: Sub-10ms TradingView History Resolution

-- 1. Raw Swap Event Ledger
CREATE TABLE dex_swaps (
    transaction_hash VARCHAR(64) PRIMARY KEY,
    pool_address VARCHAR(66) NOT NULL,
    time TIMESTAMPTZ NOT NULL,
    price NUMERIC(40, 18) NOT NULL,
    volume NUMERIC(40, 18) NOT NULL
);

-- 2. Convert to Hypertable for optimized time-series performance
SELECT create_hypertable('dex_swaps', 'time');

-- 3. Continuous Aggregate for TradingView (1m resolution)
CREATE MATERIALIZED VIEW tv_ohlcv_1m
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 minute', time) AS bucket_time,
    pool_address,
    first(price, time) AS open_price,
    max(price) AS high_price,
    min(price) AS low_price,
    last(price, time) AS close_price,
    sum(volume) AS total_volume
FROM dex_swaps
GROUP BY bucket_time, pool_address;

-- Speed index for high-frequency frontend requests
CREATE INDEX idx_tv_ohlcv_1m_pool_time ON tv_ohlcv_1m (pool_address, bucket_time DESC);