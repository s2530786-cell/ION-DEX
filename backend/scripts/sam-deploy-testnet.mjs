import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(scriptDir, "..");
const template = "serverless/template.yaml";
const samConfig = resolve(backendRoot, "serverless/samconfig.toml");

function run(command, args, options = {}) {
  const useShell = process.platform === "win32";
  const result = spawnSync(command, args, {
    cwd: backendRoot,
    stdio: "inherit",
    shell: useShell,
    env: process.env,
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function npmCmd(): string {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

const identity = spawnSync("aws", ["sts", "get-caller-identity"], {
  cwd: backendRoot,
  encoding: "utf8",
  shell: process.platform === "win32",
});

if (identity.status !== 0) {
  console.error("AWS credentials not configured or expired.");
  console.error("Run: aws configure   (or aws sso login --profile <name>)");
  if (identity.stderr) {
    console.error(identity.stderr.trim());
  }
  process.exit(identity.status ?? 1);
}

console.log(identity.stdout.trim());

if (!existsSync(samConfig)) {
  console.error("Missing serverless/samconfig.toml");
  console.error("Copy:  copy serverless\\samconfig.toml.example serverless\\samconfig.toml");
  console.error("Edit stack name, region, and parameter overrides for testnet.");
  process.exit(1);
}

console.log("Building artifacts (sam:build:win)...");
run(npmCmd(), ["run", "sam:build:win"]);

console.log("Deploying testnet stack (sam deploy --config-env testnet)...");
run("sam", ["deploy", "--config-env", "testnet", "-t", template]);

console.log("Done. Check Outputs in CloudFormation or sam deploy output for ApiEndpoint / HealthCheckUrl.");
