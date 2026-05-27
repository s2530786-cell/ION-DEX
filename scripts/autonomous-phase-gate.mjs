#!/usr/bin/env node
/**
 * Autonomous phase gate runner for ION DEX agents.
 * Runs ONE gate per invocation; exit 0 = pass, exit 1 = fail with compact diagnostics.
 *
 * Usage:
 *   node scripts/autonomous-phase-gate.mjs --gate verify-full
 *   node scripts/autonomous-phase-gate.mjs --gate verify-100
 *   node scripts/autonomous-phase-gate.mjs --gate stress-e2e --spec e2e/copy-trade.spec.ts
 *   node scripts/autonomous-phase-gate.mjs --gate stress-forge --match-contract LiquidityMine
 *   node scripts/autonomous-phase-gate.mjs --gate dev-preflight
 *   node scripts/autonomous-phase-gate.mjs --gate security-1000
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const isWin = process.platform === "win32";

function parseArgs(argv) {
  let gate = "verify-full";
  let spec = "";
  let matchContract = "";
  let rounds = 100;
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--gate" && argv[i + 1]) {
      gate = argv[++i];
      continue;
    }
    if (a.startsWith("--gate=")) {
      gate = a.slice("--gate=".length);
      continue;
    }
    if (a === "--spec" && argv[i + 1]) {
      spec = argv[++i];
      continue;
    }
    if (a === "--match-contract" && argv[i + 1]) {
      matchContract = argv[++i];
      continue;
    }
    if (a === "--rounds" && argv[i + 1]) {
      rounds = Number(argv[++i]);
      continue;
    }
  }
  return { gate, spec, matchContract, rounds };
}

function tailFile(path, lines = 40) {
  if (!existsSync(path)) return `(missing ${path})`;
  const text = readFileSync(path, "utf8");
  const arr = text.split(/\r?\n/);
  return arr.slice(-lines).join("\n");
}

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: opts.cwd ?? root,
    stdio: "inherit",
    env: {
      ...process.env,
      ION_VERIFY_NONINTERACTIVE: "1",
      ION_AGENT_AUTONOMOUS: "1",
      ...opts.env,
    },
    shell: isWin,
  });
  return result.status ?? 1;
}

function printFail(stage, exitCode, hint) {
  console.error("\n=== AUTONOMOUS GATE FAILED ===");
  console.error(`FAIL_STAGE=${stage}`);
  console.error(`EXIT_CODE=${exitCode}`);
  if (hint) console.error(hint);
  const verifyLog = join(
    process.env.TEMP || process.env.TMP || "/tmp",
    "ion-verify-full.txt",
  );
  const summaryGlob = "ion-verify-100";
  console.error("\n--- tail verify-full log ---");
  console.error(tailFile(verifyLog, 50));
  const tempDir = process.env.TEMP || process.env.TMP || "";
  if (tempDir) {
    try {
      const files = readdirSync(tempDir)
        .filter((f) => f.includes(summaryGlob))
        .sort()
        .slice(-1);
      if (files[0]) {
        console.error("\n--- tail verify-100 summary ---");
        console.error(tailFile(join(tempDir, files[0]), 30));
      }
    } catch {
      /* ignore */
    }
  }
  console.error("=== fix root cause, then re-run same gate ===\n");
}

function main() {
  const { gate, spec, matchContract, rounds } = parseArgs(process.argv);
  let code = 0;
  let stage = gate;

  switch (gate) {
    case "dev-preflight": {
      code = run(process.execPath, [join(root, "scripts", "dev-preflight.mjs")], {
        env: { ION_UI_STRICT: process.env.ION_UI_STRICT || "1" },
      });
      break;
    }
    case "verify-full": {
      if (isWin) {
        code = run("cmd.exe", ["/d", "/c", "scripts\\verify-full-save-log.cmd", "--no-pause"]);
      } else {
        code = run("bash", ["scripts/verify-full.sh"]);
      }
      break;
    }
    case "verify-100": {
      if (isWin) {
        code = run("powershell.exe", [
          "-NoProfile",
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          join(root, "scripts", "verify-100.ps1"),
        ]);
      } else {
        console.error("verify-100 gate: run on Windows or implement bash equivalent");
        code = 1;
      }
      break;
    }
    case "stress-e2e": {
      if (!spec) {
        console.error("--spec e2e/foo.spec.ts required for stress-e2e");
        process.exit(2);
      }
      code = run(process.execPath, [
        join(root, "scripts", "stress-playwright-100.mjs"),
        "--spec",
        spec,
        "--rounds",
        String(rounds),
      ]);
      break;
    }
    case "stress-forge": {
      if (!matchContract) {
        console.error("--match-contract Name required for stress-forge");
        process.exit(2);
      }
      code = run(process.execPath, [
        join(root, "scripts", "stress-forge-contract-100.mjs"),
        "--match-contract",
        matchContract,
        "--rounds",
        String(rounds),
      ]);
      break;
    }
    case "security-1000": {
      code = run(process.execPath, [join(root, "scripts", "verify-security-1000.mjs")]);
      break;
    }
    default:
      console.error(`Unknown gate: ${gate}`);
      process.exit(2);
  }

  if (code !== 0) {
    printFail(stage, code, null);
    process.exit(1);
  }

  console.log(`\n=== AUTONOMOUS GATE PASS: ${stage} ===\n`);
  process.exit(0);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
