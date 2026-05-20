/** Force test-mock data mode before any backend modules load. */
process.env.NODE_ENV = "test";
process.env.ION_DATA_MODE = "test-mock";
delete process.env.CMC_API_KEY;

import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const testDir = join(root, "dist/tests");
const testFiles = readdirSync(testDir)
  .filter((name) => name.endsWith(".test.js"))
  .map((name) => join(testDir, name));

if (testFiles.length === 0) {
  console.error(`No compiled tests found in ${testDir}. Run npm run build first.`);
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ["--test", "--test-concurrency=1", ...testFiles],
  { cwd: root, stdio: "inherit", env: process.env },
);

process.exit(result.status ?? 1);
