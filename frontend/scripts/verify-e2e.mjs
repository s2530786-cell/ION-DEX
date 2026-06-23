import { execSync, spawn, spawnSync } from "node:child_process";
import net from "node:net";
import { fileURLToPath } from "node:url";

const host = "127.0.0.1";
const DEFAULT_BACKEND_PORT = 8787;
const RESERVED_BACKEND_PORTS = new Set([DEFAULT_BACKEND_PORT, 8788, 8789]);
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const useShell = process.platform === "win32";
const backendDir = fileURLToPath(new URL("../../backend", import.meta.url));
const frontendDir = fileURLToPath(new URL("..", import.meta.url));
const systemRoot = process.env.SystemRoot || "C:\\Windows";
const netstatExe = `${systemRoot}\\System32\\netstat.exe`;
const taskkillExe = `${systemRoot}\\System32\\taskkill.exe`;
const findstrExe = `${systemRoot}\\System32\\findstr.exe`;

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

async function waitForTcp(port, timeoutMs = 20_000, label = `server on ${host}:${port}`) {
  const deadline = Date.now() + timeoutMs;
  let lastError = "unreachable";
  while (Date.now() < deadline) {
    const result = await new Promise((resolve) => {
      const socket = net.connect({ host, port });
      socket.once("connect", () => {
        socket.destroy();
        resolve({ ok: true, message: "connected" });
      });
      socket.once("error", (error) => {
        socket.destroy();
        resolve({ ok: false, message: `${error.code || error.name || "ERROR"}: ${error.message}` });
      });
    });
    if (result.ok) {
      return;
    }
    lastError = result.message;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${label}; last probe: ${lastError}`);
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

async function waitForPortClosed(port, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!(await isTcpOpen(port))) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Port ${port} did not close within ${timeoutMs}ms`);
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

function freeIonDevPorts() {
  spawnSync(process.execPath, [fileURLToPath(new URL("../../scripts/free-ion-ports.mjs", import.meta.url))], {
    stdio: "ignore",
  });
}

function killListenPort(port) {
  if (process.platform === "win32") {
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
          // Process may already be gone or access denied.
        }
      }
    } catch {
      // No listeners on port.
    }
    return;
  }
  spawnSync("bash", ["-lc", `lsof -ti :${port} | xargs -r kill -9`], { stdio: "ignore" });
}

async function tryRecyclePort(port, attempts = 8) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (!(await isTcpOpen(port))) {
      return true;
    }
    killListenPort(port);
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return !(await isTcpOpen(port));
}

async function backendHasRequiredRoutes(backendPort) {
  const base = `http://${host}:${backendPort}`;
  try {
    const [health, profile, liquidityMine, domainManage, batchTransfer] = await Promise.all([
      fetch(`${base}/api/health`),
      fetch(`${base}/api/profile/demo`),
      fetch(`${base}/api/liquidity-mine/pools`),
      fetch(`${base}/api/domain-manage/overview`),
      fetch(`${base}/api/batch-transfer/config`),
    ]);
    return health.ok && profile.ok && liquidityMine.ok && domainManage.ok && batchTransfer.ok;
  } catch {
    return false;
  }
}

async function previewProxyHasRequiredRoutes(previewBaseUrl, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  let lastStatus = "proxy routes not ready";
  while (Date.now() < deadline) {
    try {
      const [health, liquidityMine, domainManage, batchTransfer] = await Promise.all([
        fetch(`${previewBaseUrl}/api/health`),
        fetch(`${previewBaseUrl}/api/liquidity-mine/pools`),
        fetch(`${previewBaseUrl}/api/domain-manage/overview`),
        fetch(`${previewBaseUrl}/api/batch-transfer/config`),
      ]);
      if (health.ok && liquidityMine.ok && domainManage.ok && batchTransfer.ok) {
        return;
      }
      lastStatus = `proxy responded but required routes were not all ok (health=${health.status}, liquidityMine=${liquidityMine.status}, domainManage=${domainManage.status}, batchTransfer=${batchTransfer.status})`;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      lastStatus = `proxy fetch failed: ${message}`;
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`Preview proxy never became healthy; last status: ${lastStatus}`);
}

async function waitForHealthyBackend(backendPort, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let lastStatus = "routes not ready";
  while (Date.now() < deadline) {
    const tcpOpen = await isTcpOpen(backendPort);
    if (!tcpOpen) {
      lastStatus = `tcp closed on ${host}:${backendPort}`;
      await new Promise((resolve) => setTimeout(resolve, 400));
      continue;
    }
    if (await backendHasRequiredRoutes(backendPort)) {
      return;
    }
    lastStatus = `tcp open on ${host}:${backendPort} but required API routes not ready`;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`Backend on :${backendPort} never became healthy; last status: ${lastStatus}`);
}

async function resolveBackendPort() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const port = await getFreePort();
    if (RESERVED_BACKEND_PORTS.has(port)) {
      continue;
    }
    if (!(await isTcpOpen(port))) {
      console.warn(`[verify-e2e] dedicated verify backend on dynamic port :${port} (:${DEFAULT_BACKEND_PORT} left for dev).`);
      return port;
    }
  }

  throw new Error("Cannot allocate a free dynamic backend port for verify-e2e.");
}

