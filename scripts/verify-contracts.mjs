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
  "contracts/foundry.toml",
  "contracts/bsc/IonSwapRouter.sol",
  "contracts/bsc/BSCVault.sol",
  "contracts/bsc/MockERC20.sol",
  "contracts/bsc/FeeReceiver.sol",
  "contracts/bsc/BridgeRelay.sol",
  "contracts/bsc/IonWrapper.sol",
  "contracts/bsc/Burn.sol",
  "contracts/bsc/VaultLock.sol",
  "contracts/test/MinimumOutput.t.sol",
  "contracts/test/BSCContracts.t.sol",
  "contracts/ion/common/common.fc",
  "contracts/ion/common/gas.fc",
  "contracts/ion/vault.fc",
  "contracts/ion/lp_account.fc",
  "contracts/ion/lp_wallet.fc",
  "contracts/ion/pool.fc",
  "contracts/ion/router.fc",
  "contracts/ion/deployer.fc",
  "contracts/ion/sandwich.fc",
  "contracts/ion/FeeDistributor.fc",
  "contracts/ion/BridgeInbox.fc",
  "contracts/ion/dns-resolver.fc",
  "contracts/ion/dns-registrar.fc",
  "contracts/ion/dns-auction.fc",
  "contracts/ion/staking-pool.fc",
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
  if (forge.stdout) console.log(forge.stdout);
  console.log("OK - forge test passed.");
} else if (forge.error?.code === "ENOENT") {
  console.log("SKIP - forge not installed; Solidity sources and TS math tests are the gate for this environment.");
} else {
  console.warn(forge.stderr || forge.stdout);
  throw new Error("forge test failed");
}

if (process.env.ION_SKIP_FUNC === "true") {
  console.log("SKIP FunC ion compile (ION_SKIP_FUNC=true)");
} else {
  const funcIon = spawnSync(process.execPath, [join(root, "scripts", "verify-func-ion.mjs")], {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      ION_FUNC_COMPILE_PASSES: process.env.ION_FUNC_COMPILE_PASSES ?? (process.env.CI ? "5" : "100"),
    },
  });

  if (funcIon.status !== 0) {
    throw new Error("FunC ion compile verification failed");
  }
}

const phase2 = spawnSync(process.execPath, [join(root, "scripts", "ion-deploy-phase2.mjs")], {
  cwd: root,
  stdio: "inherit",
});

if (process.env.ION_SKIP_FUNC === "true") {
  console.log("SKIP deploy phase-2 (ION_SKIP_FUNC=true)");
} else if (phase2.status !== 0) {
  throw new Error("deploy phase-2 readiness check failed");
}

const fiftDryRun = spawnSync(process.execPath, [join(root, "scripts", "deploy-fift-dry-run.mjs")], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    ION_DEPLOY_DRY_RUN: process.env.ION_DEPLOY_DRY_RUN ?? "1",
    ION_DEPLOY_NETWORK: process.env.ION_DEPLOY_NETWORK ?? "testnet",
  },
});

if (process.env.ION_SKIP_FUNC === "true") {
  console.log("SKIP fift deploy dry-run (ION_SKIP_FUNC=true)");
} else if (fiftDryRun.status !== 0) {
  throw new Error("fift deploy dry-run failed");
}

console.log("OK - contract verification completed.");
