import { spawn, spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

const host = "127.0.0.1";
const backendPort = 8787;
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const nodeCommand = process.execPath;
const useShell = process.platform === "win32";
const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(scriptDir, "..");
const backendRoot = join(frontendRoot, "..", "backend");

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
  throw new Error(`Timed out waiting for TCP ${host}:${port}`);
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

function stopProcess(child) {
  if (!child || child.killed) {
    return;
  }
  if (process.platform === "win32" && child.pid) {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }
  child.kill();
}

function freeTcpPort(port) {
  if (process.platform !== "win32") {
    return;
  }
  spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }`,
    ],
    { stdio: "ignore", shell: false },
  );
}

const buildBackend = spawnSync(npmCommand, ["run", "build"], {
  cwd: backendRoot,
  encoding: "utf8",
  shell: useShell,
});
if (buildBackend.error || buildBackend.status !== 0) {
  console.error("Backend build failed before E2E.");
  if (buildBackend.error) {
    console.error(buildBackend.error.message);
  }
  if (buildBackend.stdout) {
    process.stdout.write(buildBackend.stdout);
  }
  if (buildBackend.stderr) {
    process.stderr.write(buildBackend.stderr);
  }
  process.exit(buildBackend.status ?? 1);
}

freeTcpPort(backendPort);

const backend = spawn(nodeCommand, ["dist/src/server.js"], {
  cwd: backendRoot,
  stdio: "inherit",
  shell: false,
  env: {
    ...process.env,
    PORT: String(backendPort),
    ION_DATA_MODE: "test-mock",
    NODE_ENV: "test",
  },
});

let backendStopped = false;
function stopBackend() {
  if (!backendStopped) {
    backendStopped = true;
    stopProcess(backend);
  }
}

const port = await getFreePort();
const baseUrl = `http://${host}:${port}`;
const preview = spawn(
  npmCommand,
  ["run", "preview:test", "--", "--port", String(port)],
  {
    stdio: "inherit",
    shell: useShell,
    cwd: frontendRoot,
    env: {
      ...process.env,
      VITE_ION_API_PROXY: `http://${host}:${backendPort}`,
    },
  },
);

let previewStopped = false;
function stopPreview() {
  if (!previewStopped && !preview.killed) {
    previewStopped = true;
    stopProcess(preview);
  }
}

backend.once("exit", (code) => {
  if (!backendStopped && code !== 0 && code !== null) {
    console.error(`Backend exited before E2E finished (code ${code}).`);
  }
});

try {
  await waitForTcp(backendPort);
  await waitForTcp(port);
  await run(npxCommand, ["playwright", "test"], {
    cwd: frontendRoot,
    env: {
      ...process.env,
      PLAYWRIGHT_BASE_URL: baseUrl,
    },
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  stopPreview();
  stopBackend();
  if (process.exitCode && process.exitCode !== 0) {
    process.exit(process.exitCode);
  }
}
