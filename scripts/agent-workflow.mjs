#!/usr/bin/env node
/**
 * ION DEX agent automatic workflow orchestrator.
 *
 * Enforces: memory retrieval (iron laws) -> optional verification tiers -> prints next actions.
 *
 * Usage:
 *   node scripts/agent-workflow.mjs
 *   node scripts/agent-workflow.mjs --tier memory
 *   node scripts/agent-workflow.mjs --tier verify --execute
 *   node scripts/agent-workflow.mjs --tier strict --execute
 *   node scripts/agent-workflow.mjs --tier ui --execute
 *   ION_UI_STRICT=1 node scripts/agent-workflow.mjs --tier strict --execute
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();

const WORKFLOW_STEPS = [
  "1. Memory: node scripts/dev-preflight.mjs (+ security preflight for high-risk work)",
  "2. Scope: one page or one shared primitive from docs/10-ui-design-route.md",
  "3. Design map: PRD modules + data sources from .memory-bank/live-data-reference.md",
  "4. Implement: NeonCard / AuroraGalaxyBackground / liquid-glass reference style",
  "5. Data: typed backend API only — no empty data or pseudo-code",
  "6. Visual self-check: 5D aurora + thick neon rims vs reference (not flat tables)",
  "7. Verify: encoding, frontend verify, audit:high, backend verify when touched",
  "8. Update SESSION_STATE.md and docs/99-current-progress.md",
];

function parseArgs(argv) {
  let tier = "memory";
  let execute = false;
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--execute") {
      execute = true;
      continue;
    }
    if (arg === "--tier" && argv[i + 1]) {
      tier = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--tier=")) {
      tier = arg.slice("--tier=".length);
    }
  }
  if (!["memory", "verify", "strict", "ui"].includes(tier)) {
    throw new Error(`Unknown tier "${tier}". Use memory | verify | strict | ui.`);
  }
  return { tier, execute };
}

function runNodeScript(script, extraEnv = {}) {
  const result = spawnSync(process.execPath, [join(root, script)], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
  if (result.status !== 0) {
    throw new Error(`${script} exited with code ${result.status ?? 1}`);
  }
}

function runShell(script) {
  const result = spawnSync("bash", [join(root, script)], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`${script} exited with code ${result.status ?? 1}`);
  }
}

function extractNextActions() {
  const sessionPath = join(root, "SESSION_STATE.md");
  const content = readFileSync(sessionPath, "utf8");
  const marker = "## Next Action";
  const start = content.indexOf(marker);
  if (start < 0) {
    return ["(SESSION_STATE.md missing ## Next Action section)"];
  }
  const rest = content.slice(start + marker.length);
  const end = rest.indexOf("\n## ");
  const block = (end >= 0 ? rest.slice(0, end) : rest).trim();
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function printMemoryManifest() {
  const files = [
    ".memory-bank/overall-design-framework.md",
    ".memory-bank/live-data-reference.md",
    ".memory-bank/implementation-playbook.md",
    ".memory-bank/architecture-audit.md",
    ".memory-bank/security-audit-and-stress-framework.md",
    "docs/00-engineering-standards.md",
    "docs/10-ui-design-route.md",
    "SESSION_STATE.md",
  ];
  console.log("=== Memory retrieval manifest (iron laws) ===");
  for (const file of files) {
    console.log(`  - ${file}`);
  }
}

const { tier, execute } = parseArgs(process.argv);

console.log("=== ION DEX agent workflow ===");
console.log(`Tier: ${tier}`);
console.log(`Execute: ${execute ? "yes" : "no (dry-run)"}`);
console.log("");

printMemoryManifest();
console.log("");
console.log("=== Automatic implementation loop (docs/10-ui-design-route.md) ===");
for (const step of WORKFLOW_STEPS) {
  console.log(step);
}
console.log("");
console.log("=== SESSION_STATE next actions ===");
for (const line of extractNextActions()) {
  console.log(line);
}
console.log("");

if (!execute) {
  console.log("Dry-run complete. Re-run with --execute to run verification tiers.");
  console.log("  node scripts/agent-workflow.mjs --tier memory --execute");
  console.log("  node scripts/agent-workflow.mjs --tier verify --execute");
  process.exit(0);
}

console.log("=== Executing tier:", tier, "===");
if (tier === "ui" || tier === "strict") {
  process.env.ION_UI_STRICT = process.env.ION_UI_STRICT ?? "1";
}
runNodeScript("scripts/dev-preflight.mjs");
runNodeScript("scripts/security-preflight.mjs");

if (tier === "verify" || tier === "strict" || tier === "ui") {
  runShell("scripts/verify-full.sh");
}

console.log("");
console.log("OK - agent workflow completed.");
