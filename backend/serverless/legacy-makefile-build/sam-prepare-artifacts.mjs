import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(scriptDir, "..");
const artifactsDir = process.env.ARTIFACTS_DIR;

if (!artifactsDir) {
  console.error("ARTIFACTS_DIR is not set (expected when invoked by SAM build)");
  process.exit(1);
}

const distSource = join(backendRoot, "dist");
if (!existsSync(distSource)) {
  console.error("Run `npm run build` in backend before `sam build`, or let this script build first.");
  process.exit(1);
}

rmSync(artifactsDir, { recursive: true, force: true });
mkdirSync(artifactsDir, { recursive: true });

for (const name of ["dist", "package.json", "package-lock.json"]) {
  cpSync(join(backendRoot, name), join(artifactsDir, name), { recursive: true });
}

console.log(`Prepared Lambda artifact in ${artifactsDir}`);
