#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function tryRun(cmd) {
  try {
    return execSync(cmd, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

const errors = [];
const warnings = [];
const nodeV = tryRun("node -v");
const npmV = tryRun("npm -v");
if (!nodeV) errors.push("node not in PATH");
if (!npmV) errors.push("npm not in PATH");

const home = process.env.HOME || process.env.USERPROFILE || "";
const forgeBin = join(home, ".foundry", "bin", "forge");
let forgeV = tryRun("forge --version");
if (!forgeV && existsSync(forgeBin)) {
  forgeV = tryRun('"' + forgeBin + '" --version');
}
if (!forgeV) {
  warnings.push("forge not found - run foundryup or enable .cursor/environment.json");
}

for (const rel of [
  "SESSION_STATE.md",
  ".memory-bank/architecture-audit.md",
  ".cursor/automations/ion-dex-autonomous-build.yml",
  "scripts/compile-func.mjs",
  "backend/package.json",
  "frontend/package.json",
]) {
  if (!existsSync(join(root, rel))) {
    errors.push("missing: " + rel);
  }
}

console.log("=== ION DEX Automation Preflight ===");
console.log("node:", nodeV ?? "MISSING");
console.log("npm:", npmV ?? "MISSING");
console.log("forge:", forgeV ?? "MISSING");
console.log("cwd:", root);
if (warnings.length) warnings.forEach((w) => console.log("WARN:", w));
if (errors.length) {
  errors.forEach((e) => console.error("ERROR:", e));
  process.exit(1);
}
console.log("Preflight OK");
