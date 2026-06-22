#!/usr/bin/env node
/**
 * Run a Foundry test contract match N times (default 100).
 * Red once → exit 1; operator must fix and restart from zero.
 *
 * Usage:
 *   node scripts/stress-forge-contract-100.mjs --match-contract LiquidityMine
 *   node scripts/stress-forge-contract-100.mjs --match-contract LiquidityMine --rounds 100
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contractsDir = join(root, "contracts");

const args = process.argv.slice(2);
function readFlag(name, fallback) {
  const i = args.indexOf(name);
  if (i === -1 || i === args.length - 1) return fallback;
  return args[i + 1];
}

const matchContract = readFlag("--match-contract", "");
const rounds = Number(readFlag("--rounds", "100"));

if (!matchContract) {
  console.error("Usage: node scripts/stress-forge-contract-100.mjs --match-contract <Name> [--rounds 100]");
  process.exit(1);
}

const forgeCandidates = [
  process.env.ION_FORGE_BIN,
  join("D:", "openclaw-tools", "foundry", "bin", "forge.exe"),
  "forge",
].filter(Boolean);

const forgeExe = forgeCandidates.find((p) => p === "forge" || existsSync(p));
if (!forgeExe) {
  console.error("forge not found; set ION_FORGE_BIN");
  process.exit(1);
}

console.log(`=== Forge stress: ${matchContract} × ${rounds} ===`);

for (let i = 1; i <= rounds; i++) {
  const run = spawnSync(
    forgeExe,
    ["test", "--match-contract", matchContract, "--match-path", "test/**"],
    { cwd: contractsDir, encoding: "utf8" },
  );
  const ok = run.status === 0;
  if (!ok) {
    console.error(`FAIL round ${i}/${rounds}`);
    if (run.stdout) process.stderr.write(run.stdout);
    if (run.stderr) process.stderr.write(run.stderr);
    process.exit(1);
  }
  if (i % 10 === 0 || i === rounds) {
    console.log(`PASS ${i}/${rounds}`);
  }
}

console.log(`OK - ${matchContract}: ${rounds}/${rounds} green`);
process.exit(0);
