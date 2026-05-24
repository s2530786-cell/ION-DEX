// Portfolio Hub — 多链资产余额聚合查询
// 架构：链适配器模式，加链只需新增一个 adapter
import { loadServerConfig } from "../config/server-config.js";
import { fetchJson } from "../lib/http.js";
import { fetchBscNativeBalance } from "../upstream/bsc-rpc.js";
import { fetchCmcUsdPrice } from "../upstream/cmc.js";

// ── 类型定义 ──────────────────────────────────────────

export type ChainId = "ion" | "bsc" | "ethereum" | "base" | "solana" | "bitcoin" | "polygon" | "arbitrum";

export type AssetBalance = {
  symbol: string;
  name: string;
  chain: ChainId;
  address: string;         // 合约地址或原生币空字符串
  decimals: number;
  balanceRaw: string;      // 原始 wei/satoshi
  balanceFormatted: string; // 人类可读格式
  usdPrice: number | null;
  usdValue: number | null;
};

export type ChainBalance = {
  chain: ChainId;
  chainName: string;
  nativeCurrency: string;
  assets: AssetBalance[];
  totalUsd: number;
};

export type PortfolioResponse = {
  address: string;
  chains: ChainBalance[];
  totalUsd: number;
  updatedAt: string;
};

// ── 链定义 ────────────────────────────────────────────

type ChainDef = {
  id: ChainId;
  name: string;
  nativeCurrency: string;
  nativeDecimals: number;
};

const SUPPORTED_CHAINS: ChainDef[] = [
  { id: "ion",        name: "ION",       nativeCurrency: "ION", nativeDecimals: 9 },
  { id: "bsc",        name: "BNB Smart Chain", nativeCurrency: "BNB", nativeDecimals: 18 },
  { id: "ethereum",   name: "Ethereum",  nativeCurrency: "ETH", nativeDecimals: 18 },
  { id: "base",       name: "Base",      nativeCurrency: "ETH", nativeDecimals: 18 },
  { id: "solana",     name: "Solana",    nativeCurrency: "SOL", nativeDecimals: 9 },
  { id: "bitcoin",    name: "Bitcoin",   nativeCurrency: "BTC", nativeDecimals: 8 },
  { id: "polygon",    name: "Polygon",   nativeCurrency: "MATIC", nativeDecimals: 18 },
  { id: "arbitrum",   name: "Arbitrum",  nativeCurrency: "ETH", nativeDecimals: 18 },
];

