#!/usr/bin/env node
// bounty-wormhole.mjs — Cursor直接执行: node scripts/bounty-wormhole.mjs
const { execSync } = require("child_process");
const { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } = require("fs");
const { join } = require("path");

const $ = (cmd, opts) => { try { return execSync(cmd, { encoding: "utf8", stdio: "pipe", ...opts }); } catch (e) { if (opts?.ignore) return ""; throw e; } };
const LOG = [];

// ===== CONFIG =====
const TARGET = {
  repo: "https://github.com/wormhole-foundation/wormhole",
  dir: "D:/openclaw-data/workspace/repos/wormhole",
  platform: "immunefi",
  reward: "$2K-$10K",
  deadline: "2026-05-28",
};
const QUEUE = "D:/openclaw-data/workspace/scripts/pipeline/queue";
const REPORTS = "D:/openclaw-data/workspace/scripts/pipeline/reports/wormhole";

// ===== ATTACK VECTORS =====
const VECTORS = [
  { id:"reentrancy",       severity:"Critical", reward:"$10K+",  re:/\.call\{|\.call\(|\.transfer\(|\.send\(/g },
  { id:"flash_loan",      severity:"Critical", reward:"$10K+",  re:/getPrice|getRate|TWAP|spotPrice|getReserves/i },
  { id:"signature_forgery",severity:"Critical",reward:"$10K+",  re:/ecrecover|signature|verifySignature|recoverAddress/i },
  { id:"access_control",  severity:"High",     reward:"$5-10K", re:/onlyOwner|onlyRole|onlyAdmin|msg\.sender\s*==/i },
  { id:"integer_overflow",severity:"Med-High", reward:"$2-10K", re:/unchecked\s*\{|uint\d+\s*\+\s*|uint\d+\s*-\s*/g },
  { id:"dos",             severity:"Medium",   reward:"$2-5K",  re:/for\s*\(.*\.\.|\.push\(|array\.length/i },
  { id:"cross_chain_replay",severity:"Critical",reward:"$10K+",re:/chainId|nonce|sequence|vaa|emitterChainId/i },
  { id:"fake_token",      severity:"Medium",   reward:"$2-5K",  re:/IERC20\(|token.*address|ERC20\(/i },
  { id:"timestamp",       severity:"Low-Med",  reward:"$1-5K",  re:/block\.timestamp|block\.number|blockhash/ },
  { id:"oracle",          severity:"High",     reward:"$5-10K", re:/oracle|getPrice|latestAnswer|latestRoundData/i },
];

// ===== MAIN =====
async function main() {
  const step = process.argv[2] || "all";
  console.log(`\n=== BOUNTY: ${TARGET.platform} / ${TARGET.repo.split("/").pop()} ===`);
  console.log(`=== STEP: ${step} | REWARD: ${TARGET.reward} ===\n`);

  try {
    if (step === "clone" || step === "all") await cloneRepo();
    if (step === "clone") return done();

    if (step === "read" || step === "all") readSecurityPolicy();
    if (step === "read") return done();

    const solFiles = findSolFiles();
    if (step === "index" || step === "all") buildIndex(solFiles);
    if (step === "index") return done();

    if (step === "scan" || step === "all") scanAttackSurface(solFiles);
    if (step === "scan") return done();

    if (step === "setup" || step === "all") setupFoundry();
    if (step === "setup") return done();

    if (step === "report" || step === "all") generateReports(scanAttackSurface(solFiles));
    if (step === "report") return done();

    if (step === "check" || step === "all") finalCheck();
    if (step === "check") return done();

    if (step === "done" || step === "all") createDoneMarker();
    if (step === "done") return done();

    done();
  } catch (e) {
    console.error(`\nFAIL: ${e.message}`);
    process.exit(1);
  }
}

// ===== STEP 1: CLONE =====
async function cloneRepo() {
  console.log("[1/8] clone");
  if (existsSync(join(TARGET.dir, ".git"))) {
    $(`git pull origin main`, { cwd: TARGET.dir, ignore: true });
    console.log("  pulled existing repo");
  } else {
    mkdirSync(TARGET.dir, { recursive: true });
    $(`git clone ${TARGET.repo} .`, { cwd: TARGET.dir });
    console.log("  cloned");
  }
  $(`git log --oneline -10`, { cwd: TARGET.dir });
  const eth = join(TARGET.dir, "ethereum");
  if (!existsSync(eth)) throw new Error("MISSING ethereum/ — wrong repo structure");
}

// ===== STEP 2: READ =====
function readSecurityPolicy() {
  console.log("[2/8] read SECURITY.md + CONTRIBUTING.md");
  for (const f of ["README.md", "SECURITY.md", "CONTRIBUTING.md"]) {
    const p = join(TARGET.dir, f);
    if (existsSync(p)) {
      const c = readFileSync(p, "utf8");
      console.log(`  ${f}: ${c.length}B`);
      // Check for Immunefi link
      if (/immunefi/i.test(c)) console.log(`  >>> FOUND Immunefi ref in ${f}`);
    } else {
      console.log(`  ${f}: NOT FOUND`);
    }
  }
}

// ===== STEP 3: INDEX =====
function findSolFiles() {
  const results = [];
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir)) {
      const f = join(dir, e);
      const s = statSync(f);
      if (s.isDirectory() && !e.startsWith(".") && e !== "node_modules") walk(f);
      else if (e.endsWith(".sol")) results.push({ path: f.replace(TARGET.dir + "/", ""), full: f });
    }
  }
  walk(join(TARGET.dir, "ethereum"));
  return results;
}

function buildIndex(solFiles) {
  console.log(`[3/8] index — ${solFiles.length} .sol files`);
  const rows = [];
  for (const { path, full } of solFiles) {
    const c = readFileSync(full, "utf8");
    const lines = c.split("\n").length;
    const nContracts = (c.match(/contract\s+(\w+)/g) || []).length;
    const nFuncs = (c.match(/function\s+(\w+)/g) || []).length;
    const extCalls = (c.match(/\.call\(|\.delegatecall\(|I\w+\(/g) || []).length;
    rows.push({ path, lines, nContracts, nFuncs, extCalls });
  }
  rows.sort((a, b) => b.lines - a.lines);
  console.table(rows.slice(0, 10));
  return rows;
}

// ===== STEP 4: SCAN =====
function scanAttackSurface(solFiles) {
  console.log(`[4/8] scan — 10 attack vectors`);
  const findings = [];
  for (const v of VECTORS) {
    const hits = [];
    for (const { path, full } of solFiles) {
      const lines = readFileSync(full, "utf8").split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (v.re.test(lines[i])) {
          hits.push(`${path}:${i + 1}  ${lines[i].trim().slice(0, 100)}`);
        }
      }
    }
    const icon = hits.length > 0 ? "🔴" : "🟢";
    const tag = hits.length > 0 ? `FOUND ${hits.length}` : "CLEAN";
    console.log(`  ${icon} ${v.id.padEnd(22)} [${v.severity.padEnd(9)} ${v.reward.padEnd(8)}] ${tag}`);
    if (hits.length > 0) {
      hits.slice(0, 5).forEach(h => console.log(`     ${h}`));
      findings.push({ vector: v.id, severity: v.severity, reward: v.reward, hits });
    }
  }
  console.log(`\n  TOTAL: ${findings.length}/10 vectors have hits`);
  return findings;
}

// ===== STEP 5: SETUP FOUNDRY =====
function setupFoundry() {
  console.log("[5/8] setup Foundry fork");
  const testDir = join(TARGET.dir, "test", "audit");
  mkdirSync(testDir, { recursive: true });
  
  const poc = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "forge-std/Test.sol";

contract WormholeAuditBase is Test {
    function setUp() public virtual {
        vm.createSelectFork("https://bsc-dataseed.binance.org/");
    }
}

contract ReentrancyExploit is WormholeAuditBase {
    function testReentrancy() public {
        // TODO: fill real contract address
    }
    function testReentrancy100Times() public {
        for (uint256 i = 0; i < 100; i++) testReentrancy();
    }
}
`;
  writeFileSync(join(testDir, "WormholeAudit.t.sol"), poc);
  console.log(`  test/audit/WormholeAudit.t.sol created`);
  console.log(`  RUN: forge test --match-path test/audit/ -vvv`);
}

// ===== STEP 6: REPORTS =====
function generateReports(findings) {
  console.log("[6/8] reports");
  mkdirSync(REPORTS, { recursive: true });
  if (findings.length > 0) {
    findings.forEach((f, i) => {
      const rpt = `# [${f.severity}] ${f.vector} — Wormhole
> platform: immunefi | reward: ${f.reward} | date: ${new Date().toISOString()}

## Description
TODO: deep analysis of ${f.hits.length} pattern matches

## Impact
severity: ${f.severity} | estimated loss: ${f.reward}

## PoC
\`\`\`solidity
// TODO: forked mainnet PoC — must pass 100/100
\`\`\`

## Fix
\`\`\`diff
// TODO: code diff
\`\`\`

> AUTO-GENERATED by bounty-wormhole.mjs — needs manual review
> DO NOT SUBMIT without approval
`;
      const fn = `report-${String(i+1).padStart(3,"0")}-${f.vector}.md`;
      writeFileSync(join(REPORTS, fn), rpt);
      console.log(`  ${fn}`);
    });
  } else {
    writeFileSync(join(REPORTS, "summary-clean.md"), `# Wormhole Audit Summary — NO FINDINGS\n> date: ${new Date().toISOString()}\n\nAll 10 attack vectors scanned. No pattern matches found.\n\n⚠️ Automated scan only — manual deep review still required.\n`);
    console.log("  summary-clean.md (no findings)");
  }
}

// ===== STEP 7: CHECK =====
function finalCheck() {
  console.log("[7/8] final check");
  const items = [
    ["repo cloned", existsSync(join(TARGET.dir, ".git"))],
    ["ethereum/ dir", existsSync(join(TARGET.dir, "ethereum"))],
    ["test/audit/ dir", existsSync(join(TARGET.dir, "test", "audit"))],
    ["reports dir", existsSync(REPORTS)],
  ];
  let ok = true;
  for (const [label, pass] of items) {
    console.log(`  ${pass ? "PASS" : "FAIL"} ${label}`);
    if (!pass) ok = false;
  }
  if (!ok) throw new Error("checks failed");
}

// ===== STEP 8: DONE =====
function createDoneMarker() {
  console.log("[8/8] done marker");
  mkdirSync(QUEUE, { recursive: true });
  const marker = {
    id: "wormhole-001",
    completed: new Date().toISOString(),
    status: "PENDING_REVIEW",
    note: "WAIT FOR REVIEW — do not submit directly to Immunefi",
  };
  writeFileSync(join(QUEUE, "done-wormhole-001.json"), JSON.stringify(marker, null, 2));
  console.log("  done-wormhole-001.json created");
}

function done() {
  console.log("\n=== DONE ===\n");
  process.exit(0);
}

main();
