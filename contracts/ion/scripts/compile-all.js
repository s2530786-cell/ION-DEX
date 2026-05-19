/**
 * Compiles Ion DEX FunC entry points with @ton-community/func-js (func v0.4.x).
 * Run from repo: npm --prefix contracts/ion run compile
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const cwd = path.join(__dirname, "..");
const buildDir = path.join(cwd, "build");

const ENTRIES = [
  "pool.fc",
  "router.fc",
  "vault.fc",
  "deployer.fc",
  "lp_account.fc",
  "lp_wallet.fc",
];

function main() {
  fs.mkdirSync(buildDir, { recursive: true });

  for (const entry of ENTRIES) {
    const base = entry.replace(/\.fc$/u, "");
    const artifactAbs = path.join(cwd, "build", `${base}.json`);
    const cmd = ["npx", "func-js", entry, "--artifact", artifactAbs]
      .map((s) =>
        /\s|[\\"]/u.test(s) ? `"${String(s).replace(/\\/gu, "/")}"` : s,
      )
      .join(" ");

    const r = spawnSync(cmd, {
      cwd,
      stdio: "inherit",
      shell: true,
      windowsHide: true,
      env: process.env,
    });

    if (r.status !== 0) {
      process.exit(typeof r.status === "number" ? r.status : 1);
    }
  }

  console.log(`ION FunC: ${ENTRIES.length} entry modules compiled OK -> build/*.json`);
}

main();
