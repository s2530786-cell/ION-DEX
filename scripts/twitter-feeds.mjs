#!/usr/bin/env node
/**
 * Twitter Feeds Scraper — syndication.twitter.com → 15+ 大V 实时推文 + AI 情绪
 * 
 * 用法: node scripts/twitter-feeds.mjs
 * 输出: frontend/public/twitter-feeds.json
 */

import { execSync } from "child_process";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PROXY = "http://127.0.0.1:7890";
const OUT = resolve(ROOT, "frontend/public/twitter-feeds.json");
const STATE_FILE = resolve(ROOT, "cache/twitter-feeds-state.json");
const CACHE_DIR = resolve(ROOT, "cache/twitter");

// ===================== WATCHLIST =====================
const WATCHLIST = [
  // S 级 — 核心影响者
  { id: "elonmusk",       name: "Elon Musk",         tier: "S", tags: ["tech","crypto","macro"] },
  { id: "cz_binance",     name: "CZ Binance",         tier: "S", tags: ["exchange","bnb"] },
  { id: "VitalikButerin", name: "Vitalik Buterin",    tier: "S", tags: ["eth","l1"] },
  { id: "aeyakovenko",    name: "Anatoly (Solana)",   tier: "S", tags: ["sol","l1"] },
  { id: "realDonaldTrump", name: "Donald Trump",      tier: "S", tags: ["macro","regulation"] },
  // A 级 — ION + DeFi
  { id: "ice_blockchain", name: "ICE Blockchain",     tier: "A", tags: ["ion","ecosystem"] },
  { id: "Uniswap",        name: "Uniswap",             tier: "A", tags: ["defi","dex"] },
  { id: "PancakeSwap",    name: "PancakeSwap",         tier: "A", tags: ["defi","bsc"] },
  { id: "haydenzadams",   name: "Hayden Adams",        tier: "A", tags: ["defi","uni"] },
  // B 级 — 新闻/KOL
  { id: "WatcherGuru",    name: "WatcherGuru",         tier: "B", tags: ["news","alert"] },
  { id: "WuBlockchain",   name: "Wu Blockchain",       tier: "B", tags: ["news","asia"] },
  { id: "CoinDesk",       name: "CoinDesk",            tier: "B", tags: ["news","media"] },
  // C 级 — 项目方/金融
  { id: "LayerZero_Labs", name: "LayerZero",           tier: "C", tags: ["bridge","infra"] },
  { id: "wormhole",       name: "Wormhole",            tier: "C", tags: ["bridge","infra"] },
  // ION 补充
  { id: "ion_community",  name: "ION Community",       tier: "B", tags: ["ion","community"] },
];

// ===================== Sentiment =====================
const BULLISH = [
  "bullish","moon","pump","rally","surge","partnership","launch","listing",
  "adoption","breakthrough","upgrade","buy","long","approve","etf",
  "institutional","accumulat","halving","announc","integration","mainnet",
  "airdrop","grant","record","soar","spike","outperform","beat","profit",
  "growth","expansion","milestone","soon","incoming","boom","rocket",
];
const BEARISH = [
  "bearish","dump","crash","hack","exploit","ban","regulation","lawsuit",
  "sec","crackdown","delist","sell-off","short","scam","rug","ponzi",
  "investigation","freeze","sanction","liquidat","default","bankrupt",
  "depeg","plummet","plunge","decline","fear","volatility","risk",
  "warning","sell","drop","fall","loss","bear","correction",
];

function analyzeSentiment(text) {
  const t = text.toLowerCase();
  let bull = 0, bear = 0;
  for (const w of BULLISH) if (t.includes(w)) bull++;
  for (const w of BEARISH) if (t.includes(w)) bear++;
  const total = bull + bear;
  if (total === 0) return { sentiment: "neutral", confidence: 50, reason: "No signal" };
  const ratio = (bull - bear) / total;
  const conf = Math.min(95, 50 + total * 8);
  if (ratio > 0.3) return { sentiment: "bullish", confidence: conf, reason: `${Math.round(bull/total*100)}% bullish` };
  if (ratio < -0.3) return { sentiment: "bearish", confidence: conf, reason: `${Math.round(bear/total*100)}% bearish` };
  return { sentiment: "neutral", confidence: 55, reason: "Mixed" };
}

// ===================== Fetch via PowerShell (handles proxy) =====================
function fetchHTML(accountId) {
  const cmd = `$r=Invoke-WebRequest -Uri 'https://syndication.twitter.com/srv/timeline-profile/screen-name/${accountId}' -TimeoutSec 20 -UseBasicParsing;Write-Output $r.Content`;
  return execSync(`powershell -Command "${cmd}"`, {
    encoding: "utf8", maxBuffer: 2 * 1024 * 1024,
    env: { ...process.env, HTTP_PROXY: PROXY, HTTPS_PROXY: PROXY },
    timeout: 25000,
  });
}

