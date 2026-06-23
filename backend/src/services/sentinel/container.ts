import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type ContainerRunResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  invoked: boolean;
  command: string;
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");

function defaultVendorRoot(): string {
  if (process.env.ION_SENTINEL_VENDOR_ROOT?.trim()) {
    return process.env.ION_SENTINEL_VENDOR_ROOT.trim();
  }
  return path.resolve(repoRoot, "../vendor-ion-discovery/D4Vinci");
}

function composeFile(): string {
  return (
    process.env.ION_SENTINEL_COMPOSE_FILE?.trim() ??
    path.join(repoRoot, "docker/security-sandbox/docker-compose.yml")
  );
}

export function sentinelDockerEnabled(requested?: boolean): boolean {
  if (requested === false) {
    return false;
  }
  if (requested === true) {
    return true;
  }
  return process.env.ION_SENTINEL_DOCKER === "1" || process.env.ION_SENTINEL_DOCKER === "true";
}

function runProcess(command: string, args: string[], timeoutMs: number): Promise<ContainerRunResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: {
        ...process.env,
        ION_SENTINEL_VENDOR_ROOT: defaultVendorRoot(),
      },
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout?.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 1,
        invoked: true,
        command: [command, ...args].join(" "),
      });
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr: `${stderr}\n${error.message}`.trim(),
        exitCode: 1,
        invoked: false,
        command: [command, ...args].join(" "),
      });
    });
  });
}

export async function runSentinelContainerScript(
  scriptName: string,
  scriptArgs: string[],
  timeoutMs: number,
): Promise<ContainerRunResult> {
  const compose = composeFile();
  const args = [
    "compose",
    "-f",
    compose,
    "--profile",
    "sentinel-lab",
    "run",
    "--rm",
    "--no-TTY",
    "sentinel-lab",
    "bash",
    `/scripts/${scriptName}`,
    ...scriptArgs,
  ];
  return runProcess("docker", args, timeoutMs + 5_000);
}
