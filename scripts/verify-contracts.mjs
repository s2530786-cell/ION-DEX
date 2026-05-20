#!/usr/bin/env node
/**
 * Contract layer smoke: file presence + shared minimum-output math tests.
 * Full Foundry tests: cd contracts && forge test (when forge is installed).
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const required = [
  "contracts/bsc/IonSwapRouter.sol",
  "contracts/test/MinimumOutput.t.sol",
  "contracts/foundry.toml",
  "backend/src/lib/minimum-output.ts",
  "docs/24-swap-router-minimum-output.md",
];

console.log("=== ION DEX contract verification ===");
for (const file of required) {
  const path = join(root, file);
  if (!existsSync(path)) {
    throw new Error(`Missing contract artifact: ${file}`);
  }
  console.log(`OK ${file}`);
}

const testRun = spawnSync(process.execPath, ["--test", "dist/tests/minimum-output.test.js"], {
  cwd: join(root, "backend"),
  stdio: "inherit",
});

if (testRun.status !== 0) {
  throw new Error("minimum-output unit tests failed (run backend npm run build && npm test first).");
}

const forge = spawnSync("forge", ["test", "-C", join(root, "contracts")], {
  stdio: "pipe",
  encoding: "utf8",
});
if (forge.status === 0) {
  console.log(forge.stdout);
  console.log("OK - forge test passed.");
} else if (forge.error?.code === "ENOENT") {
  console.log("SKIP - forge not installed; Solidity sources and TS math tests are the gate for this environment.");
} else {
  console.warn(forge.stderr || forge.stdout);
  throw new Error("forge test failed");
}

console.log("OK - contract verification completed.");
