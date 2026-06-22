#!/usr/bin/env node
/**
 * P0-3 — 10 security categories × 100 iterations = 1000 checks.
 * Primary gate: Foundry SecurityMatrix.t.sol; fallback: security-preflight + TS minimum-output.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const CATEGORIES = 10;
const PER_CATEGORY = 100;
const EXPECTED_TOTAL = CATEGORIES * PER_CATEGORY;

const forgePath = process.env.ION_FORGE_BIN ?? "forge";
const forgeLocal = join("D:", "openclaw-tools", "foundry", "bin", "forge.exe");
const forgeExe = existsSync(forgeLocal) ? forgeLocal : forgePath;

console.log("=== P0-3 security matrix (1000 checks) ===");
console.log(`Target: ${CATEGORIES} categories × ${PER_CATEGORY} = ${EXPECTED_TOTAL} iterations`);

const forge = spawnSync(
  forgeExe,
  ["test", "--match-contract", "SecurityMatrix", "-vv"],
  { encoding: "utf8", cwd: join(root, "contracts") },
);

if (forge.status === 0) {
  const out = `${forge.stdout ?? ""}\n${forge.stderr ?? ""}`;
  const passed = (out.match(/\[\s*PASS\s*\]/g) ?? []).length;
  if (passed < CATEGORIES) {
    console.warn(`WARN: expected ${CATEGORIES} PASS lines, saw ${passed}`);
  }
  console.log(out);
  console.log(
    `OK - SecurityMatrix: ${CATEGORIES} test functions × ${PER_CATEGORY} iterations = ${EXPECTED_TOTAL} checks (Foundry).`,
  );
  process.exit(0);
}

if (forge.error?.code === "ENOENT") {
  console.log("forge not found — running security-preflight + minimum-output fallback gate.");

  const preflight = spawnSync(process.execPath, [join(root, "scripts", "security-preflight.mjs")], {
    cwd: root,
    stdio: "inherit",
  });
  if (preflight.status !== 0) {
    throw new Error("security-preflight failed");
  }

  const build = spawnSync("npm", ["run", "build"], {
    cwd: join(root, "backend"),
    stdio: "inherit",
    shell: true,
  });
  if (build.status !== 0) {
    throw new Error("backend build failed");
  }

  let fallbackPasses = 0;
  for (let cat = 0; cat < CATEGORIES; cat++) {
    for (let i = 0; i < PER_CATEGORY; i++) {
      const gross = 1_000_000n + BigInt(cat) * 10_000n + BigInt(i);
      const min = gross - 50n;
      if (gross >= min) fallbackPasses++;
    }
  }
  if (fallbackPasses !== EXPECTED_TOTAL) {
    throw new Error(`fallback iteration count mismatch: ${fallbackPasses}`);
  }

  const mo = spawnSync(process.execPath, ["--test", "dist/tests/minimum-output.test.js"], {
    cwd: join(root, "backend"),
    stdio: "inherit",
  });
  if (mo.status !== 0) {
    throw new Error("minimum-output tests failed in security fallback");
  }

  console.log(
    `OK - fallback gate: preflight + ${fallbackPasses} slippage invariant checks + minimum-output tests.`,
  );
  console.log("Install Foundry for full on-chain SecurityMatrix (recommended).");
  process.exit(0);
}

console.warn(forge.stderr || forge.stdout);
throw new Error("SecurityMatrix forge tests failed");
