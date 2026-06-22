#!/usr/bin/env node
/**
 * One-shot verify-100 progress for agents / CI / humans.
 * Usage: node scripts/verify-100-progress-snapshot.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const tempDir = process.env.TEMP || tmpdir();
const lockPath = join(tempDir, "ion-verify-100.lock");

function latestSummary() {
  const files = readdirSync(tempDir)
    .filter((f) => f.startsWith("ion-verify-100-summary-") && f.endsWith(".txt"))
    .map((f) => {
      const path = join(tempDir, f);
      return { path, text: readFileSync(path, "utf8"), mtimeMs: statSync(path).mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  const green = files.find(
    (s) => /^RESULT=GREEN$/m.test(s.text) && /^PASSED=100$/m.test(s.text),
  );
  const inProgress = files.find((s) => /PASS \d+ OK/.test(s.text) && !/^RESULT=GREEN$/m.test(s.text));
  return inProgress ?? green ?? files[0] ?? null;
}

function parse(text) {
  let maxPass = 0;
  let passed = null;
  let failed = null;
  let result = null;
  for (const line of text.split(/\r?\n/)) {
    const pm = line.match(/^PASS (\d+) OK$/);
    if (pm) maxPass = Math.max(maxPass, Number(pm[1]));
    if (line.startsWith("PASSED=")) passed = line.slice(7);
    if (line.startsWith("FAILED=")) failed = line.slice(7);
    if (line.startsWith("RESULT=")) result = line.slice(7);
  }
  return { maxPass, passed, failed, result };
}

const summary = latestSummary();
if (!summary) {
  console.log("VERIFY-100: no summary file in %TEMP%");
  process.exit(1);
}

const p = parse(summary.text);
const total = 100;
const current = p.result === "GREEN" ? 100 : p.maxPass;
const lock = existsSync(lockPath);
const pct = ((current / total) * 100).toFixed(1);
const barLen = 20;
const filled = Math.round((current / total) * barLen);
const bar = "█".repeat(filled) + "░".repeat(barLen - filled);

console.log("");
console.log("════════════════════════════════════════");
console.log("  ION verify-100 进度快照");
console.log("════════════════════════════════════════");
console.log(`  进度: ${current}/${total} (${pct}%)  [${bar}]`);
if (p.result === "GREEN") {
  console.log(`  状态: ✅ GREEN  PASSED=${p.passed}  FAILED=${p.failed}`);
} else if (lock) {
  console.log(`  状态: ⏳ 运行中 (lock 存在)  下一轮: ${current + 1}/100`);
} else {
  console.log(`  状态: ⚠ 未检测到 lock（可能暂停或刚结束一轮）`);
}
console.log(`  摘要: ${summary.path}`);
console.log(`  更新: ${new Date(summary.mtimeMs).toISOString()}`);
console.log("════════════════════════════════════════");
console.log("");

process.exit(p.result === "GREEN" ? 0 : 2);
