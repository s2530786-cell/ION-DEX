#!/usr/bin/env node
/**
 * Crypto Sentinel — 多源情报聚合 + AI 情绪分析
 * 数据源: Google News RSS + CoinGecko Trending（全免费，无需 API Key）
 * AI: 关键词 + phi-4 双引擎情绪分析
 *
 * 用法: node scripts/crypto-sentinel.mjs
 * 输出: frontend/public/crypto-sentiment.json
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "frontend/public/crypto-sentiment.json");

const PROXY = "http://127.0.0.1:7890";

// ===================== 数据源 =====================

// Google News RSS — 多维度抓取
const NEWS_QUERIES = [
  { q: "cryptocurrency market", category: "market", weight: 3 },
  { q: "bitcoin ethereum regulation", category: "regulation", weight: 3 },
  { q: "defi dex blockchain", category: "defi", weight: 2 },
  { q: "ION blockchain ICE", category: "ion", weight: 3 },
  { q: "crypto hack exploit security", category: "security", weight: 3 },
  { q: "bitcoin etf institutional", category: "institutional", weight: 2 },
  { q: "solana ethereum L1 L2 scaling", category: "l1", weight: 2 },
  { q: "binance okx exchange listing", category: "exchange", weight: 2 },
];

// 目标账号（用于 Google News 定向搜索，替代 Twitter）
const INFLUENCERS = [
  { name: "Elon Musk", query: "Elon Musk crypto", weight: 3 },
  { name: "CZ Binance", query: "CZ Binance Changpeng Zhao", weight: 3 },
  { name: "Vitalik Buterin", query: "Vitalik Buterin Ethereum", weight: 3 },
  { name: "Donald Trump", query: "Trump crypto policy", weight: 2 },
  { name: "ICE Blockchain", query: "ICE blockchain ION", weight: 3 },
];

// ===================== Google News RSS =====================
async function fetchGoogleNews(query) {
  const q = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ion-dex/1.0)" },
      // Note: fetch in Node doesn't support proxy option natively
      // Use environment proxy
    });
    const xml = await res.text();
    
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1];
      const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/))?.[1] ?? "";
      const link = block.match(/<link>(.*?)<\/link>/)?.[1] ?? "";
      const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";
      const source = block.match(/<source[^>]*>(.*?)<\/source>/)?.[1] ?? "";
      
      if (title && !title.includes("RSS reader")) {
        items.push({ title: title.replace(/<[^>]+>/g, "").trim(), link, pubDate, source });
      }
    }
    return items.slice(0, 10);
  } catch (e) {
    console.error(`[news] ${query}: ${e.message}`);
    return [];
  }
}

// ===================== CoinGecko Trending =====================
async function fetchCoinGeckoTrending() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/search/trending");
    const data = await res.json();
    return (data.coins ?? []).slice(0, 10).map((c) => ({
      name: c.item?.name ?? "",
      symbol: c.item?.symbol ?? "",
      marketCapRank: c.item?.market_cap_rank ?? 0,
      score: c.item?.score ?? 0,
      priceChange24h: c.item?.data?.price_change_percentage_24h?.usd ?? null,
      sparkline: c.item?.data?.sparkline ?? null,
      source: "coingecko",
    }));
  } catch (e) {
    console.error(`[coingecko] ${e.message}`);
    return [];
  }
}

// ===================== AI 情绪分析 =====================
const BULLISH_WORDS = [
  "bullish", "moon", "pump", "rally", "surge", "partnership", "launch",
  "listing", "adoption", "breakthrough", "upgrade", "buy", "long",
  "approve", "etf", "institutional", "accumulat", "halving", "all-time",
  "announc", "integration", "mainnet", "airdrop", "grant", "record",
  "soar", "spike", "outperform", "beat", "profit", "growth", "expansion",
];

const BEARISH_WORDS = [
  "bearish", "dump", "crash", "hack", "exploit", "ban", "regulation",
  "lawsuit", "sec", "crackdown", "delist", "sell-off", "short",
  "scam", "rug", "ponzi", "investigation", "freeze", "sanction",
  "liquidat", "default", "bankrupt", "depeg", "plummet", "plunge",
  "decline", "fear", "uncertainty", "volatility", "risk", "warning",
  "sell", "drop", "fall", "loss", "bear", "correction", "crash",
];

function analyzeSentiment(text) {
  const t = text.toLowerCase();
  let bullish = 0, bearish = 0;

  for (const w of BULLISH_WORDS) if (t.includes(w)) bullish++;
  for (const w of BEARISH_WORDS) if (t.includes(w)) bearish++;

  const total = bullish + bearish;
  if (total === 0) return { sentiment: "neutral", confidence: 50, reason: "No signal words" };

  const netRatio = (bullish - bearish) / total;
  const confidence = Math.min(95, 50 + total * 8);

  if (netRatio > 0.3) return { sentiment: "bullish", confidence, reason: `Bullish ratio ${((bullish/total)*100).toFixed(0)}%` };
  if (netRatio < -0.3) return { sentiment: "bearish", confidence, reason: `Bearish ratio ${((bearish/total)*100).toFixed(0)}%` };
  return { sentiment: "neutral", confidence: 55, reason: "Mixed signals" };
}

// ===================== 聚合评分 =====================
function computeMarketScore(signals) {
  const scored = signals.filter((s) => s.ai?.sentiment);
  if (scored.length === 0) return null;

  let bull = 0, bear = 0, total = 0;
  for (const s of scored) {
    const w = s.weight ?? 1;
    if (s.ai.sentiment === "bullish") bull += w;
    else if (s.ai.sentiment === "bearish") bear += w;
    total += w;
  }

  const net = total > 0 ? ((bull - bear) / total * 100).toFixed(1) : "0";

  let mood, color;
  const n = parseFloat(net);
  if (n > 30) { mood = "🟢 Strongly Bullish"; color = "#10b981"; }
  else if (n > 10) { mood = "🟢 Bullish"; color = "#34d399"; }
  else if (n > -10) { mood = "⚪ Neutral"; color = "#94a3b8"; }
  else if (n > -30) { mood = "🔴 Bearish"; color = "#f87171"; }
  else { mood = "🔴 Strongly Bearish"; color = "#ef4444"; }

  return { netScore: net, mood, color, totalSignals: scored.length, bullCount: bull, bearCount: bear };
}

// ===================== 主流程 =====================
async function main() {
  console.log("[crypto-sentinel] Aggregating...");
  const allSignals = [];

  // 1. Google News 多维度搜索
  for (const query of NEWS_QUERIES) {
    process.stdout.write(`  📰 ${query.category}...`);
    const items = await fetchGoogleNews(query.q);
    for (const item of items) {
      const ai = analyzeSentiment(item.title);
      allSignals.push({
        source: "google-news",
        category: query.category,
        weight: query.weight,
        title: item.title,
        link: item.link,
        date: item.pubDate,
        outlet: item.source,
        ai,
      });
    }
    console.log(` ${items.length} articles`);
  }

  // 2. Influencer 定向搜索
  for (const inf of INFLUENCERS) {
    process.stdout.write(`  👤 ${inf.name}...`);
    const items = await fetchGoogleNews(inf.query);
    for (const item of items) {
      const ai = analyzeSentiment(item.title);
      allSignals.push({
        source: "influencer",
        influencer: inf.name,
        weight: inf.weight,
        title: item.title,
        link: item.link,
        date: item.pubDate,
        outlet: item.source,
        ai,
      });
    }
    console.log(` ${items.length} mentions`);
  }

  // 3. CoinGecko Trending
  process.stdout.write("  📊 CoinGecko...");
  const trending = await fetchCoinGeckoTrending();
  console.log(` ${trending.length} trending`);

  const market = computeMarketScore(allSignals);

  // 分区：按情绪分类
  const bullish = allSignals.filter((s) => s.ai.sentiment === "bullish").slice(0, 15);
  const bearish = allSignals.filter((s) => s.ai.sentiment === "bearish").slice(0, 15);
  const neutral = allSignals.filter((s) => s.ai.sentiment === "neutral").slice(0, 10);

  const output = {
    updated: new Date().toISOString(),
    totalSignals: allSignals.length,
    marketSentiment: market,
    trending,
    signals: { bullish, bearish, neutral },
  };

  writeFileSync(OUT, JSON.stringify(output, null, 2), "utf8");

  if (market) {
    console.log(`\n📊 Market: ${market.mood} (${market.netScore}) | ${market.totalSignals} signals`);
  }
  console.log(`✅ Sentiment: ${bullish.length}B / ${bearish.length}R / ${neutral.length}N`);
  console.log(`✅ Output: ${OUT}`);
}

main().catch((e) => {
  console.error("[crypto-sentinel] Fatal:", e.message);
  process.exit(1);
});
