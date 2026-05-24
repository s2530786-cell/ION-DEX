/** Force test-mock data mode before any backend modules load. */
process.env.NODE_ENV = "test";
process.env.ION_DATA_MODE = "test-mock";
delete process.env.CMC_API_KEY;

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const result = spawnSync(
  process.execPath,
  ["--test", "--test-concurrency=1", join(root, "dist/tests/*.test.js")],
  { cwd: root, stdio: "inherit", env: process.env, shell: true },
);

process.exit(result.status ?? 1);
