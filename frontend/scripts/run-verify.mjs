import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const frontendDir = fileURLToPath(new URL("..", import.meta.url));
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const useShell = process.platform === "win32";
const env = {
  ...process.env,
  VITE_ION_API_BASE_URL: process.env.VITE_ION_API_BASE_URL ?? "http://127.0.0.1:8787",
};

function runStep(label, command, args) {
  const result = spawnSync(command, args, {
    cwd: frontendDir,
    env,
    stdio: "inherit",
    shell: useShell,
  });
  if (result.status !== 0) {
    console.error(`ERROR: ${label} failed with exit code ${result.status ?? 1}`);
    process.exit(result.status ?? 1);
  }
}

runStep("frontend build", npmCommand, ["run", "build"]);
runStep("Playwright E2E", process.execPath, ["scripts/verify-e2e.mjs"]);
