#!/usr/bin/env node
// Parse syndication.twitter.com __NEXT_DATA__ → extract tweets
import { execSync } from "child_process";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";

const PROXY = "http://127.0.0.1:7890";
const USER = process.argv[2] || "elonmusk";

// PowerShell handles proxy correctly for syndication.twitter.com
function fetchHTML(accountId) {
  const psCmd = `$r = Invoke-WebRequest -Uri 'https://syndication.twitter.com/srv/timeline-profile/screen-name/${accountId}' -TimeoutSec 20 -UseBasicParsing; Write-Output $r.Content`;
  return execSync(`powershell -Command "${psCmd}"`, {
    encoding: "utf8",
    maxBuffer: 2 * 1024 * 1024,
    env: { ...process.env, HTTP_PROXY: PROXY, HTTPS_PROXY: PROXY },
  });
}

function extractTweets(html, accountId) {
  // Extract __NEXT_DATA__
  const ndMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!ndMatch) return [];

  const data = JSON.parse(ndMatch[1]);
  const pageProps = data.props?.pageProps;
  if (!pageProps) return [];

  // Deep search for tweet objects
  function find(obj, depth) {
    if (!obj || typeof obj !== "object" || depth > 15) return [];
    if (Array.isArray(obj)) return obj.flatMap((x) => find(x, depth + 1));

    const results = [];
    for (const [key, val] of Object.entries(obj)) {
      if (key === "tweet" && val && typeof val === "object" && val.id_str) {
        results.push(val);
      } else if (typeof val === "object" && val !== null) {
        results.push(...find(val, depth + 1));
      }
    }
    return results;
  }

  const tweets = find(pageProps, 0);
  return tweets.map((t) => ({
    id: t.id_str,
    text: (t.full_text || t.text || "").replace(/\s+/g, " ").trim().substring(0, 300),
    created_at: t.created_at,
    likes: t.favorite_count ?? 0,
    retweets: t.retweet_count ?? 0,
    replies: t.reply_count ?? 0,
    views: t.views?.count ?? 0,
    user_screen_name: t.user?.screen_name || accountId,
    user_name: t.user?.name || "",
    url: `https://x.com/${accountId}/status/${t.id_str}`,
  }));
}

// ===================== Sentiment Analysis =====================
const BULLISH = [
  "bullish", "moon", "pump", "rally", "surge", "partnership", "launch", "listing",
  "adoption", "breakthrough", "upgrade", "buy", "long", "approve", "etf",
  "institutional", "accumulat", "halving", "announc", "integration", "mainnet",
  "airdrop", "grant", "record", "soar", "spike", "outperform", "beat", "profit",
  "growth", "expansion", "milestone", "soon", "incoming",
];
const BEARISH = [
  "bearish", "dump", "crash", "hack", "exploit", "ban", "regulation", "lawsuit",
  "sec", "crackdown", "delist", "sell-off", "short", "scam", "rug", "ponzi",
  "investigation", "freeze", "sanction", "liquidat", "default", "bankrupt",
  "depeg", "plummet", "plunge", "decline", "fear", "volatility", "risk",
  "warning", "sell", "drop", "fall", "loss", "bear", "correction",
];

function analyzeSentiment(text) {
  const t = text.toLowerCase();
  let bull = 0, bear = 0;
  for (const w of BULLISH) if (t.includes(w)) bull++;
  for (const w of BEARISH) if (t.includes(w)) bear++;

  const total = bull + bear;
  if (total === 0) return { sentiment: "neutral", confidence: 50, reason: "No signal words" };

  const ratio = (bull - bear) / total;
  const conf = Math.min(95, 50 + total * 8);

  if (ratio > 0.3) return { sentiment: "bullish", confidence: conf, reason: `Bullish ${Math.round((bull/total)*100)}%` };
  if (ratio < -0.3) return { sentiment: "bearish", confidence: conf, reason: `Bearish ${Math.round((bear/total)*100)}%` };
  return { sentiment: "neutral", confidence: 55, reason: "Mixed signals" };
}

// ===================== Main =====================
async function main() {
  console.log(`[twitter] Fetching @${USER}...`);

  let html;
  try {
    html = fetchHTML(USER);
  } catch (e) {
    console.error("Fetch error:", e.message);
    process.exit(1);
  }

  console.log(`HTML: ${html.length} chars`);

  const tweets = extractTweets(html, USER);
  console.log(`Tweets: ${tweets.length}`);

  for (const t of tweets.slice(0, 5)) {
    const ai = analyzeSentiment(t.text);
    console.log(`  [${t.id}] ${t.text.substring(0, 100)}`);
    console.log(`    AI: ${ai.sentiment} (${ai.confidence}%) - ${ai.reason}`);
    console.log(`    ❤️${t.likes} 🔄${t.retweets} 💬${t.replies}`);
  }

  // Save full data
  const outDir = "D:/openclaw-tools/ion-dex-nuke/cache";
  mkdirSync(outDir, { recursive: true });

  const output = {
    account: USER,
    fetched: new Date().toISOString(),
    tweetCount: tweets.length,
    tweets: tweets.map((t) => ({
      ...t,
      ai: analyzeSentiment(t.text),
    })),
  };

  writeFileSync(`${outDir}/twitter-${USER}.json`, JSON.stringify(output, null, 2));
  console.log(`\nSaved: cache/twitter-${USER}.json`);
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
