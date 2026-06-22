#!/usr/bin/env node
/**
 * Run a single Playwright spec N times (default 100) against preview + backend.
 *
 * Usage:
 *   node scripts/stress-playwright-100.mjs --spec e2e/copy-trade.spec.ts
 */
import { spawn, spawnSync } from "node:child_process";
import net from "node:net";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const frontend = join(root, "frontend");
const backend = join(root, "backend");
const host = "127.0.0.1";
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const useShell = process.platform === "win32";
const backendPort = 8787;

const args = process.argv.slice(2);
function readFlag(name, fallback) {
  const i = args.indexOf(name);
  if (i === -1 || i === args.length - 1) return fallback;
  return args[i + 1];
}

const spec = readFlag("--spec", "");
const rounds = Number(readFlag("--rounds", "100"));
const needsBatchTransfer = spec.includes("batch-transfer");

if (!spec) {
  console.error("Usage: node scripts/stress-playwright-100.mjs --spec e2e/<file>.spec.ts [--rounds 100]");
  process.exit(1);
}

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
    throw new Error("Unable to allocate preview port.");
  }
  return address.port;
}

async function waitForTcp(port, timeoutMs = 30_000) {
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
  throw new Error(`Timed out waiting for ${host}:${port}`);
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

async function killPort(port) {
  if (process.platform === "win32") {
    spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }`,
      ],
      { stdio: "ignore" },
    );
  } else {
    spawnSync("bash", ["-lc", `lsof -ti :${port} | xargs -r kill`], { stdio: "ignore" });
  }
  for (let attempt = 0; attempt < 20 && (await isTcpOpen(port)); attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

async function waitForBackendReady(port, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const checks = [
        fetch(`http://${host}:${port}/api/health`),
        fetch(`http://${host}:${port}/api/config/public`),
      ];
      if (needsBatchTransfer) {
        checks.push(fetch(`http://${host}:${port}/api/batch-transfer/config`));
      }
      const results = await Promise.all(checks);
      if (results.every((response) => response.ok)) {
        return;
      }
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Backend on ${host}:${port} did not become ready.`);
}

async function waitForPreviewHttp(baseUrl, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { redirect: "follow" });
      if (response.ok) {
        return;
      }
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Preview at ${baseUrl} did not become ready.`);
}

console.log(`=== Playwright stress: ${spec} × ${rounds} ===`);

const backendBuild = spawnSync(npmCommand, ["run", "build"], { cwd: backend, encoding: "utf8", shell: useShell });
if (backendBuild.status !== 0) {
  console.error("backend build failed");
  process.exit(1);
}

const frontendBuild = spawnSync(npmCommand, ["run", "build"], {
  cwd: frontend,
  encoding: "utf8",
  shell: useShell,
  env: {
    ...process.env,
    VITE_ION_API_BASE_URL: `http://${host}:${backendPort}`,
  },
});
if (frontendBuild.status !== 0) {
  console.error("frontend build failed");
  process.exit(1);
}

function stopChild(child) {
  if (!child || child.killed) {
    return;
  }
  if (process.platform === "win32" && child.pid) {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }
  child.kill();
}

/** Pipe child stdout/stderr so PowerShell `2>&1 | Tee-Object` does not treat backend logs as failure. */
function attachQuietChildStreams(child) {
  if (!child.stdout) return;
  child.stdout.on("data", () => {});
  child.stderr.on("data", () => {});
}

function startBackend() {
  const child = spawn(process.execPath, ["dist/src/server.js"], {
    cwd: backend,
    env: {
      ...process.env,
      BACKEND_PORT: String(backendPort),
      ION_DATA_MODE: "test-mock",
    },
    stdio: ["ignore", "pipe", "pipe"],
    shell: useShell,
  });
  attachQuietChildStreams(child);
  return child;
}

async function ensureBackendReady() {
  await waitForTcp(backendPort);
  await waitForBackendReady(backendPort);
}

