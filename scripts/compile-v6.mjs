#!/usr/bin/env node
/**
 * Compile V6 FunC contracts using @ton-community/func-js
 */

import { compileFunc } from "@ton-community/func-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTRACTS_DIR = path.resolve(__dirname, "../contracts");
const BUILD_DIR = path.resolve(CONTRACTS_DIR, "build-v6");
const STDLIB_PATH = path.resolve(CONTRACTS_DIR, "imports/stdlib.fc");

const V6_CONTRACTS = [
  "ion_cross_border_payment_v6.fc",
  "ion_mmr_ledger_v6.fc",
  "ion_ecommerce_escrow_v6.fc",
  "ion_multichain_gateway_v6.fc",
];

function collectFCSources(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) continue;
    if (entry.name.endsWith(".fc")) {
      results.push({
        filename: entry.name,
        content: fs.readFileSync(full, "utf8"),
      });
    }
  }
  return results;
}

async function main() {
  console.log("=".repeat(60));
  console.log("V6 FunC Contract Compilation");
  console.log("=".repeat(60));

  if (!fs.existsSync(STDLIB_PATH)) {
    console.error(`ERROR: stdlib.fc not found at ${STDLIB_PATH}`);
    process.exit(1);
  }

  const stdlibContent = fs.readFileSync(STDLIB_PATH, "utf8");
  const contractSources = collectFCSources(CONTRACTS_DIR);
  const allSources = [
    { filename: "imports/stdlib.fc", content: stdlibContent },
    ...contractSources,
  ];

  fs.mkdirSync(BUILD_DIR, { recursive: true });

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const contract of V6_CONTRACTS) {
    const contractPath = path.join(CONTRACTS_DIR, contract);
    if (!fs.existsSync(contractPath)) {
      console.log(`  SKIP ${contract} - file not found`);
      failed++;
      results.push({ contract, status: "SKIP", error: "file not found" });
      continue;
    }

    console.log(`\nCompiling: ${contract}`);
    try {
      const result = await compileFunc({
        sources: allSources,
        targets: ["imports/stdlib.fc", contract],
        optLevel: 2,
      });

      if (result.status === "error") {
        console.log(`  FAIL: ${result.message ?? "unknown error"}`);
        failed++;
        results.push({ contract, status: "FAIL", error: result.message });
      } else {
        const outName = contract.replace(/\.fc$/, ".fif");
        if (result.fift) {
          fs.writeFileSync(path.join(BUILD_DIR, outName), result.fift);
          console.log(`  PASS -> ${outName}`);
        }
        if (result.codeBoc) {
          const bocName = contract.replace(/\.fc$/, ".boc");
          fs.writeFileSync(path.join(BUILD_DIR, bocName), Buffer.from(result.codeBoc, "base64"));
          console.log(`  PASS -> ${bocName}`);
        }
        passed++;
        results.push({ contract, status: "PASS" });
      }
    } catch (err) {
      console.log(`  EXCEPTION: ${err.message}`);
      failed++;
      results.push({ contract, status: "EXCEPTION", error: err.message });
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("COMPILATION RESULTS");
  console.log("=".repeat(60));
  console.log(`Passed: ${passed}/${V6_CONTRACTS.length}`);
  console.log(`Failed: ${failed}`);
  console.log(`Build dir: ${BUILD_DIR}`);

  for (const r of results) {
    const icon = r.status === "PASS" ? "✅" : "❌";
    console.log(`  ${icon} ${r.contract} - ${r.status}${r.error ? " (" + r.error.substring(0, 80) + ")" : ""}`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error("Compilation crashed:", e);
  process.exit(1);
});
