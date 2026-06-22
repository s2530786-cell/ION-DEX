import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const docsSiteDir = path.join(root, "docs-site");

await ensureDocsSiteDeps();
await run("node", ["build.mjs"], { cwd: docsSiteDir });

async function ensureDocsSiteDeps() {
  try {
    await access(path.join(docsSiteDir, "node_modules", "marked"));
  } catch {
    await run("npm", ["install"], { cwd: docsSiteDir });
  }
}

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const resolvedCommand =
      process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
    const child = spawn(resolvedCommand, args, {
      cwd: options.cwd,
      stdio: "inherit",
      shell: false,
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
    child.on("error", reject);
  });
}
