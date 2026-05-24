#!/usr/bin/env node
/**
 * FunC P0 compile gate for contracts/ion (13 contracts).
 * Env:
 *   ION_FUNC_EXE — path to func binary
 *   ION_STDLIB_FC — path to stdlib.fc
 *   ION_FUNC_COMPILE_PASSES — repetitions per contract (default: 100 local, 5 when CI=1)
 *   ION_FUNC_P0_STRICT=1 — fail if func/stdlib missing (else SKIP)
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ionRoot = join(root, "contracts", "ion");
const buildDir = join(ionRoot, "build");

const contracts = [
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

const defaultPasses = process.env.CI === "true" || process.env.CI === "1" ? 5 : 100;
const passes = Math.max(
  1,
  Number.parseInt(process.env.ION_FUNC_COMPILE_PASSES ?? String(defaultPasses), 10) || defaultPasses,
);

const toolchainRoot = process.env.ION_TOOLCHAIN_ROOT;

const funcCandidates = [
  process.env.ION_FUNC_EXE,
  toolchainRoot ? join(toolchainRoot, "bin", "func") : null,
  process.platform === "win32" ? "D:\\openclaw-data\\workspace\\func.exe" : null,
  "func",
].filter(Boolean);

const stdlibCandidates = [
  process.env.ION_STDLIB_FC,
  toolchainRoot ? join(toolchainRoot, "smartcont", "stdlib.fc") : null,
  process.platform === "win32"
    ? "D:/openclaw-data/workspace/ion-official/ion/crypto/smartcont/stdlib.fc"
    : null,
  join(root, "contracts", "ion", "imports", "stdlib.fc"),
].filter(Boolean);

function pickFirstExisting(paths) {
  for (const candidate of paths) {
    if (candidate && existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

const funcExe = pickFirstExisting(funcCandidates);
const stdlibFc = pickFirstExisting(stdlibCandidates);
const strict = process.env.ION_FUNC_P0_STRICT === "1";

console.log("=== ION FunC compile verification ===");
console.log(`Passes per contract: ${passes}`);

if (!funcExe || !stdlibFc) {
  const message = `func/stdlib unavailable (func=${funcExe ?? "missing"}, stdlib=${stdlibFc ?? "missing"})`;
  if (strict) {
    throw new Error(message);
  }
  console.log(`SKIP - ${message}`);
  process.exit(0);
}

console.log(`OK toolchain func=${funcExe}`);
console.log(`OK stdlib=${stdlibFc}`);

if (!existsSync(buildDir)) {
  mkdirSync(buildDir, { recursive: true });
}

let failed = false;

for (const contract of contracts) {
  const contractPath = join(ionRoot, contract);
  if (!existsSync(contractPath)) {
    console.error(`FAIL missing ${contract}`);
    failed = true;
    continue;
  }

  const nullOut = join(buildDir, `_verify_${contract.replace(/\.fc$/, "")}.fif`);
  process.stdout.write(`Compiling ${contract} x${passes} ... `);

  for (let i = 1; i <= passes; i += 1) {
    const run = spawnSync(
      funcExe,
      ["-o", nullOut, "-SPA", stdlibFc, "common/gas.fc", "common/common.fc", contract],
      { cwd: ionRoot, encoding: "utf8" },
    );
    if (run.status !== 0) {
      failed = true;
      console.log(`FAIL at ${i}/${passes}`);
      if (run.stderr) {
        console.error(run.stderr.trim());
      }
      if (run.stdout) {
        console.error(run.stdout.trim());
      }
      break;
    }
  }

  if (!failed) {
    console.log("PASS");
  } else {
    break;
  }
}

if (failed) {
  throw new Error("FunC compile verification failed");
}

console.log(`OK - all ${contracts.length} contracts compiled ${passes}x each`);
console.log("RESULT=GREEN");
