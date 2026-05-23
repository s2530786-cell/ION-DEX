#!/usr/bin/env node
/**
 * Fift deploy dry-run: validate deploy.fif + toolchain, run script without chain keys.
 * Never sends transactions. Set ION_DEPLOY_DRY_RUN=1 (default).
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const ionRoot = join(root, "contracts", "ion");
const deployScript = join(ionRoot, "deploy", "deploy.fif");
const deployChecklist = join(ionRoot, "deploy", "deploy-checklist.fif");

const requiredPlaceholders = [
  "<owner_address>",
  "<lp_recipient>",
  "<treasury_recipient>",
  "<insurance_recipient>",
  "<token0_addr>",
  "<token1_addr>",
  "<fee_distributor_addr>",
  "<router_addr>",
];

const requiredIncludes = ["Fee Split", "Deployment Script"];

const envPlaceholders = [
  "ION_DEPLOY_OWNER_ADDRESS",
  "ION_DEPLOY_LP_RECIPIENT",
  "ION_DEPLOY_TREASURY_RECIPIENT",
  "ION_DEPLOY_INSURANCE_RECIPIENT",
  "ION_DEPLOY_NETWORK",
];

console.log("=== ION DEX fift deploy dry-run ===");

if (process.env.ION_DEPLOY_DRY_RUN === "0") {
  throw new Error(
    "Refusing to run deploy script with ION_DEPLOY_DRY_RUN=0 in CI/automation. Use workflow_dispatch deploy job.",
  );
}

if (!existsSync(deployScript)) {
  throw new Error(`Missing deploy script: ${deployScript}`);
}
console.log(`OK script ${deployScript}`);

const source = readFileSync(deployScript, "utf8");
for (const token of requiredPlaceholders) {
  if (!source.includes(token)) {
    throw new Error(`deploy.fif missing placeholder ${token}`);
  }
}
console.log(`OK ${requiredPlaceholders.length} address placeholders documented`);

for (const marker of requiredIncludes) {
  if (!source.includes(marker)) {
    throw new Error(`deploy.fif missing marker ${marker}`);
  }
}
console.log("OK deploy.fif checklist markers");

for (const key of envPlaceholders) {
  const value = process.env[key];
  if (value && value.trim().length > 0) {
    console.log(`OK env ${key}=${value.slice(0, 12)}...`);
  } else {
    console.log(`INFO env ${key} unset (dry-run uses script defaults only)`);
  }
}

const network = process.env.ION_DEPLOY_NETWORK ?? "testnet";
if (network !== "testnet" && network !== "mainnet") {
  throw new Error(`ION_DEPLOY_NETWORK must be testnet or mainnet, got: ${network}`);
}
console.log(`OK network label=${network} (no RPC calls in dry-run)`);

const fiftCandidates = [
  process.env.ION_FIFT_EXE,
  process.env.ION_TOOLCHAIN_ROOT ? join(process.env.ION_TOOLCHAIN_ROOT, "bin", "fift") : null,
  "fift",
].filter(Boolean);

function pickFift() {
  for (const candidate of fiftCandidates) {
    if (candidate === "fift" || existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

const fiftExe = pickFift();
if (!fiftExe) {
  console.log("SKIP - fift binary not found (run scripts/setup-ion-toolchain.sh on Linux CI)");
  process.exit(0);
}

const fiftLib =
  process.env.FIFTPATH ??
  (process.env.ION_TOOLCHAIN_ROOT
    ? join(process.env.ION_TOOLCHAIN_ROOT, "fift-lib")
    : undefined);

const fiftTarget = existsSync(deployChecklist) ? deployChecklist : deployScript;

const run = spawnSync(fiftExe, ["-s", fiftTarget], {
  cwd: ionRoot,
  encoding: "utf8",
  env: {
    ...process.env,
    FIFTPATH: fiftLib ?? process.env.FIFTPATH ?? "",
    ION_DEPLOY_DRY_RUN: "1",
    ION_DEPLOY_NETWORK: network,
  },
});

if (run.stdout) {
  console.log(run.stdout.trim());
}
if (run.status !== 0) {
  if (run.stderr) {
    console.error(run.stderr.trim());
  }
  throw new Error("fift deploy dry-run failed");
}

console.log("OK - fift deploy script executed (dry-run, no chain transactions)");
console.log("RESULT=GREEN");
