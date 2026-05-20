import { spawn, spawnSync } from "node:child_process";
import net from "node:net";
import { fileURLToPath } from "node:url";

const host = "127.0.0.1";
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const useShell = process.platform === "win32";
const backendDir = fileURLToPath(new URL("../../backend", import.meta.url));
const frontendDir = fileURLToPath(new URL("..", import.meta.url));

async function getFreePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, host, resolve);
  });
  const address = server.address();
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  if (!address || typeof address !== "object") {
    throw new Error("Unable to allocate a local preview port.");
  }
  return address.port;
}

async function waitForTcp(port, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const connected = await new Promise((resolve) => {
      const socket = net.connect({ host, port });
      socket.once("connect", () => {
        socket.destroy();
        resolve(true);
      });
      socket.once("error", () => {
        socket.destroy();
        resolve(false);
      });
    });
    if (connected) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for preview server on ${host}:${port}`);
}

async function isTcpOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: useShell,
      ...options,
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

const port = await getFreePort();
const baseUrl = `http://${host}:${port}`;
const backendBuild = spawnSync(npmCommand, ["run", "build"], {
  cwd: backendDir,
  stdio: "inherit",
  shell: useShell,
});
if (backendBuild.status !== 0) {
  throw new Error(`Backend build failed with ${backendBuild.status}`);
}
async function backendHasProfileRoute() {
  try {
    const response = await fetch("http://127.0.0.1:8787/api/profile/session");
    return response.ok;
  } catch {
    return false;
  }
}

const backendPortOpen = await isTcpOpen(8787);
let backendAlreadyRunning = backendPortOpen && (await backendHasProfileRoute());
if (backendPortOpen && !backendAlreadyRunning) {
  console.warn("Stale backend on :8787 missing /api/profile/session — restarting gateway.");
  if (process.platform === "win32") {
    spawnSync("cmd.exe", ["/d", "/c", "for /f \"tokens=5\" %a in ('netstat -ano ^| findstr :8787') do taskkill /PID %a /F"], {
      stdio: "ignore",
      shell: false,
    });
  } else {
    spawnSync("bash", ["-lc", "lsof -ti :8787 | xargs -r kill"], { stdio: "ignore" });
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
  backendAlreadyRunning = false;
}
const backend = backendAlreadyRunning
  ? null
  : spawn(process.execPath, ["dist/src/server.js"], {
      cwd: backendDir,
      env: {
        ...process.env,
        BACKEND_PORT: "8787",
      },
      stdio: "inherit",
      shell: useShell,
    });
const preview = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "preview", "--host=127.0.0.1", "--strictPort", "--port", String(port)],
  {
    cwd: frontendDir,
    stdio: "inherit",
    shell: useShell,
  },
);

let shuttingDown = false;
function stopPreview() {
  if (!shuttingDown && !preview.killed) {
    shuttingDown = true;
    if (process.platform === "win32" && preview.pid) {
      spawnSync("taskkill", ["/pid", String(preview.pid), "/T", "/F"], { stdio: "ignore" });
      return;
    }
    preview.kill();
  }
}

function stopBackend() {
  if (backend && !backend.killed) {
    if (process.platform === "win32" && backend.pid) {
      spawnSync("taskkill", ["/pid", String(backend.pid), "/T", "/F"], { stdio: "ignore" });
      return;
    }
    backend.kill();
  }
}

try {
  await waitForTcp(8787);
  await waitForTcp(port);
  await run(npxCommand, ["playwright", "test"], {
    env: {
      ...process.env,
      PLAYWRIGHT_BASE_URL: baseUrl,
    },
  });
} finally {
  stopPreview();
  stopBackend();
}
