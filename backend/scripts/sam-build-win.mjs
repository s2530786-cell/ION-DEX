import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(scriptDir, "..");

function run(command, args, options = {}) {
  const useShell = process.platform === "win32";
  const result = spawnSync(command, args, {
    cwd: backendRoot,
    stdio: "inherit",
    shell: useShell,
    env: process.env,
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function findExecutable(name, extraDirs = []) {
  const fileName = process.platform === "win32" ? `${name}.exe` : name;
  const pathEntries = [...extraDirs, ...(process.env.PATH ?? "").split(";")].filter(Boolean);
  for (const entry of pathEntries) {
    const candidate = join(entry, fileName);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function findSamCli() {
  const pythonRoot = join(process.env.LOCALAPPDATA ?? "", "Programs", "Python");
  const extraDirs = [];
  if (existsSync(pythonRoot)) {
    for (const entry of readdirSync(pythonRoot, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        extraDirs.push(join(pythonRoot, entry.name, "Scripts"));
      }
    }
  }
  return findExecutable("sam", extraDirs);
}

const template = "serverless/template.yaml";
const extraArgs = process.argv.slice(2);

run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"]);

const samExe = findSamCli();
if (!samExe) {
  console.error("sam CLI not found. Install: pip install aws-sam-cli");
  process.exit(1);
}

console.log("Using SAM nodejs22.x builder (no GNU make required on Windows).");
run(samExe, ["build", "-t", template, ...extraArgs]);
