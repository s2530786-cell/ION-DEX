import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const frontendDir = fileURLToPath(new URL("..", import.meta.url));
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const useShell = process.platform === "win32";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function freePorts() {
  spawnSync(process.execPath, [fileURLToPath(new URL("../../scripts/free-ion-ports.mjs", import.meta.url))], {
    stdio: "ignore",
  });
}

async function buildWithRetry() {
  freePorts();
  await sleep(600);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const build = spawnSync(npmCommand, ["run", "build"], {
      cwd: frontendDir,
      stdio: "inherit",
      shell: useShell,
      env: {
        ...process.env,
        VITE_ION_API_RELATIVE: "1",
        VITE_E2E_STABLE: "1",
      },
    });
    if (build.status === 0) {
      return;
    }
    if (attempt === 0) {
      console.warn("Frontend build failed; freeing ports and retrying once...");
      freePorts();
      await sleep(2000);
      continue;
    }
    process.exit(build.status ?? 1);
  }
}

await buildWithRetry();

const e2eScript = fileURLToPath(new URL("./verify-e2e.mjs", import.meta.url));
for (let attempt = 0; attempt < 2; attempt += 1) {
  const e2e = spawnSync(process.execPath, [e2eScript], {
    cwd: frontendDir,
    stdio: "inherit",
    env: { ...process.env },
  });
  if (e2e.status === 0) {
    process.exit(0);
  }
  if (attempt === 0) {
    console.warn("E2E verify failed; freeing ports and retrying once...");
    freePorts();
    await sleep(3000);
    continue;
  }
  process.exit(e2e.status ?? 1);
}
