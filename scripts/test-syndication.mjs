#!/usr/bin/env node
// Test script: parse syndication.twitter.com for tweets

const PROXY = "http://127.0.0.1:7890";
const USER = process.argv[2] || "elonmusk";

const url = `https://syndication.twitter.com/srv/timeline-profile/screen-name/${USER}`;

fetch(url)
  .then(r => r.text())
  .then(html => {
    console.log("=== syndication.twitter.com/" + USER + " ===");
    console.log("HTML length:", html.length);

    // Find all JSON-like data embeddings
    const jsonBlobs = [];
    
    // Method 1: __INITIAL_STATE__
    const stateMatch = html.match(/__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
    if (stateMatch) {
      try {
        jsonBlobs.push({ name: "__INITIAL_STATE__", data: JSON.parse(stateMatch[1]) });
      } catch (e) { console.log("INITIAL_STATE parse fail:", e.message.substring(0, 50)); }
    }

    // Method 2: Look for script data with JSON
    const dataScripts = html.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
    console.log("JSON data scripts:", dataScripts.length);

    // Method 3: Look for embedded tweet data in JS
    const jsMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
    console.log("Total scripts:", jsMatches.length);
    
    // Try to find tweets directly in scripts
    let tweetCount = 0;
    for (const script of jsMatches) {
      if (script.includes('tweet') && script.includes('text')) {
        tweetCount++;
      }
    }
    console.log("Scripts containing 'tweet+text':", tweetCount);

    // Method 4: Search HTML for tweet data attributes
    const tweetDivs = html.match(/data-tweet-id="(\d+)"/g) || [];
    console.log("data-tweet-id attributes:", tweetDivs.length);

    // Method 5: Try to find the main JSON payload
    const payloadMatch = html.match(/\{[^}]*"has_more_items"[^}]*\}/);
    if (payloadMatch) {
      console.log("Found has_more_items in:", payloadMatch[0].substring(0, 100));
    }

    // Try parsing tweets from the HTML directly
    const tweetTexts = html.match(/"full_text"\s*:\s*"([^"]+)"/g) || [];
    console.log("full_text matches:", tweetTexts.length);
    tweetTexts.slice(0, 3).forEach(t => {
      console.log("  ", t.substring(0, 120));
    });

    // Save a sample for inspection
    const fs = require("fs");
    fs.writeFileSync("D:/openclaw-tools/ion-dex-nuke/cache/syndication-sample.html", html.substring(0, 5000));
    console.log("\nSample saved to cache/syndication-sample.html");
  })
  .catch(e => console.error("Error:", e.message));
