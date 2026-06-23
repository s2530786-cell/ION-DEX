#!/usr/bin/env node
/**
 * P0-1c — BSC ↔ ION bridge E2E gate (TS orchestration + optional Foundry).
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const forgePath = process.env.ION_FORGE_BIN ?? "forge";
const forgeLocal = join("D:", "openclaw-tools", "foundry", "bin", "forge.exe");
const forgeExe = existsSync(forgeLocal) ? forgeLocal : forgePath;

console.log("=== P0-1c bridge E2E verification ===");

const build = spawnSync("npm", ["run", "build"], {
  cwd: join(root, "backend"),
  stdio: "inherit",
  shell: true,
});
if (build.status !== 0) {
  throw new Error("backend build failed before bridge-e2e tests");
}

const tsTest = spawnSync(
  process.execPath,
  ["--test", "dist/tests/bridge-e2e.test.js"],
  { cwd: join(root, "backend"), stdio: "inherit" },
);
if (tsTest.status !== 0) {
  throw new Error("bridge-e2e TS tests failed");
}
console.log("OK - backend bridge orchestration (100 rounds + guards)");

const forge = spawnSync(
  forgeExe,
  ["test", "--match-contract", "BridgeIonE2E"],
  { encoding: "utf8", cwd: join(root, "contracts") },
);
if (forge.status === 0) {
  if (forge.stdout) console.log(forge.stdout);
  console.log("OK - Foundry BridgeIonE2E (BSC lock → ION credit + ION → BSC release)");
} else if (forge.error?.code === "ENOENT") {
  console.log("SKIP - forge not on PATH; TS bridge E2E is the gate for this environment.");
} else {
  console.warn(forge.stderr || forge.stdout);
  throw new Error("forge BridgeIonE2E tests failed");
}

console.log("OK - P0-1c bridge E2E verification completed.");
