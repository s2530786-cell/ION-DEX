#!/usr/bin/env node
/**
 * Submit a base64 BoC to ION testnet sendBoc API.
 * Requires explicit --confirm "YES BROADCAST to testnet" (or ION_DEPLOY_CONFIRM).
 * Never runs in CI unless ION_DEPLOY_FORCE_BROADCAST=1.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveDeployRpc, resolveDeployNetwork } from "./lib/ion-deploy-env.mjs";

const EXPECTED_CONFIRM = "YES BROADCAST to testnet";

function parseArgs(argv) {
  const out = { boc: "", confirm: process.env.ION_DEPLOY_CONFIRM?.trim() ?? "" };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--boc" && argv[i + 1]) {
      out.boc = argv[++i];
    } else if (arg === "--confirm" && argv[i + 1]) {
      out.confirm = argv[++i];
    } else if (arg === "--help" || arg === "-h") {
      out.help = true;
    }
  }
  return out;
}

function toBase64(buffer) {
  return buffer.toString("base64");
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`Usage: node scripts/submit-ion-testnet-boc.mjs --boc <path.boc> --confirm "${EXPECTED_CONFIRM}"`);
    process.exit(0);
  }

  if (process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true") {
    if (process.env.ION_DEPLOY_FORCE_BROADCAST !== "1") {
      throw new Error("Refusing sendBoc in CI (set ION_DEPLOY_FORCE_BROADCAST=1 to override)");
    }
  }

  const network = resolveDeployNetwork();
  if (network !== "testnet") {
    throw new Error(`This script is for testnet only; ION_DEPLOY_NETWORK=${network}`);
  }

  if (args.confirm !== EXPECTED_CONFIRM) {
    throw new Error(`Missing or wrong confirm. Type exactly: ${EXPECTED_CONFIRM}`);
  }

  if (!args.boc) {
    throw new Error("Missing --boc path");
  }

  const bocPath = resolve(process.cwd(), args.boc);
  const raw = readFileSync(bocPath);
  const boc = toBase64(raw);

  const rpc = resolveDeployRpc(network);
  const sendUrl = rpc.replace(/jsonRPC\/?$/i, "sendBoc");

  console.log(`Submitting BoC (${raw.length} bytes) to ${sendUrl}`);

  const response = await fetch(sendUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ boc }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`sendBoc failed HTTP ${response.status}: ${text.slice(0, 500)}`);
  }

  console.log("OK - sendBoc response:");
  console.log(text.slice(0, 2000));
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
