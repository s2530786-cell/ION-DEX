-- 严谨的 LOCF (Last Observation Carried Forward) 聚合查询
-- 接收参数: $1 (pool_address), $2 (from_timestamp), $3 (to_timestamp)
WITH time_grid AS (
    -- 1. 生成连续的 1 分钟时间网格
    SELECT generate_series(
        to_timestamp($2), 
        to_timestamp($3), 
        '1 minute'::interval
    ) AS bucket_time
),
raw_data AS (
    -- 2. 获取原始 K 线数据
    SELECT bucket_time, open_price, high_price, low_price, close_price, total_volume
    FROM tv_ohlcv_1m
    WHERE pool_address = $1 AND bucket_time >= to_timestamp($2) AND bucket_time <= to_timestamp($3)
),
joined_data AS (
    -- 3. 网格与原始数据左连接，并为缺失值打组 (用于向后传递收盘价)
    SELECT 
        g.bucket_time,
        r.open_price, r.high_price, r.low_price, r.close_price, r.total_volume,
        COUNT(r.close_price) OVER (ORDER BY g.bucket_time) AS grp
    FROM time_grid g
    LEFT JOIN raw_data r ON g.bucket_time = r.bucket_time
)
-- 4. 最终输出，填充空洞
SELECT 
    EXTRACT(EPOCH FROM bucket_time)::BIGINT AS time,
    COALESCE(open_price, FIRST_VALUE(close_price) OVER (PARTITION BY grp ORDER BY bucket_time)) AS open,
    COALESCE(high_price, FIRST_VALUE(close_price) OVER (PARTITION BY grp ORDER BY bucket_time)) AS high,
    COALESCE(low_price, FIRST_VALUE(close_price) OVER (PARTITION BY grp ORDER BY bucket_time)) AS low,
    COALESCE(close_price, FIRST_VALUE(close_price) OVER (PARTITION BY grp ORDER BY bucket_time)) AS close,
    COALESCE(total_volume, 0) AS volume
FROM joined_data
ORDER BY bucket_time ASC;