// 预定义主流代币（合约地址），按链分组
const TOKENS_BY_CHAIN: Record<ChainId, { symbol: string; name: string; address: string; decimals: number }[]> = {
  ion: [
    { symbol: "ION", name: "ION", address: "", decimals: 9 },
  ],
  bsc: [
    { symbol: "BNB", name: "BNB", address: "", decimals: 18 },
    { symbol: "ION", name: "ION", address: "0xe1ab61f7b093435204df32f5b3a405de55445ea8", decimals: 9 },
    { symbol: "USDT", name: "Tether", address: "0x55d398326f99059ff775485246999027b3197955", decimals: 18 },
    { symbol: "USDC", name: "USD Coin", address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", decimals: 18 },
    { symbol: "WBNB", name: "Wrapped BNB", address: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", decimals: 18 },
    { symbol: "ETH", name: "Ethereum", address: "0x2170ed0880ac9a755fd29b2688956bd959f933f8", decimals: 18 },
    { symbol: "BTCB", name: "BTCB", address: "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c", decimals: 18 },
  ],
  ethereum: [
    { symbol: "ETH", name: "Ether", address: "", decimals: 18 },
    { symbol: "USDT", name: "Tether", address: "0xdac17f958d2ee523a2206206994597c13d831ec7", decimals: 6 },
    { symbol: "USDC", name: "USD Coin", address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", decimals: 6 },
    { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", decimals: 8 },
    { symbol: "LINK", name: "Chainlink", address: "0x514910771af9ca656af840dff83e8264ecf986ca", decimals: 18 },
    { symbol: "UNI", name: "Uniswap", address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", decimals: 18 },
  ],
  base: [
    { symbol: "ETH", name: "Ether", address: "", decimals: 18 },
    { symbol: "USDC", name: "USD Coin", address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", decimals: 6 },
    { symbol: "AERO", name: "Aerodrome", address: "0x940181a94a35a4569e4529a3cdfb74e38fd98631", decimals: 18 },
  ],
  solana: [
    { symbol: "SOL", name: "Solana", address: "", decimals: 9 },
    { symbol: "USDC", name: "USD Coin (Solana)", address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 },
    { symbol: "USDT", name: "Tether (Solana)", address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", decimals: 6 },
  ],
  bitcoin: [
    { symbol: "BTC", name: "Bitcoin", address: "", decimals: 8 },
  ],
  polygon: [
    { symbol: "MATIC", name: "Polygon", address: "", decimals: 18 },
    { symbol: "USDT", name: "Tether", address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", decimals: 6 },
    { symbol: "USDC", name: "USD Coin", address: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", decimals: 6 },
    { symbol: "WETH", name: "Wrapped Ether", address: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619", decimals: 18 },
  ],
  arbitrum: [
    { symbol: "ETH", name: "Ether", address: "", decimals: 18 },
    { symbol: "USDT", name: "Tether", address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", decimals: 6 },
    { symbol: "USDC", name: "USD Coin", address: "0xaf88d065e77c8cc2239327c5edb3a432268e5831", decimals: 6 },
    { symbol: "WETH", name: "Wrapped Ether", address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", decimals: 18 },
    { symbol: "ARB", name: "Arbitrum", address: "0x912ce59144191c1204e64559fe8253a0e49e6548", decimals: 18 },
  ],
};

// ── RPC 端点 ──────────────────────────────────────────

const EVM_RPC: Record<string, string> = {
  bsc: "https://bsc-dataseed.binance.org/",
  ethereum: "https://cloudflare-eth.com/",
  base: "https://mainnet.base.org/",
  polygon: "https://polygon-rpc.com/",
  arbitrum: "https://arb1.arbitrum.io/rpc",
};

const ION_API = "https://api.mainnet.ice.io";
const SOLANA_RPC = "https://api.mainnet.solana.com";

// ── 余额查询函数 ──────────────────────────────────────

/** EVM 链: 查询原生币余额 */
async function queryEvmNativeBalance(rpcUrl: string, address: string): Promise<bigint> {
  const res = await fetchJson<{ result: string }>(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getBalance",
      params: [address.startsWith("0x") ? address : `0x${address}`, "latest"],
    },
    timeoutMs: 10000,
  });
  return BigInt(res.result ?? "0x0");
}

/** EVM 链: 查询 ERC20 代币余额 */
async function queryEvmTokenBalance(rpcUrl: string, tokenAddress: string, holder: string): Promise<bigint> {
  const data = `0x70a08231000000000000000000000000${holder.toLowerCase().replace("0x", "").padStart(40, "0")}`;
  const res = await fetchJson<{ result: string }>(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: tokenAddress, data }, "latest"],
    },
    timeoutMs: 10000,
  });
  return BigInt(res.result ?? "0x0");
}

/** ION 链: 查询余额（通过 API v2 JSON RPC） */
async function queryIonBalance(address: string): Promise<string> {
  try {
    const res = await fetchJson<{ ok: boolean; result: string }>(`${ION_API}/http/v2/jsonRPC`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: {
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [address],
      },
      timeoutMs: 12000,
    });
    return res.result ?? "0";
  } catch {
    return "0";
  }
}

/** Solana 链: 查询 SOL 余额 */
async function querySolanaBalance(address: string): Promise<number> {
  try {
    const res = await fetchJson<{ result: { value: number } }>(SOLANA_RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: {
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [address],
      },
      timeoutMs: 10000,
    });
    return res.result?.value ?? 0;
  } catch {
    return 0;
  }
}

/** Solana: 查询 SPL 代币余额 */
async function querySolanaTokenBalance(address: string, mintAddress: string): Promise<number> {
  try {
    const res = await fetchJson<{ result: { value: { amount: string } } | null }>(SOLANA_RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: {
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [
          address,
          { mint: mintAddress },
          { encoding: "jsonParsed" },
        ],
      },
      timeoutMs: 10000,
    });
    if (!res.result?.value || !Array.isArray(res.result.value) || res.result.value.length === 0) return 0;
    return Number((res.result.value[0] as { amount?: string })?.amount ?? 0);
  } catch {
    return 0;
  }
}

/** Bitcoin: 通过 blockstream.info API 查询余额 */
async function queryBitcoinBalance(address: string): Promise<number> {
  try {
    const res = await fetchJson<{ chain_stats: { funded_txo_sum: number; spent_txo_sum: number } }>(
      `https://blockstream.info/api/address/${address}`,
      { timeoutMs: 10000 },
    );
    const stats = res.chain_stats;
    return (stats.funded_txo_sum - stats.spent_txo_sum) / 1e8;
  } catch {
    // fallback: try mempool.space
    try {
      const res2 = await fetchJson<{ address: string; chain_stats: { funded_txo_sum: number; spent_txo_sum: number } }>(
        `https://mempool.space/api/address/${address}`,
        { timeoutMs: 10000 },
      );
      const stats = res2.chain_stats;
      return (stats.funded_txo_sum - stats.spent_txo_sum) / 1e8;
    } catch {
      return 0;
    }
  }
}

// ── 主查询函数 ────────────────────────────────────────

export async function fetchPortfolio(address: string): Promise<PortfolioResponse> {
  const now = new Date().toISOString();
  const chainResults: ChainBalance[] = [];
  let totalUsd = 0;

  const addressEvm = address.startsWith("0x") ? address : "";
  const addressRaw = address;

  for (const chain of SUPPORTED_CHAINS) {
    const tokens = TOKENS_BY_CHAIN[chain.id] ?? [];
    const assets: AssetBalance[] = [];

    switch (chain.id) {
      case "ion": {
        const rawBal = await queryIonBalance(addressRaw);
        const formatted = rawBal === "0" ? "0" : (BigInt(rawBal) / BigInt(1e9)).toString();
        assets.push({
          symbol: "ION",
          name: "ION",
          chain: "ion",
          address: "",
          decimals: 9,
          balanceRaw: rawBal,
          balanceFormatted: formatted.includes(".") ? formatted : `${formatted}`,
          usdPrice: null,
          usdValue: null,
        });
        break;
      }

      case "bsc":
      case "ethereum":
      case "base":
      case "polygon":
      case "arbitrum": {
        const rpcUrl = EVM_RPC[chain.id];
        if (!addressEvm || !rpcUrl) break;

        // 分批查询避免 timeout
        const batchSize = 3;
        for (let i = 0; i < tokens.length; i += batchSize) {
          const batch = tokens.slice(i, i + batchSize);
          const results = await Promise.allSettled(
            batch.map(async (tok) => {
              let raw: bigint;
              if (!tok.address) {
                raw = await queryEvmNativeBalance(rpcUrl, addressEvm);
              } else {
                raw = await queryEvmTokenBalance(rpcUrl, tok.address, addressEvm);
              }
              const divisor = BigInt(10) ** BigInt(tok.decimals);
              const whole = raw / divisor;
              const frac = raw % divisor;
              const fracStr = frac.toString().padStart(tok.decimals, "0").slice(0, 6);
              const formatted = `${whole.toString()}.${fracStr}`;
              return { ...tok, balanceRaw: raw.toString(), balanceFormatted: formatted };
            }),
          );
          for (const r of results) {
            if (r.status === "fulfilled" && r.value) {
              assets.push({ ...r.value, chain: chain.id, usdPrice: null, usdValue: null });
            }
          }
        }
        break;
      }

      case "solana": {
        for (const tok of tokens) {
          if (!tok.address) {
            const lamports = await querySolanaBalance(addressRaw);
            const formatted = (lamports / 1e9).toFixed(6);
            assets.push({
              ...tok,
              chain: "solana",
              balanceRaw: lamports.toString(),
              balanceFormatted: formatted,
              usdPrice: null,
              usdValue: null,
            });
          } else {
            const amount = await querySolanaTokenBalance(addressRaw, tok.address);
            const formatted = (amount / 10 ** tok.decimals).toFixed(6);
            assets.push({
              ...tok,
              chain: "solana",
              balanceRaw: amount.toString(),
              balanceFormatted: formatted,
              usdPrice: null,
              usdValue: null,
            });
          }
        }
        break;
      }

      case "bitcoin": {
        const btcAmount = await queryBitcoinBalance(addressRaw);
        assets.push({
          symbol: "BTC",
          name: "Bitcoin",
          chain: "bitcoin",
          address: "",
          decimals: 8,
          balanceRaw: Math.round(btcAmount * 1e8).toString(),
          balanceFormatted: btcAmount.toFixed(8),
          usdPrice: null,
          usdValue: null,
        });
        break;
      }
    }

    chainResults.push({
      chain: chain.id,
      chainName: chain.name,
      nativeCurrency: chain.nativeCurrency,
      assets,
      totalUsd: 0, // 后面填充 USD 价格后算
    });
  }

  // ── 填充 USD 价格 ──
  // 收集所有需要价格的 symbol，去重调用 CMC
  const uniqueSymbols = [...new Set(chainResults.flatMap(c => c.assets.map(a => a.symbol)))];
  const prices: Record<string, number> = {};
  try {
    const cmcPrices = await fetchCmcUsdPrice(uniqueSymbols);
    for (const [sym, price] of Object.entries(cmcPrices)) {
      prices[sym] = Number(price) || 0;
    }
  } catch {
    // price fetch failed, keep null
  }

  // BTC price fallback
  if (!prices["BTC"]) {
    try {
      const btcRes = await fetchJson<{ bitcoin: { usd: number } }>(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
        { timeoutMs: 5000 },
      );
      prices["BTC"] = btcRes?.bitcoin?.usd ?? 0;
    } catch { /* ignore */ }
  }

  // 填充价格并计算 totalUsd
  for (const chain of chainResults) {
    let chainUsd = 0;
    for (const asset of chain.assets) {
      const price = prices[asset.symbol] ?? null;
      asset.usdPrice = price;
      asset.usdValue = price && asset.balanceFormatted !== "0"
        ? price * parseFloat(asset.balanceFormatted)
        : null;
      if (asset.usdValue) chainUsd += asset.usdValue;
    }
    chain.totalUsd = chainUsd;
    totalUsd += chainUsd;
  }

  return {
    address,
    chains: chainResults,
    totalUsd,
    updatedAt: now,
  };
}
