import { spawn, spawnSync } from "node:child_process";
import net from "node:net";

const host = "127.0.0.1";
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const useShell = process.platform === "win32";

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
const preview = spawn(npmCommand, ["run", "preview:test", "--", "--port", String(port)], {
  stdio: "inherit",
  shell: useShell,
});

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

try {
  await waitForTcp(port);
  await run(npxCommand, ["playwright", "test"], {
    env: {
      ...process.env,
      PLAYWRIGHT_BASE_URL: baseUrl,
    },
  });
} finally {
  stopPreview();
}
