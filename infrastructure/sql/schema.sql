-- ION DEX Database Schema
-- PostgreSQL 16

CREATE TABLE IF NOT EXISTS trades (
    id              BIGSERIAL PRIMARY KEY,
    tx_hash         VARCHAR(66) NOT NULL UNIQUE,
    pair_address    VARCHAR(42) NOT NULL,
    token_in        VARCHAR(42) NOT NULL,
    token_out       VARCHAR(42) NOT NULL,
    amount_in       NUMERIC(78, 0) NOT NULL,
    amount_out      NUMERIC(78, 0) NOT NULL,
    fee             NUMERIC(78, 0) NOT NULL DEFAULT 0,
    gas_used        BIGINT NOT NULL DEFAULT 0,
    profit          NUMERIC(78, 0),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS liquidity_events (
    id              BIGSERIAL PRIMARY KEY,
    pair_address    VARCHAR(42) NOT NULL,
    reserve_in      NUMERIC(78, 0) NOT NULL,
    reserve_out     NUMERIC(78, 0) NOT NULL,
    block_number    BIGINT NOT NULL,
    detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS smart_money_signals (
    id              BIGSERIAL PRIMARY KEY,
    wallet_address  VARCHAR(42) NOT NULL,
    pair_address    VARCHAR(42) NOT NULL,
    tx_hash         VARCHAR(66) NOT NULL,
    amount          NUMERIC(78, 0) NOT NULL,
    direction       VARCHAR(4) NOT NULL, -- 'buy' | 'sell'
    win_rate        NUMERIC(5, 2),
    detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trades_pair ON trades(pair_address);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_created ON trades(created_at);
CREATE INDEX idx_liquidity_events_pair ON liquidity_events(pair_address);
CREATE INDEX idx_smart_money_wallet ON smart_money_signals(wallet_address);
CREATE INDEX idx_smart_money_detected ON smart_money_signals(detected_at);
