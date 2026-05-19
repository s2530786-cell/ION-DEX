#!/usr/bin/env node
/**
 * Dual-chain audit gate: ION (FunC) + BSC (Solidity SecurityAttackTest 1500).
 * Run before release / inside verify-100-dual-chain.ps1.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const FORGE = process.env.ION_FORGE_BIN ?? "D:\\openclaw-tools\\foundry\\bin\\forge.exe";
const forgeCmd = existsSync(FORGE) ? FORGE : "forge";

function run(label, command, args, opts = {}) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: opts.cwd ?? ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
    env: { ...process.env, ...opts.env },
  });
  const ms = Date.now() - started;
  if (result.status !== 0) {
    console.error(`\n❌ ${label} FAILED (${ms}ms) exit=${result.status ?? "null"}`);
    if (result.stdout) {
      console.error(result.stdout.slice(-4000));
    }
    if (result.stderr) {
      console.error(result.stderr.slice(-4000));
    }
    process.exit(result.status === null ? 1 : result.status);
  }
  console.log(`✅ ${label} (${ms}ms)`);
}

console.log("═══════════════════════════════════════════════════════");
console.log("  ION DEX Dual-Chain Audit — ION FunC + BSC Solidity");
console.log("  Standard: 15 attack classes × 100 iterations = 1500 each");
console.log("═══════════════════════════════════════════════════════\n");

console.log("── ION Chain (FunC) ──");
run("ION compile-func", process.execPath, [join(ROOT, "scripts", "compile-func.mjs")]);
run("ION func-contract-test", process.execPath, [join(ROOT, "scripts", "func-contract-test.mjs")]);
run("ION func-security-audit 1500", process.execPath, [join(ROOT, "scripts", "func-security-audit.mjs")]);

console.log("\n── BSC Chain (Solidity / Foundry) ──");
run("BSC forge build", forgeCmd, ["build"], { cwd: join(ROOT, "contracts", "bsc") });
run("BSC SecurityAttackTest 1500", forgeCmd, ["test", "--match-contract", "SecurityAttackTest", "--summary"], {
  cwd: join(ROOT, "contracts", "bsc"),
});

if (process.env.ION_SKIP_SLITHER !== "1") {
  const slither = "D:\\openclaw-tools\\venv\\Scripts\\slither.exe";
  if (existsSync(slither)) {
    const slitherResult = spawnSync(
      slither,
      [join(ROOT, "contracts", "bsc", "src"), "--solc", forgeCmd, "--fail-none"],
      { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    if (slitherResult.status === 0) {
      console.log("✅ BSC slither (advisory) — completed");
    } else {
      console.log("⚠️ BSC slither findings — review reports/ (non-blocking)");
    }
  }
}

console.log("\n═══════════════════════════════════════════════════════");
console.log("  DUAL-CHAIN AUDIT: ALL MANDATORY GATES GREEN");
console.log("  ION 1500 + BSC 1500 + compile/artifact regression");
console.log("═══════════════════════════════════════════════════════\n");
