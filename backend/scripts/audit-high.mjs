import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const transientPatterns = [
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "fetch failed",
  "audit endpoint returned an error",
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runAudit() {
  return new Promise((resolve, reject) => {
    let output = "";
    const env = { ...process.env };
    delete env.npm_config_devdir;
    delete env.NPM_CONFIG_DEVDIR;

    const child = spawn(npmCommand, ["audit", "--audit-level=high"], {
      env,
      shell: process.platform === "win32",
    });

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });
    child.once("error", reject);
    child.once("exit", (code) => resolve({ code: code ?? 1, output }));
  });
}

for (let attempt = 1; attempt <= 5; attempt += 1) {
  const result = await runAudit();
  if (result.code === 0) {
    process.exit(0);
  }

  const transient = transientPatterns.some((pattern) => result.output.includes(pattern));
  if (!transient || attempt === 5) {
    process.exit(result.code);
  }

  console.log(`npm audit transient failure, retrying ${attempt}/5...`);
  await delay(1000 * attempt);
}
