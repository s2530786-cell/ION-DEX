#!/usr/bin/env node
/**
 * Capture UI signoff screenshots (375/768/1440) via Playwright.
 * Usage: node scripts/capture-ui-signoff-screenshots.mjs --batch B
 */

import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const host = "127.0.0.1";
const backendPort = Number(process.env.ION_VERIFY_BACKEND_PORT || 8788);
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const useShell = process.platform === "win32";
const backend = join(root, "backend");
const frontend = join(root, "frontend");
const spec = "e2e/dashboard-visual-signoff.spec.ts";

function parseBatch(argv) {
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--batch" && argv[i + 1]) {
      return String(argv[++i]).toUpperCase();
    }
    if (argv[i].startsWith("--batch=")) {
      return argv[i].slice("--batch=".length).toUpperCase();
    }
  }
  return "B";
}

const batch = parseBatch(process.argv);
const outDir = join(root, "docs", "screenshots", "ui-signoff", `batch-${batch.toLowerCase()}`);
const captureDir = join(frontend, "test-results", "ui-signoff");

function stopChild(child) {
  if (!child || child.killed) return;
  if (process.platform === "win32" && child.pid) {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }
  child.kill();
}

async function getFreePort() {
  const net = await import("node:net");
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, host, () => {
      const address = server.address();
      server.close((error) => {
        if (error) reject(error);
        else if (!address || typeof address !== "object") reject(new Error("no port"));
        else resolve(address.port);
      });
    });
  });
}

async function waitForHttp(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: "follow" });
      if (response.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

console.log(`=== UI signoff screenshots: batch ${batch} ===`);

const backendBuild = spawnSync(npmCommand, ["run", "build"], {
  cwd: backend,
  encoding: "utf8",
  shell: useShell,
});
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

const backendProc = spawn(process.execPath, ["dist/src/server.js"], {
  cwd: backend,
  env: { ...process.env, BACKEND_PORT: String(backendPort), ION_DATA_MODE: "test-mock" },
  stdio: "ignore",
  shell: useShell,
});

const previewPort = await getFreePort();
const previewProc = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "preview", "--host", host, "--strictPort", "--port", String(previewPort)],
  { cwd: frontend, stdio: "ignore", shell: useShell },
);

const baseUrl = `http://${host}:${previewPort}`;

try {
  await waitForHttp(`${baseUrl}/`);
  await waitForHttp(`http://${host}:${backendPort}/api/health`);

  mkdirSync(captureDir, { recursive: true });

  const run = spawnSync(
    npxCommand,
    ["playwright", "test", spec, "--reporter=line", "--workers=1"],
    {
      cwd: frontend,
      encoding: "utf8",
      shell: useShell,
      env: {
        ...process.env,
        PLAYWRIGHT_BASE_URL: baseUrl,
        PLAYWRIGHT_API_BASE_URL: `http://${host}:${backendPort}`,
      },
    },
  );

  if (run.status !== 0) {
    if (run.stdout) process.stderr.write(run.stdout);
    if (run.stderr) process.stderr.write(run.stderr);
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });
  for (const label of ["375", "768", "1440"]) {
    const src = join(captureDir, `dashboard-${label}.png`);
    const dest = join(outDir, `dashboard-${label}.png`);
    if (!existsSync(src)) {
      console.error(`missing capture: ${src}`);
      process.exit(1);
    }
    copyFileSync(src, dest);
    console.log(`WROTE ${dest}`);
  }

  console.log(`OK signoff screenshots -> ${outDir}`);
} finally {
  stopChild(previewProc);
  stopChild(backendProc);
}
