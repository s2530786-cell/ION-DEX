-- ION DEX Database Schema (PostgreSQL)
-- Run: psql -d dex_db -f schema.sql

-- Scan progress (per chain)
CREATE TABLE IF NOT EXISTS scan_progress (
    id BIGSERIAL PRIMARY KEY,
    chain_type VARCHAR(20) UNIQUE NOT NULL,
    last_scan_block BIGINT NOT NULL DEFAULT 0,
    update_time TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Chain transactions
CREATE TABLE IF NOT EXISTS chain_transaction (
    id BIGSERIAL PRIMARY KEY,
    chain_type VARCHAR(20) NOT NULL,
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT NOT NULL,
    block_time TIMESTAMP NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42),
    contract_address VARCHAR(42),
    tx_type VARCHAR(30) NOT NULL,
    token_symbol VARCHAR(50),
    token_decimals INTEGER DEFAULT 18,
    amount NUMERIC(78,18) DEFAULT 0,
    gas_used NUMERIC(78,18) DEFAULT 0,
    status BOOLEAN NOT NULL,
    create_time TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User assets
CREATE TABLE IF NOT EXISTS user_asset (
    id BIGSERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    chain_type VARCHAR(20) NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    token_symbol VARCHAR(50),
    token_name VARCHAR(100),
    balance NUMERIC(78,18) NOT NULL DEFAULT 0,
    usd_value NUMERIC(20,8) DEFAULT 0,
    update_time TIMESTAMP NOT NULL DEFAULT NOW()
);

-- LP staking records
CREATE TABLE IF NOT EXISTS user_lp_stake (
    id BIGSERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    chain_type VARCHAR(20) NOT NULL,
    pool_address VARCHAR(42) NOT NULL,
    lp_amount NUMERIC(78,18) DEFAULT 0,
    stake_amount NUMERIC(78,18) DEFAULT 0,
    pending_reward NUMERIC(78,18) DEFAULT 0,
    apy NUMERIC(10,4) DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT NOW(),
    update_time TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Token prices
CREATE TABLE IF NOT EXISTS token_price (
    id BIGSERIAL PRIMARY KEY,
    chain_type VARCHAR(20) NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    price_usd NUMERIC(20,8) NOT NULL DEFAULT 0,
    price_change_24h NUMERIC(10,4) DEFAULT 0,
    volume_24h NUMERIC(30,8) DEFAULT 0,
    timestamp TIMESTAMP NOT NULL
);

-- Contract event logs
CREATE TABLE IF NOT EXISTS contract_event_log (
    id BIGSERIAL PRIMARY KEY,
    chain_type VARCHAR(20) NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    event_name VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    create_time TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Risk addresses (blacklist)
CREATE TABLE IF NOT EXISTS risk_address (
    id BIGSERIAL PRIMARY KEY,
    address VARCHAR(42) UNIQUE NOT NULL,
    risk_type VARCHAR(30) NOT NULL,
    remark VARCHAR(255),
    create_time TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User wallets
CREATE TABLE IF NOT EXISTS user_wallet (
    id BIGSERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    chain_type VARCHAR(20) NOT NULL,
    bind_time TIMESTAMP NOT NULL DEFAULT NOW(),
    is_main BOOLEAN DEFAULT FALSE,
    remark VARCHAR(255)
);

-- User profile
CREATE TABLE IF NOT EXISTS user_profile (
    id BIGSERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    chain_type VARCHAR(20) NOT NULL,
    nickname VARCHAR(100),
    theme VARCHAR(20) DEFAULT 'dark',
    lang VARCHAR(10) DEFAULT 'en',
    default_slippage NUMERIC(5,2) DEFAULT 0.5,
    default_gas_mode VARCHAR(20) DEFAULT 'standard',
    create_time TIMESTAMP NOT NULL DEFAULT NOW(),
    update_time TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User notifications
CREATE TABLE IF NOT EXISTS user_notice (
    id BIGSERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    chain_type VARCHAR(20) NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(30) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    create_time TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notice_addr ON user_notice(wallet_address, chain_type);

-- Global stats
CREATE TABLE IF NOT EXISTS global_stats (
    id BIGSERIAL PRIMARY KEY,
    stat_date DATE NOT NULL UNIQUE,
    total_users BIGINT DEFAULT 0,
    total_volume NUMERIC(30,8) DEFAULT 0,
    total_fee NUMERIC(30,8) DEFAULT 0,
    total_lp NUMERIC(30,8) DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Asset snapshots (reconciliation)
CREATE TABLE IF NOT EXISTS asset_snapshot (
    id BIGSERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    chain_type VARCHAR(20) NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    balance NUMERIC(78,18) NOT NULL,
    snapshot_time TIMESTAMP NOT NULL,
    create_time TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_snapshot_addr ON asset_snapshot(wallet_address, chain_type);

-- Trade match records
CREATE TABLE IF NOT EXISTS trade_match_record (
    id BIGSERIAL PRIMARY KEY,
    chain_type VARCHAR(20) NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    buy_addr VARCHAR(42) NOT NULL,
    sell_addr VARCHAR(42) NOT NULL,
    price NUMERIC(20,8) NOT NULL,
    amount NUMERIC(78,18) NOT NULL,
    create_time TIMESTAMP NOT NULL DEFAULT NOW()
);
