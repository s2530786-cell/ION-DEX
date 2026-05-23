#!/usr/bin/env node
/**
 * Phase 2 readiness: validate deploy docs + compile artifacts exist (no on-chain txs).
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredDocs = [
  "contracts/ion/deploy/compile-and-deploy.md",
  "contracts/ion/deploy/deploy.fif",
  "contracts/README.md",
];

const requiredBuildOutputs = [
  "contracts/ion/build/pool.fif",
  "contracts/ion/build/router.fif",
  "contracts/ion/build/FeeDistributor.fif",
];

const initSteps = [
  "Deploy FeeDistributor and set lp/treasury/insurance recipients (bps)",
  "Deploy Router; set protocol_fee_bps and fee_distributor",
  "Deploy Pool pairs; wire router, fee_distributor, sandwich guard",
  "Register pools in router (op::deploy_pool)",
  "Deploy Vault; bind token + router",
  "Deploy staking-pool, BridgeInbox, DNS suite as needed",
];

console.log("=== ION DEX deploy phase-2 readiness ===");

for (const rel of requiredDocs) {
  const path = join(root, rel);
  if (!existsSync(path)) {
    throw new Error(`Missing deploy doc: ${rel}`);
  }
  console.log(`OK doc ${rel}`);
}

let buildOk = 0;
for (const rel of requiredBuildOutputs) {
  const path = join(root, rel);
  if (existsSync(path)) {
    buildOk += 1;
    console.log(`OK artifact ${rel}`);
  } else {
    console.log(`WARN artifact missing (run func compile): ${rel}`);
  }
}

const deployMd = readFileSync(join(root, "contracts/ion/deploy/compile-and-deploy.md"), "utf8");
if (!deployMd.includes("Initialize Protocol")) {
  throw new Error("compile-and-deploy.md missing Initialize Protocol section");
}

console.log("");
console.log("On-chain initialization checklist (manual / scripted with fift):");
for (const [index, step] of initSteps.entries()) {
  console.log(`  ${index + 1}. ${step}`);
}

if (buildOk === 0) {
  console.log("");
  console.log("WARN - no .fif artifacts found; run scripts/verify-func-ion.mjs or func-compile-100.ps1 first");
}

console.log("");
console.log("OK - phase-2 readiness documentation validated (no chain transactions sent)");
