/**
 * Release ION DEX dev ports before verify loops (Windows-first).
 * Only terminates LISTENING sockets on the local port — never ESTABLISHED clients
 * (killing clients was breaking Playwright/npm mid verify-100).
 */
import { execSync, spawnSync } from "node:child_process";

const ports = [8787, 8788, 8789];
const systemRoot = process.env.SystemRoot || "C:\\Windows";
const netstatExe = `${systemRoot}\\System32\\netstat.exe`;
const taskkillExe = `${systemRoot}\\System32\\taskkill.exe`;
const findstrExe = `${systemRoot}\\System32\\findstr.exe`;

function freePortWinListenOnly(port) {
  try {
    const output = execSync(
      `"${netstatExe}" -ano -p tcp | "${findstrExe}" ":${port}" | "${findstrExe}" LISTENING`,
      {
        encoding: "utf8",
        shell: true,
      },
    );
    const pids = new Set();
    for (const line of output.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      const parts = trimmed.split(/\s+/);
      const pid = parts[parts.length - 1];
      if (/^\d+$/.test(pid)) {
        pids.add(pid);
      }
    }
    for (const pid of pids) {
      try {
        execSync(`"${taskkillExe}" /PID ${pid} /T /F`, { stdio: "ignore", shell: true });
      } catch {
        // Process may already be gone.
      }
    }
  } catch {
    // No listeners on port.
  }
}

function freePortUnix(port) {
  spawnSync("bash", ["-lc", `lsof -ti :${port} -sTCP:LISTEN | xargs -r kill -9`], { stdio: "ignore" });
}

for (const port of ports) {
  if (process.platform === "win32") {
    freePortWinListenOnly(port);
  } else {
    freePortUnix(port);
  }
}

process.exit(0);
