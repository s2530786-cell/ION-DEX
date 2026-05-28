#!/usr/bin/env node
/**
 * Daily GitHub discovery pipeline: catalog → DEX enrich → Top-N skill stubs → summary.
 * UTF-8 without BOM.
 *
 * Usage:
 *   node scripts/github-daily-pipeline.mjs
 *   node scripts/github-daily-pipeline.mjs --dry-run
 *   ION_GITHUB_DAILY_CLONE=1 node scripts/github-daily-pipeline.mjs
 *
 * Env:
 *   ION_PRIVATE_CORE_ROOT — private catalog + skills (auto-detected if unset)
 *   ION_GITHUB_DAILY_SKIP_ENRICH=1 — skip github-dex-enrich-catalog.mjs
 *   ION_GITHUB_DAILY_SKIP_STUBS=1 — skip skill stubs
 *   ION_GITHUB_DAILY_CLONE=1 — shallow-clone curated Top 5 (off by default)
 *   ION_GITHUB_AWESOME_INGEST=1 — clone awesome lists + stub every linked repo
 *   ION_GITHUB_DISCOVERY_PROFILE — ion-dev | broad | full (default full)
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, appendFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { githubDailyDir, getPrivateCoreRoot } from "./ion-private-core-path.mjs";
import { loadGitHubToken } from "./load-github-token.mjs";

const root = process.cwd();
const scriptsDir = join(root, "scripts");

function parseArgs(argv) {
  const opts = { dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--dry-run") opts.dryRun = true;
  }
  return opts;
}

function envTruthy(name) {
  const v = process.env[name]?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function runNode(script, args = [], { label, dryRun } = {}) {
  const rel = join("scripts", script);
  const cmd = `node ${rel}${args.length ? ` ${args.join(" ")}` : ""}`;
  console.log(`\n=== ${label} ===`);
  console.log(cmd);
  if (dryRun) {
    console.log("(dry-run skipped)");
    return { ok: true, status: 0 };
  }
  const r = spawnSync(process.execPath, [join(scriptsDir, script), ...args], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: false,
  });
  const ok = r.status === 0;
  if (!ok) console.error(`FAILED: ${label} (exit ${r.status ?? "signal"})`);
  return { ok, status: r.status ?? 1 };
}

function appendLog(logPath, line) {
  mkdirSync(join(logPath, ".."), { recursive: true });
  appendFileSync(logPath, `${line}\n`, "utf8");
}

function main() {
  const opts = parseArgs(process.argv);
  const priv = getPrivateCoreRoot(root);
  if (priv && !process.env.ION_PRIVATE_CORE_ROOT) {
    process.env.ION_PRIVATE_CORE_ROOT = priv;
  }

  const dailyDir = githubDailyDir(root);
  const day = new Date().toISOString().slice(0, 10);
  const logPath = join(dailyDir, "runs", `pipeline-${day}.log`);

  const log = (msg) => {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(msg);
    if (!opts.dryRun) {
      try {
        mkdirSync(join(dailyDir, "runs"), { recursive: true });
        appendLog(logPath, line);
      } catch {
        /* ignore log write errors */
      }
    }
  };

  log(`ION GitHub daily pipeline start (private: ${priv ?? "fallback public .memory-bank"})`);

  const token = loadGitHubToken();
  if (!token) {
    log("WARN: No GITHUB_TOKEN — discovery/enrich may be rate-limited. Set scripts/.github-token.local");
  } else {
    process.env.GITHUB_TOKEN = token;
    log("Token: loaded");
  }

  const steps = [
    {
      id: "discovery",
      script: "github-daily-discovery.mjs",
      required: true,
      label: "1/6 Discovery (profile full: ION + GitHub-wide taxonomy → latest.json)",
      args: process.env.ION_GITHUB_DISCOVERY_PROFILE
        ? ["--profile", process.env.ION_GITHUB_DISCOVERY_PROFILE]
        : ["--profile", "full"],
    },
    {
      id: "dex-enrich",
      script: "github-dex-enrich-catalog.mjs",
      required: false,
      skip: () => envTruthy("ION_GITHUB_DAILY_SKIP_ENRICH"),
      label: "2/6 DEX curated enrich (web3-dex-curated)",
    },
    {
      id: "awesome-ingest",
      script: "github-daily-awesome-ingest.mjs",
      args: ["--merge-catalog"],
      required: false,
      skip: () => !envTruthy("ION_GITHUB_AWESOME_INGEST"),
      label: "2b/6 Awesome ingest (clone README lists → all repo skill stubs)",
    },
    {
      id: "stubs",
      script: "github-daily-skill-stubs.mjs",
      required: true,
      skip: () => envTruthy("ION_GITHUB_DAILY_SKIP_STUBS"),
      label: "3/6 Skill stubs (全品类每类 Top5 + DEX curated 全量 → ion-private-core)",
    },
    {
      id: "top",
      script: "github-daily-top.mjs",
      args: ["--per-category", "--limit", "5"],
      required: false,
      label: "4/6 Per-category Top 5 summary",
    },
    {
      id: "public-index",
      script: "sync-github-discovered-public-index.mjs",
      required: false,
      label: "5/6 Public discovered-index (Cursor routing)",
    },
    {
      id: "clone",
      script: "github-daily-install.mjs",
      args: ["--curated"],
      required: false,
      skip: () => !envTruthy("ION_GITHUB_DAILY_CLONE"),
      label: "6/6 Optional clone (ION_GITHUB_DAILY_CLONE=1)",
    },
  ];

  let failedRequired = false;
  for (const step of steps) {
    if (step.skip?.()) {
      log(`SKIP: ${step.label}`);
      continue;
    }
    const { ok } = runNode(step.script, step.args ?? [], {
      label: step.label,
      dryRun: opts.dryRun,
    });
    log(`${ok ? "OK" : "FAIL"}: ${step.id}`);
    if (!ok && step.required) failedRequired = true;
  }

  if (failedRequired) {
    log("Pipeline aborted — required step failed.");
    process.exit(1);
  }

  log(`Pipeline complete. Catalog: ${join(dailyDir, "latest.md")}`);
  if (!opts.dryRun) log(`Log: ${logPath}`);
  log("Skill stubs: ion-private-core/.cursor/skills/github-discovered/");
}

main();
