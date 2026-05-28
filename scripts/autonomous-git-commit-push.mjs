#!/usr/bin/env node
/**
 * After verify-100 GREEN: git add / commit / push, then watchdog continues to next queue step.
 *
 * Usage:
 *   node scripts/autonomous-git-commit-push.mjs --batch B
 *   node scripts/autonomous-git-commit-push.mjs --batch B --since 2026-05-28T07:35:00Z
 */

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const shell = false;
const tempDir = process.env.TEMP || process.env.TMP || root;

const BATCH_META = {
  B: {
    title: "Dashboard 设计签收",
    gapReport: "docs/ui-gap-analysis-batch-b-2026-05-26.md",
    screenshotDir: "docs/screenshots/ui-signoff/batch-b",
  },
  C: {
    title: "Trade / Swap 专业面",
    gapReport: "docs/ui-gap-analysis-batch-c-2026-05-26.md",
    screenshotDir: "docs/screenshots/ui-signoff/batch-c",
  },
  D: {
    title: "Pool / Stake / Burn / Bridge / Domain",
    gapReport: "docs/ui-gap-analysis-batch-d-2026-05-26.md",
    screenshotDir: "docs/screenshots/ui-signoff/batch-d",
  },
};

function parseArgs(argv) {
  let batch = "B";
  let sinceMs = 0;
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--batch" && argv[i + 1]) {
      batch = String(argv[++i]).toUpperCase();
      continue;
    }
    if (a.startsWith("--batch=")) {
      batch = a.slice("--batch=".length).toUpperCase();
      continue;
    }
    if (a === "--since" && argv[i + 1]) {
      sinceMs = Date.parse(argv[++i]);
      continue;
    }
  }
  return { batch, sinceMs };
}

function latestVerify100Summary() {
  try {
    const files = readdirSync(tempDir)
      .filter((f) => f.startsWith("ion-verify-100-summary-") && f.endsWith(".txt"))
      .map((f) => {
        const path = join(tempDir, f);
        return { path, text: readFileSync(path, "utf8"), mtimeMs: statSync(path).mtimeMs };
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs);
    return files[0] ?? { path: "", text: "", mtimeMs: 0 };
  } catch {
    return { path: "", text: "", mtimeMs: 0 };
  }
}

function isVerify100Green(text) {
  return text.includes("RESULT=GREEN") && /PASSED=100/.test(text) && /FAILED=0/.test(text);
}

function run(cmd, args) {
  console.log(`\n>> ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell,
    env: { ...process.env, ION_VERIFY_NONINTERACTIVE: "1", ION_AGENT_AUTONOMOUS: "1" },
  });
  return result.status ?? 1;
}

function updateRound2Table(batch, verifyNote) {
  const path = join(root, "docs/ui-round2-visual-alignment.md");
  if (!existsSync(path)) return;
  let text = readFileSync(path, "utf8");
  const row = `| 2026-05-28 | ${batch} | verify-100 GREEN 后自动 commit+push | ${verifyNote} |`;
  if (text.includes(`| 2026-05-28 | ${batch} |`)) {
    text = text.replace(new RegExp(`\\| 2026-05-28 \\| ${batch} \\|[^\\n]+\\n`), `${row}\n`);
  } else {
    text = text.replace("| — | — | （待填） | — |", `${row}\n| — | — | （待填） | — |`);
  }
  writeFileSync(path, text, "utf8");
}

const { batch, sinceMs } = parseArgs(process.argv);
const meta = BATCH_META[batch];
if (!meta) {
  console.error(`Unknown batch: ${batch}`);
  process.exit(1);
}

const summary = latestVerify100Summary();
if (!isVerify100Green(summary.text)) {
  console.error("verify-100 not GREEN — refuse commit+push");
  if (summary.path) console.error(`Latest summary: ${summary.path}`);
  process.exit(1);
}
if (sinceMs > 0 && summary.mtimeMs < sinceMs) {
  console.error("Latest GREEN summary is older than queue activation — waiting for current verify-100 run");
  console.error(`Summary mtime=${new Date(summary.mtimeMs).toISOString()} since=${new Date(sinceMs).toISOString()}`);
  process.exit(1);
}

const verifyNote = `verify-100 GREEN (${summary.path})`;
updateRound2Table(batch, verifyNote);

const msg = `ui(design-phase): Batch ${batch} after verify-100 GREEN

- ${meta.title}
- Gap: ${meta.gapReport}
- Screenshots: ${meta.screenshotDir}
- ${verifyNote}
- Autonomous: commit+push triggered by watchdog after PASSED=100`;

let code = run("git", ["add", "-A"]);
if (code !== 0) process.exit(code);

const commit = spawnSync("git", ["commit", "-m", msg], { cwd: root, encoding: "utf8", shell });
if (commit.status !== 0) {
  const out = `${commit.stdout || ""}${commit.stderr || ""}`;
  if (out.includes("nothing to commit")) {
    console.log("git: nothing to commit (already committed)");
  } else {
    console.error(out);
    process.exit(commit.status ?? 1);
  }
} else {
  console.log("git: commit OK");
}

code = run("git", ["push"]);
if (code !== 0) process.exit(code);

console.log(`\n=== autonomous-git-commit-push Batch ${batch} OK ===`);
process.exit(0);