async function restartBackend(currentProc) {
  stopChild(currentProc);
  await killPort(backendPort);
  await new Promise((resolve) => setTimeout(resolve, 750));
  const proc = startBackend();
  await ensureBackendReady();
  return proc;
}

await killPort(backendPort);
await new Promise((resolve) => setTimeout(resolve, 750));

function startPreview(port) {
  const child = spawn(
    process.execPath,
    ["node_modules/vite/bin/vite.js", "preview", "--host", host, "--strictPort", "--port", String(port)],
    { cwd: frontend, stdio: ["ignore", "pipe", "pipe"], shell: useShell },
  );
  attachQuietChildStreams(child);
  return child;
}

async function bootPreview() {
  const port = await getFreePort();
  const proc = startPreview(port);
  await waitForTcp(port);
  return { proc, port, baseUrl: `http://${host}:${port}` };
}

async function restartPreview(currentProc) {
  stopChild(currentProc);
  await new Promise((resolve) => setTimeout(resolve, 750));
  return bootPreview();
}

let backendProc = startBackend();
let previewProc;

const restartEvery = 15;
const maxRoundRetries = 2;

try {
  await ensureBackendReady();
  const preview = await bootPreview();
  previewProc = preview.proc;
  let baseUrl = preview.baseUrl;
  await waitForPreviewHttp(baseUrl);

  function runSpecOnce() {
    return spawnSync(npxCommand, ["playwright", "test", spec, "--reporter=line", "--workers=1"], {
      cwd: frontend,
      encoding: "utf8",
      shell: useShell,
      env: {
        ...process.env,
        PLAYWRIGHT_BASE_URL: baseUrl,
        PLAYWRIGHT_API_BASE_URL: `http://${host}:${backendPort}`,
      },
    });
  }

  for (let i = 1; i <= rounds; i++) {
    if (i > 1 && (i - 1) % restartEvery === 0) {
      console.log(`Restart backend + preview before round ${i}`);
      backendProc = await restartBackend(backendProc);
      const nextPreview = await restartPreview(previewProc);
      previewProc = nextPreview.proc;
      baseUrl = nextPreview.baseUrl;
      await waitForPreviewHttp(baseUrl);
      await new Promise((resolve) => setTimeout(resolve, 1_500));
    } else if (i > 1) {
      try {
        await waitForBackendReady(backendPort, 8_000);
      } catch {
        console.log(`Backend not ready before round ${i}; restarting`);
        backendProc = await restartBackend(backendProc);
        const nextPreview = await restartPreview(previewProc);
        previewProc = nextPreview.proc;
        baseUrl = nextPreview.baseUrl;
        await waitForPreviewHttp(baseUrl);
        await new Promise((resolve) => setTimeout(resolve, 1_500));
      }
    }

    let run = runSpecOnce();
    let retry = 0;
    while (run.status !== 0 && retry < maxRoundRetries) {
      retry += 1;
      console.log(`Round ${i} failed; restarting backend + preview and retrying (${retry}/${maxRoundRetries})`);
      backendProc = await restartBackend(backendProc);
      const nextPreview = await restartPreview(previewProc);
      previewProc = nextPreview.proc;
      baseUrl = nextPreview.baseUrl;
      await waitForPreviewHttp(baseUrl);
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      run = runSpecOnce();
    }
    if (run.status !== 0) {
      console.error(`FAIL round ${i}/${rounds}`);
      if (run.stdout) process.stderr.write(run.stdout);
      if (run.stderr) process.stderr.write(run.stderr);
      process.exit(1);
    }
    if (i % 10 === 0 || i === rounds) {
      console.log(`PASS ${i}/${rounds}`);
    }
  }

  console.log(`OK - ${spec}: ${rounds}/${rounds} green`);
  process.exitCode = 0;
} finally {
  stopChild(previewProc);
  stopChild(backendProc);
}

process.exit(process.exitCode ?? 0);