const backendPort = await resolveBackendPort();
const verifyBackendUrl = `http://${host}:${backendPort}`;

const previewPort = await getFreePort();
const baseUrl = `http://${host}:${previewPort}`;
console.log(`[verify-e2e] preview=${baseUrl} proxy=/api -> ${verifyBackendUrl}`);

let shuttingDown = false;

const backendBuild = spawnSync(npmCommand, ["run", "build"], {
  cwd: backendDir,
  stdio: "inherit",
  shell: useShell,
});
if (backendBuild.status !== 0) {
  throw new Error(`Backend build failed with ${backendBuild.status}`);
}

await tryRecyclePort(backendPort);

const backend = spawn(process.execPath, ["dist/src/server.js"], {
  cwd: backendDir,
  env: {
    ...process.env,
    BACKEND_PORT: String(backendPort),
    /** Deterministic catalog DNS + session portfolio for Playwright (matches backend unit tests). */
    ION_DATA_MODE: "test-mock",
  },
  stdio: "inherit",
  shell: false,
});

backend.once("exit", (code, signal) => {
  if (!shuttingDown) {
    console.error(
      `[verify-e2e] backend process exited early (port=${backendPort}, code=${code ?? "null"}, signal=${signal ?? "null"})`,
    );
  }
});

console.log(`[verify-e2e] backend=${verifyBackendUrl} preview will bind next`);

const preview = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "preview", "--host=127.0.0.1", "--strictPort", "--port", String(previewPort)],
  {
    cwd: frontendDir,
    env: {
      ...process.env,
      ION_VERIFY_BACKEND_URL: verifyBackendUrl,
    },
    stdio: "inherit",
    shell: false,
  },
);

preview.once("exit", (code, signal) => {
  if (!shuttingDown) {
    console.error(
      `[verify-e2e] preview process exited early (port=${previewPort}, code=${code ?? "null"}, signal=${signal ?? "null"})`,
    );
  }
});

function stopPreview() {
  if (!shuttingDown && !preview.killed) {
    shuttingDown = true;
    if (process.platform === "win32" && preview.pid) {
      spawnSync(taskkillExe, ["/pid", String(preview.pid), "/T", "/F"], { stdio: "ignore" });
      return;
    }
    preview.kill();
  }
}

function stopBackend() {
  if (backend && !backend.killed) {
    shuttingDown = true;
    if (process.platform === "win32" && backend.pid) {
      spawnSync(taskkillExe, ["/pid", String(backend.pid), "/T", "/F"], { stdio: "ignore" });
      return;
    }
    backend.kill();
  }
}

try {
  await waitForTcp(backendPort, 20_000, `verify backend on ${host}:${backendPort}`);
  await waitForHealthyBackend(backendPort);
  await waitForTcp(previewPort, 20_000, `preview server on ${host}:${previewPort}`);
  await previewProxyHasRequiredRoutes(baseUrl);
  const playwrightArgs = ["playwright", "test", "--workers=1", "--retries=1"];
  if (process.env.PLAYWRIGHT_TEST_PATH?.trim()) {
    playwrightArgs.push(process.env.PLAYWRIGHT_TEST_PATH.trim());
  }
  await run(npxCommand, playwrightArgs, {
    env: {
      ...process.env,
      PLAYWRIGHT_BASE_URL: baseUrl,
    },
  });
} finally {
  stopPreview();
  stopBackend();
  if (backendPort !== DEFAULT_BACKEND_PORT) {
    await tryRecyclePort(backendPort, 12);
    await waitForPortClosed(backendPort, 8_000).catch(() => undefined);
  }
  if (backendPort !== DEFAULT_BACKEND_PORT) {
    killListenPort(backendPort);
  }
  freeIonDevPorts();
}
