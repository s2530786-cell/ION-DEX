-- ION DEX Data Heart: PostgreSQL Migration v1.0.0
-- Focus: Institutional Trade Attribution & Cost Breakdown

-- 1. Core Trades Table: The atomic ledger of execution intents
CREATE TABLE trades (
    trade_id UUID PRIMARY KEY,
    trace_id VARCHAR(64) UNIQUE NOT NULL,
    pair_address VARCHAR(42) NOT NULL,
    side VARCHAR(10) NOT NULL, -- BUY/SELL
    amount_in NUMERIC(78, 0) NOT NULL,
    amount_out NUMERIC(78, 0),
    status VARCHAR(20) NOT NULL, -- SUCCESS/FAILED/REVERTED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Cost Breakdown Table: Detailed slippage and fee analysis
CREATE TABLE cost_breakdown (
    trade_id UUID PRIMARY KEY REFERENCES trades(trade_id),
    gas_cost NUMERIC(78, 0) NOT NULL,
    relay_tip NUMERIC(78, 0) NOT NULL, -- MEV Bundle Priority Fee
    slippage_loss NUMERIC(78, 0) NOT NULL, -- Delta between expected and realized output
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Strategy Attribution Table: The "Why" behind the trade
CREATE TABLE strategy_attribution (
    trade_id UUID PRIMARY KEY REFERENCES trades(trade_id),
    signal_source VARCHAR(50), -- e.g., 'DistilBERT-Sentiment', 'RSI-Cross', 'Institutional-Whale'
    confidence_score FLOAT, -- Model confidence (0.0 - 1.0)
    expected_profit NUMERIC(78, 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for high-frequency dashboard queries
CREATE INDEX idx_trades_created_at ON trades(created_at DESC);
CREATE INDEX idx_trades_pair ON trades(pair_address);
CREATE INDEX idx_strategy_source ON strategy_attribution(signal_source);