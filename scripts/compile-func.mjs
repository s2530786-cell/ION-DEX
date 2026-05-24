#!/usr/bin/env node
/**
 * Compile all contracts/ion entry .fc files.
 * Prefers native `func` + stdlib (same as verify-func-ion.mjs); falls back to @ton-community/func-js.
 */

import { spawnSync } from "node:child_process";
import { compileFunc } from "@ton-community/func-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ION_DIR = path.resolve(__dirname, "../contracts/ion");
const BUILD_DIR = path.resolve(ION_DIR, "build-func");

const STDLIB_CANDIDATES = [
  process.env.ION_STDLIB_FC,
  path.join(ION_DIR, "imports", "stdlib.fc"),
  "D:/openclaw-data/workspace/ion-official/ion/crypto/smartcont/stdlib.fc",
].filter(Boolean);

const FUNC_CANDIDATES = [
  process.env.ION_FUNC_EXE,
  "D:/openclaw-data/workspace/func.exe",
  "func",
].filter(Boolean);

const ENTRY_CONTRACTS = [
  "pool.fc",
  "router.fc",
  "FeeDistributor.fc",
  "lp_account.fc",
  "lp_wallet.fc",
  "vault.fc",
  "staking-pool.fc",
  "sandwich.fc",
  "BridgeInbox.fc",
  "deployer.fc",
  "dns-auction.fc",
  "dns-registrar.fc",
  "dns-resolver.fc",
];

function pickExisting(paths) {
  for (const candidate of paths) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function collectFCRelative(dir, base) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFCRelative(full, base));
    } else if (entry.name.endsWith(".fc")) {
      const rel = path.relative(base, full).replace(/\\/g, "/");
      results.push({
        filename: rel,
        content: fs.readFileSync(full, "utf8"),
      });
    }
  }
  return results;
}

function compileNative(funcExe, stdlibFc) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
  let passed = 0;
  let failed = 0;

  console.log(`Using native func: ${funcExe}`);
  console.log(`stdlib: ${stdlibFc}\n`);

  for (const contract of ENTRY_CONTRACTS) {
    const contractPath = path.join(ION_DIR, contract);
    if (!fs.existsSync(contractPath)) {
      console.error(`  MISSING ${contract}`);
      failed++;
      continue;
    }

    const outFif = path.join(BUILD_DIR, contract.replace(/\.fc$/, ".fif"));
    process.stdout.write(`=== ${contract} === `);

    const run = spawnSync(
      funcExe,
      ["-o", outFif, "-SPA", stdlibFc, "common/gas.fc", "common/common.fc", contract],
      { cwd: ION_DIR, encoding: "utf8" },
    );

    if (run.status !== 0) {
      console.log("FAIL");
      if (run.stderr) console.error(run.stderr.trim());
      if (run.stdout) console.error(run.stdout.trim());
      failed++;
    } else {
      console.log(`PASS -> ${path.basename(outFif)}`);
      passed++;
    }
  }

  return { passed, failed };
}

async function compileFuncJs(stdlibFc) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
  const stdlibContent = fs.readFileSync(stdlibFc, "utf8");
  const projectSources = collectFCRelative(ION_DIR, ION_DIR);
  const allSources = [
    { filename: "stdlib.fc", content: stdlibContent },
    ...projectSources,
  ];

  let passed = 0;
  let failed = 0;

  console.log(`Using @ton-community/func-js with stdlib: ${stdlibFc}\n`);

  for (const contract of ENTRY_CONTRACTS) {
    console.log(`=== ${contract} ===`);
    try {
      const result = await compileFunc({
        sources: allSources,
        targets: ["stdlib.fc", "common/gas.fc", "common/common.fc", contract],
        optLevel: 2,
      });

      if (result.status === "error") {
        console.error(`  FAIL: ${result.message ?? ""}`);
        failed++;
        continue;
      }

      if (result.fift) {
        const outName = contract.replace(/\.fc$/, ".fif");
        fs.writeFileSync(path.join(BUILD_DIR, outName), result.fift);
        console.log(`  PASS -> ${outName}`);
      } else {
        console.log("  PASS");
      }
      passed++;
    } catch (err) {
      console.error(`  EXCEPTION: ${err.message}`);
      failed++;
    }
  }

  return { passed, failed };
}

const stdlibFc = pickExisting(STDLIB_CANDIDATES);
if (!stdlibFc) {
  console.error("stdlib.fc not found");
  process.exit(1);
}

const funcExe = pickExisting(FUNC_CANDIDATES);
const { passed, failed } = funcExe
  ? compileNative(funcExe, stdlibFc)
  : await compileFuncJs(stdlibFc);

console.log(`\n========== RESULTS ==========`);
console.log(`Passed: ${passed}/${ENTRY_CONTRACTS.length}`);
console.log(`Failed: ${failed}`);
console.log(`Build dir: ${BUILD_DIR}`);
process.exit(failed > 0 ? 1 : 0);
