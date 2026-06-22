-- ION DEX core schema (PostgreSQL) — docs/03-technical-architecture.md § Database

CREATE TABLE IF NOT EXISTS tokens (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  chain TEXT NOT NULL,
  contract_address TEXT,
  name TEXT,
  decimals INTEGER NOT NULL DEFAULT 9,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (symbol, chain)
);

CREATE TABLE IF NOT EXISTS markets (
  id BIGSERIAL PRIMARY KEY,
  market_key TEXT NOT NULL UNIQUE,
  base_token_id BIGINT NOT NULL REFERENCES tokens (id),
  quote_token_id BIGINT NOT NULL REFERENCES tokens (id),
  chain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS pools (
  id BIGSERIAL PRIMARY KEY,
  pool_key TEXT NOT NULL UNIQUE,
  market_id BIGINT NOT NULL REFERENCES markets (id),
  chain TEXT NOT NULL,
  reserve_base NUMERIC(78, 0) NOT NULL DEFAULT 0,
  reserve_quote NUMERIC(78, 0) NOT NULL DEFAULT 0,
  fee_bps INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS swaps (
  id BIGSERIAL PRIMARY KEY,
  swap_key TEXT NOT NULL UNIQUE,
  pool_id BIGINT NOT NULL REFERENCES pools (id),
  wallet_address TEXT NOT NULL,
  side TEXT NOT NULL,
  amount_in NUMERIC(78, 0) NOT NULL,
  amount_out NUMERIC(78, 0) NOT NULL,
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS limit_orders (
  id BIGSERIAL PRIMARY KEY,
  order_key TEXT NOT NULL UNIQUE,
  market_id BIGINT NOT NULL REFERENCES markets (id),
  wallet_address TEXT NOT NULL,
  side TEXT NOT NULL,
  price NUMERIC(78, 0) NOT NULL,
  amount NUMERIC(78, 0) NOT NULL,
  filled_amount NUMERIC(78, 0) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS grid_strategies (
  id BIGSERIAL PRIMARY KEY,
  strategy_key TEXT NOT NULL UNIQUE,
  market_id BIGINT NOT NULL REFERENCES markets (id),
  wallet_address TEXT NOT NULL,
  lower_price NUMERIC(78, 0) NOT NULL,
  upper_price NUMERIC(78, 0) NOT NULL,
  grid_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS staking_positions (
  id BIGSERIAL PRIMARY KEY,
  position_key TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  chain TEXT NOT NULL,
  amount NUMERIC(78, 0) NOT NULL,
  reward_accrued NUMERIC(78, 0) NOT NULL DEFAULT 0,
  lock_until TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS burn_events (
  id BIGSERIAL PRIMARY KEY,
  event_key TEXT NOT NULL UNIQUE,
  chain TEXT NOT NULL,
  amount NUMERIC(78, 0) NOT NULL,
  tx_hash TEXT,
  block_number BIGINT,
  source TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS bridge_transfers (
  id BIGSERIAL PRIMARY KEY,
  transfer_key TEXT NOT NULL UNIQUE,
  direction TEXT NOT NULL,
  from_chain TEXT NOT NULL,
  to_chain TEXT NOT NULL,
  amount NUMERIC(78, 0) NOT NULL,
  sender_address TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  tx_hash_source TEXT,
  tx_hash_dest TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS domain_records (
  id BIGSERIAL PRIMARY KEY,
  domain_name TEXT NOT NULL UNIQUE,
  owner_address TEXT,
  wallet_binding TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS domain_listings (
  id BIGSERIAL PRIMARY KEY,
  listing_key TEXT NOT NULL UNIQUE,
  domain_id BIGINT NOT NULL REFERENCES domain_records (id),
  seller_address TEXT NOT NULL,
  price_amount NUMERIC(78, 0) NOT NULL,
  price_token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS identity_credentials (
  id BIGSERIAL PRIMARY KEY,
  credential_key TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  kyc_level TEXT NOT NULL DEFAULT 'none',
  issuer TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS treasury_flows (
  id BIGSERIAL PRIMARY KEY,
  flow_key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  amount NUMERIC(78, 0) NOT NULL,
  token_symbol TEXT NOT NULL,
  chain TEXT NOT NULL,
  tx_hash TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS oracle_prices (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  source TEXT NOT NULL,
  price_usd NUMERIC(38, 18) NOT NULL,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  observed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (symbol, source, observed_at)
);

CREATE TABLE IF NOT EXISTS risk_events (
  id BIGSERIAL PRIMARY KEY,
  event_key TEXT NOT NULL UNIQUE,
  severity TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  payload_json JSONB,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id BIGSERIAL PRIMARY KEY,
  profile_key TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  locale TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS user_wallets (
  id BIGSERIAL PRIMARY KEY,
  profile_id BIGINT NOT NULL REFERENCES user_profiles (id),
  chain TEXT NOT NULL,
  address TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (profile_id, chain, address)
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id BIGSERIAL PRIMARY KEY,
  profile_id BIGINT NOT NULL UNIQUE REFERENCES user_profiles (id),
  theme TEXT NOT NULL DEFAULT 'dark',
  notifications_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  notification_key TEXT NOT NULL UNIQUE,
  profile_id BIGINT NOT NULL REFERENCES user_profiles (id),
  channel TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  log_key TEXT NOT NULL UNIQUE,
  actor TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  payload_json JSONB,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_markets_chain ON markets (chain);
CREATE INDEX IF NOT EXISTS idx_pools_market_id ON pools (market_id);
CREATE INDEX IF NOT EXISTS idx_swaps_pool_id ON swaps (pool_id);
CREATE INDEX IF NOT EXISTS idx_oracle_prices_symbol ON oracle_prices (symbol);
CREATE INDEX IF NOT EXISTS idx_burn_events_chain ON burn_events (chain);
CREATE INDEX IF NOT EXISTS idx_bridge_transfers_status ON bridge_transfers (status);
