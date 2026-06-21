import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API });

export const api = {
  tokens: () => client.get("/tokens").then((r) => r.data),
  market: (cat, q) => client.get("/market", { params: { cat, q } }).then((r) => r.data),
  recentTrades: (pair) => client.get("/trades/recent", { params: { pair } }).then((r) => r.data),
  swapQuote: (from_token, to_token, amount_in) =>
    client.get("/swap/quote", { params: { from_token, to_token, amount_in } }).then((r) => r.data),
  swap: (body) => client.post("/swap", body).then((r) => r.data),
  pools: () => client.get("/pools").then((r) => r.data),
  addLiquidity: (body) => client.post("/pools/liquidity", body).then((r) => r.data),
  stakeProducts: () => client.get("/stake/products").then((r) => r.data),
  stake: (body) => client.post("/stake", body).then((r) => r.data),
  stakePositions: (address) => client.get("/stake/positions", { params: { address } }).then((r) => r.data),
  bridgeHistory: (address) => client.get("/bridge/history", { params: { address } }).then((r) => r.data),
  bridge: (body) => client.post("/bridge", body).then((r) => r.data),
  dashboard: (address) => client.get("/dashboard", { params: { address } }).then((r) => r.data),
  burnStats: () => client.get("/burn/stats").then((r) => r.data),
  aiStrategies: () => client.get("/ai/strategies").then((r) => r.data),
  subStrategy: (body) => client.post("/ai/subscribe-strategy", body).then((r) => r.data),
  traders: () => client.get("/copytrade/traders").then((r) => r.data),
  copytrade: (body) => client.post("/copytrade", body).then((r) => r.data),
  subTiers: () => client.get("/subscription/tiers").then((r) => r.data),
  subscribe: (body) => client.post("/subscription/subscribe", body).then((r) => r.data),
  orderbook: (pair) => client.get("/orderbook", { params: { pair } }).then((r) => r.data),
  placeOrder: (body) => client.post("/orders", body).then((r) => r.data),
  orders: (address) => client.get("/orders", { params: { address } }).then((r) => r.data),
  lmPools: () => client.get("/liquiditymine/pools").then((r) => r.data),
  vaults: () => client.get("/vault/list").then((r) => r.data),
  vaultDeposit: (body) => client.post("/vault/deposit", body).then((r) => r.data),
  business: () => client.get("/business/modules").then((r) => r.data),
  domains: (address) => client.get("/domains", { params: { address } }).then((r) => r.data),
  registerDomain: (body) => client.post("/domains", body).then((r) => r.data),
  batchTransfer: (body) => client.post("/batchtransfer", body).then((r) => r.data),
  approvals: (address) => client.get("/approvals", { params: { address } }).then((r) => r.data),
  revoke: (body) => client.post("/approvals/revoke", body).then((r) => r.data),
  getSettings: (address) => client.get("/settings", { params: { address } }).then((r) => r.data),
  saveSettings: (body) => client.post("/settings", body).then((r) => r.data),
};

export const fmt = (n, d = 2) =>
  n == null || isNaN(n) ? "0" : Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: d });
export const fmtUsd = (n) => "$" + fmt(n, 2);
export const short = (addr) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "");
