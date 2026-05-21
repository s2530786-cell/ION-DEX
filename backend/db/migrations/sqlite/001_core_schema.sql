-- ION DEX core schema (SQLite) — docs/03-technical-architecture.md § Database
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  chain TEXT NOT NULL,
  contract_address TEXT,
  name TEXT,
  decimals INTEGER NOT NULL DEFAULT 9,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (symbol, chain)
);

CREATE TABLE IF NOT EXISTS markets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  market_key TEXT NOT NULL UNIQUE,
  base_token_id INTEGER NOT NULL REFERENCES tokens (id),
  quote_token_id INTEGER NOT NULL REFERENCES tokens (id),
  chain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pool_key TEXT NOT NULL UNIQUE,
  market_id INTEGER NOT NULL REFERENCES markets (id),
  chain TEXT NOT NULL,
  reserve_base TEXT NOT NULL DEFAULT '0',
  reserve_quote TEXT NOT NULL DEFAULT '0',
  fee_bps INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS swaps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  swap_key TEXT NOT NULL UNIQUE,
  pool_id INTEGER NOT NULL REFERENCES pools (id),
  wallet_address TEXT NOT NULL,
  side TEXT NOT NULL,
  amount_in TEXT NOT NULL,
  amount_out TEXT NOT NULL,
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS limit_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_key TEXT NOT NULL UNIQUE,
  market_id INTEGER NOT NULL REFERENCES markets (id),
  wallet_address TEXT NOT NULL,
  side TEXT NOT NULL,
  price TEXT NOT NULL,
  amount TEXT NOT NULL,
  filled_amount TEXT NOT NULL DEFAULT '0',
  status TEXT NOT NULL DEFAULT 'open',
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS grid_strategies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  strategy_key TEXT NOT NULL UNIQUE,
  market_id INTEGER NOT NULL REFERENCES markets (id),
  wallet_address TEXT NOT NULL,
  lower_price TEXT NOT NULL,
  upper_price TEXT NOT NULL,
  grid_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS staking_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  position_key TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  chain TEXT NOT NULL,
  amount TEXT NOT NULL,
  reward_accrued TEXT NOT NULL DEFAULT '0',
  lock_until TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS burn_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_key TEXT NOT NULL UNIQUE,
  chain TEXT NOT NULL,
  amount TEXT NOT NULL,
  tx_hash TEXT,
  block_number INTEGER,
  source TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bridge_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transfer_key TEXT NOT NULL UNIQUE,
  direction TEXT NOT NULL,
  from_chain TEXT NOT NULL,
  to_chain TEXT NOT NULL,
  amount TEXT NOT NULL,
  sender_address TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  tx_hash_source TEXT,
  tx_hash_dest TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS domain_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain_name TEXT NOT NULL UNIQUE,
  owner_address TEXT,
  wallet_binding TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS domain_listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_key TEXT NOT NULL UNIQUE,
  domain_id INTEGER NOT NULL REFERENCES domain_records (id),
  seller_address TEXT NOT NULL,
  price_amount TEXT NOT NULL,
  price_token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS identity_credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  credential_key TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  kyc_level TEXT NOT NULL DEFAULT 'none',
  issuer TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  verified_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS treasury_flows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flow_key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  amount TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  chain TEXT NOT NULL,
  tx_hash TEXT,
  recorded_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS oracle_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  source TEXT NOT NULL,
  price_usd TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 1.0,
  observed_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (symbol, source, observed_at)
);

CREATE TABLE IF NOT EXISTS risk_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_key TEXT NOT NULL UNIQUE,
  severity TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  payload_json TEXT,
  resolved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  locale TEXT NOT NULL DEFAULT 'en',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_wallets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL REFERENCES user_profiles (id),
  chain TEXT NOT NULL,
  address TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE (profile_id, chain, address)
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER NOT NULL UNIQUE REFERENCES user_profiles (id),
  theme TEXT NOT NULL DEFAULT 'dark',
  notifications_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_key TEXT NOT NULL UNIQUE,
  profile_id INTEGER NOT NULL REFERENCES user_profiles (id),
  channel TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_key TEXT NOT NULL UNIQUE,
  actor TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_markets_chain ON markets (chain);
CREATE INDEX IF NOT EXISTS idx_pools_market_id ON pools (market_id);
CREATE INDEX IF NOT EXISTS idx_swaps_pool_id ON swaps (pool_id);
CREATE INDEX IF NOT EXISTS idx_oracle_prices_symbol ON oracle_prices (symbol);
CREATE INDEX IF NOT EXISTS idx_burn_events_chain ON burn_events (chain);
CREATE INDEX IF NOT EXISTS idx_bridge_transfers_status ON bridge_transfers (status);
