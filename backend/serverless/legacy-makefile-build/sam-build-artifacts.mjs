import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(scriptDir, "..");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: backendRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const artifactsDir = process.env.ARTIFACTS_DIR;
if (!artifactsDir) {
  console.error("ARTIFACTS_DIR is not set (expected when invoked by SAM build)");
  process.exit(1);
}

run("npm", ["ci"]);
run("npm", ["run", "build"]);
run("node", ["scripts/sam-prepare-artifacts.mjs"]);
run("npm", ["ci", "--omit=dev"], { cwd: artifactsDir });
