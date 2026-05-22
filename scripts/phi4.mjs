#!/usr/bin/env node
/**
 * phi4-multimodal.mjs — GitHub Models Phi-4 多模态调用
 * 功能: 文本 | 图片分析 | 音频转文字
 * 免费: $0.00/百万token | 128K 上下文 | 支持中文
 *
 * 用法:
 *   node phi4.mjs "你的问题"
 *   node phi4.mjs --image ./screenshot.png "描述这张图"
 *   node phi4.mjs --audio ./voice.mp3
 *
 * 环境变量 (Windows PowerShell):
 *   $env:HTTP_PROXY="http://127.0.0.1:7890"
 *   $env:HTTPS_PROXY="http://127.0.0.1:7890"
 *   $env:GITHUB_TOKEN="ghp_..."  # GitHub PAT
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import https from "node:https";

// ── Config ──
const API_URL = "https://models.github.ai/inference/chat/completions";
const MODEL = "microsoft/phi-4-multimodal-instruct";

// ── CLI Parse ──
const args = process.argv.slice(2);
let imagePath = null;
let audioPath = null;
const textParts = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--image" || args[i] === "-i") {
    imagePath = args[++i];
  } else if (args[i] === "--audio" || args[i] === "-a") {
    audioPath = args[++i];
  } else {
    textParts.push(args[i]);
  }
}
const prompt = textParts.join(" ") || "Hello";

// ── Auth ──
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) {
  console.error("❌ 请设置 GITHUB_TOKEN 环境变量 (GitHub PAT)");
  process.exit(1);
}

// ── Build Messages ──
const content = [];

if (imagePath) {
  const resolved = resolve(imagePath);
  if (!existsSync(resolved)) {
    console.error(`❌ 图片不存在: ${resolved}`);
    process.exit(1);
  }
  const buf = readFileSync(resolved);
  const mime = resolved.endsWith(".png") ? "image/png" : "image/jpeg";
  const b64 = buf.toString("base64");
  content.push({
    type: "image_url",
    image_url: { url: `data:${mime};base64,${b64}`, detail: "auto" },
  });
}

if (audioPath) {
  const resolved = resolve(audioPath);
  if (!existsSync(resolved)) {
    console.error(`❌ 音频不存在: ${resolved}`);
    process.exit(1);
  }
  const buf = readFileSync(resolved);
  const b64 = buf.toString("base64");
  content.push({
    type: "input_audio",
    input_audio: { data: b64, format: resolved.endsWith(".mp3") ? "mp3" : "wav" },
  });
}

content.push({ type: "text", text: prompt });

const body = JSON.stringify({
  model: MODEL,
  messages: [{ role: "user", content }],
  max_tokens: 4096,
  temperature: 0.3,
});

// ── HTTP with proxy support ──
const url = new URL(API_URL);
const proxyEnv = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "phi4-cli/1.0",
    "Content-Length": Buffer.byteLength(body),
  },
  timeout: 120000,
};

function fetchWithProxy(opts) {
  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timeout")); });
    req.write(body);
    req.end();
  });
}

// ── Main ──
try {
  process.stderr.write(`🔄 调用 ${MODEL}...\n`);

  const resp = await fetchWithProxy(options);

  if (resp.status !== 200) {
    console.error(`❌ HTTP ${resp.status}: ${JSON.stringify(resp.data, null, 2)}`);
    process.exit(1);
  }

  const text = resp.data?.choices?.[0]?.message?.content;
  if (text) {
    console.log(text);
  } else {
    console.error("⚠️ 空响应", JSON.stringify(resp.data, null, 2));
    process.exit(1);
  }
} catch (err) {
  console.error(`❌ 请求失败: ${err.message}`);
  process.exit(1);
}