// ===================== Extract tweets from __NEXT_DATA__ =====================
function extractTweets(html, accountId) {
  const ndMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!ndMatch) return [];

  let data;
  try { data = JSON.parse(ndMatch[1]); } catch { return []; }

  const pageProps = data.props?.pageProps;
  if (!pageProps) return [];

  function findTweets(obj, depth) {
    if (!obj || typeof obj !== "object" || depth > 15) return [];
    if (Array.isArray(obj)) return obj.flatMap((x) => findTweets(x, depth + 1));
    const results = [];
    for (const [key, val] of Object.entries(obj)) {
      if (key === "tweet" && val?.id_str) results.push(val);
      else if (typeof val === "object" && val !== null) results.push(...findTweets(val, depth + 1));
    }
    return results;
  }

  return findTweets(pageProps, 0)
    .filter((t) => !t.full_text?.startsWith?.("RT @"))  // skip retweets
    .filter((t) => {
      const txt = (t.full_text || t.text || "").trim();
      return txt.length > 20 && !/^https?:\/\/t\.co\/\w+$/.test(txt);  // skip URL-only
    })
    .map((t) => ({
    id: t.id_str,
    text: (t.full_text || t.text || "").replace(/\s+/g, " ").trim().substring(0, 300),
    created_at: t.created_at || "",
    likes: t.favorite_count ?? 0,
    retweets: t.retweet_count ?? 0,
    replies: t.reply_count ?? 0,
    views: t.views?.count ?? 0,
    url: `https://x.com/${accountId}/status/${t.id_str}`,
  }));
}

// Simple sleep helper
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ===================== Main =====================
async function main() {
  console.log("[twitter-feeds] Scanning 15 accounts via syndication.twitter.com...\n");

  // Load state for dedup
  mkdirSync(CACHE_DIR, { recursive: true });
  let state = {};
  if (existsSync(STATE_FILE)) {
    try { state = JSON.parse(readFileSync(STATE_FILE, "utf8")); } catch {}
  }

  const allSignals = [];
  let totalNew = 0, totalFetched = 0;

  for (const acct of WATCHLIST) {
    process.stdout.write(`  @${acct.id.padEnd(18)} `);
    try {
      const html = fetchHTML(acct.id);
      // Respect rate limits: 3s delay between accounts
      await new Promise((r) => setTimeout(r, 3000));
      const tweets = extractTweets(html, acct.id);

      if (tweets.length > 0) {
        const lastId = state[acct.id] || "";
        const newTweets = tweets.filter((t) => t.id !== lastId);

        if (newTweets.length > 0) {
          // Save latest tweets to cache
          writeFileSync(
            `${CACHE_DIR}/${acct.id}.json`,
            JSON.stringify({ account: acct.id, fetched: new Date().toISOString(), tweets }, null, 2)
          );
        }

        for (const t of newTweets.slice(0, 3)) {
          const ai = analyzeSentiment(t.text);
          allSignals.push({ ...t, accountId: acct.id, name: acct.name, tier: acct.tier, tags: acct.tags, ai });
        }

        state[acct.id] = tweets[0].id;
        totalNew += newTweets.length;
        totalFetched += tweets.length;
        console.log(`${tweets.length} tweets (${newTweets.length} new)`);
      } else {
        console.log("no data");
      }
    } catch (e) {
      console.log(`FAILED: ${e.message.substring(0, 40)}`);
    }
  }

  // Compute market sentiment
  const bullCount = allSignals.filter((s) => s.ai.sentiment === "bullish").length;
  const bearCount = allSignals.filter((s) => s.ai.sentiment === "bearish").length;
  const total = allSignals.length;
  const netScore = total > 0 ? ((bullCount - bearCount) / total * 100).toFixed(1) : "0";

  let mood, color;
  const n = parseFloat(netScore);
  if (n > 30) { mood = "🟢 Strongly Bullish"; color = "#10b981"; }
  else if (n > 10) { mood = "🟢 Bullish"; color = "#34d399"; }
  else if (n > -10) { mood = "⚪ Neutral"; color = "#94a3b8"; }
  else if (n > -30) { mood = "🔴 Bearish"; color = "#f87171"; }
  else { mood = "🔴 Strongly Bearish"; color = "#ef4444"; }

  // Sort by tier then engagement
  const tierOrder = { S: 0, A: 1, B: 2, C: 3 };
  allSignals.sort((a, b) => {
    const tDiff = tierOrder[a.tier] - tierOrder[b.tier];
    if (tDiff !== 0) return tDiff;
    return (b.likes + b.retweets) - (a.likes + a.retweets);
  });

  const output = {
    updated: new Date().toISOString(),
    source: "Twitter (syndication.twitter.com)",
    totalAccounts: WATCHLIST.length,
    accountsFetched: Object.keys(state).length,
    totalFetched,
    newTweets: totalNew,
    marketSentiment: { netScore, mood, color, totalSignals: total, bullCount, bearCount },
    signals: allSignals,
  };

  writeFileSync(OUT, JSON.stringify(output, null, 2), "utf8");
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");

  console.log(`\n📊 Twitter Mood: ${mood} (${netScore})`);
  console.log(`✅ ${totalNew} new / ${totalFetched} total tweets → ${OUT}`);
}

main().catch((e) => {
  console.error("[twitter-feeds] Fatal:", e.message);
  process.exit(1);
});
