import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const transientPatterns = [
  "ECONNREFUSED",
  "ECONNRESET",
  "ECONNABORTED",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "ERR_SOCKET_TIMEOUT",
  "socket hang up",
  "network request to",
  "fetch failed",
  "audit endpoint returned an error",
  "503 service unavailable",
  "504 gateway timeout",
  "429 too many requests",
];
const npmLogsDir = join(
  process.env.LOCALAPPDATA || process.env.HOME || process.cwd(),
  "npm-cache",
  "_logs",
);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function listRecentNpmLogs() {
  try {
    return readdirSync(npmLogsDir)
      .filter((name) => name.endsWith("-debug-0.log"))
      .map((name) => {
        const path = join(npmLogsDir, name);
        return { name, path, mtimeMs: statSync(path).mtimeMs };
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs);
  } catch {
    return [];
  }
}

function latestNewLog(beforeNames, startedAtMs) {
  const candidates = listRecentNpmLogs().filter(
    (entry) => !beforeNames.has(entry.name) || entry.mtimeMs >= startedAtMs - 1000,
  );
  return candidates[0] ?? null;
}

function classifyTransient(text) {
  const normalized = text.toLowerCase();
  return transientPatterns.some((pattern) => normalized.includes(pattern.toLowerCase()));
}

function summarizeDebugLog(text) {
  const lines = text.split(/\r?\n/);
  const interesting = lines.filter((line) => {
    const normalized = line.toLowerCase();
    return (
      normalized.includes("error") ||
      normalized.includes("warn") ||
      transientPatterns.some((pattern) => normalized.includes(pattern.toLowerCase()))
    );
  });
  const sample = interesting.slice(-12);
  if (sample.length > 0) {
    return sample.join("\n");
  }
  return lines.slice(-12).join("\n");
}

function runAudit() {
  return new Promise((resolve, reject) => {
    let output = "";
    const env = { ...process.env };
    delete env.npm_config_devdir;
    delete env.NPM_CONFIG_DEVDIR;
    const beforeLogs = new Set(listRecentNpmLogs().map((entry) => entry.name));
    const startedAtMs = Date.now();

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
    child.once("exit", (code) => {
      const result = { code: code ?? 1, output, debugLogPath: "", debugLogText: "" };
      if (result.code !== 0) {
        const latestLog = latestNewLog(beforeLogs, startedAtMs);
        if (latestLog) {
          result.debugLogPath = latestLog.path;
          try {
            result.debugLogText = readFileSync(latestLog.path, "utf8");
          } catch {
            result.debugLogText = "";
          }
          if (result.debugLogText) {
            process.stderr.write(`npm audit debug log: ${latestLog.path}\n`);
            process.stderr.write(`${summarizeDebugLog(result.debugLogText)}\n`);
            result.output += `\nnpm audit debug log: ${latestLog.path}\n${result.debugLogText}`;
          }
        }
      }
      resolve(result);
    });
  });
}

for (let attempt = 1; attempt <= 5; attempt += 1) {
  const result = await runAudit();
  if (result.code === 0) {
    process.exit(0);
  }

  const transient = classifyTransient(result.output);
  if (!transient || attempt === 5) {
    process.exit(result.code);
  }

  console.log(`npm audit transient failure, retrying ${attempt}/5...`);
  await delay(1000 * attempt);
}
