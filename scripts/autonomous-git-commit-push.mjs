#!/usr/bin/env node
/**
 * After verify-100 GREEN: stage only the current workflow scope, validate the
 * fresh proof against the staged scope, then commit and push.
 */

import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { assertStageScope, stagePaths } from "./lib/git-stage-scope.mjs";

const root = process.cwd();
const shell = false;

const COMMON_STAGE_PATHS = [
  "scripts/autonomous-git-commit-push.mjs",
  "scripts/lib/git-stage-scope.mjs",
  "scripts/verify-100-gate.mjs",
  "backend/scripts/audit-high.mjs",
  "frontend/scripts/audit-high.mjs",
  "docs/99-current-progress.md",
  "SESSION_STATE.md",
];

const BATCH_META = {
  B: {
    title: "Dashboard design signoff",
    gapReport: "docs/ui-gap-analysis-batch-b-2026-05-26.md",
    screenshotDir: "docs/screenshots/ui-signoff/batch-b",
    stagePaths: [
      "frontend/src/pages/DashboardPage.tsx",
      "frontend/src/components",
      "frontend/src/styles",
      "frontend/e2e",
      "scripts/ui-design-phase-pipeline.mjs",
      "scripts/capture-ui-signoff-screenshots.mjs",
      "scripts/stress-playwright-100.mjs",
      "docs/ui-gap-analysis-batch-b-2026-05-26.md",
      "docs/screenshots/ui-signoff/batch-b",
      "docs/ui-round2-visual-alignment.md",
      ...COMMON_STAGE_PATHS,
    ],
  },
  C: {
    title: "Trade / Swap visual closure",
    gapReport: "docs/ui-gap-analysis-batch-c-2026-05-26.md",
    screenshotDir: "docs/screenshots/ui-signoff/batch-c",
    stagePaths: [
      "frontend/src/pages",
      "frontend/src/components",
      "frontend/src/styles",
      "frontend/e2e",
      "scripts/ui-design-phase-pipeline.mjs",
      "scripts/capture-ui-signoff-screenshots.mjs",
      "scripts/stress-playwright-100.mjs",
      "docs/ui-gap-analysis-batch-c-2026-05-26.md",
      "docs/screenshots/ui-signoff/batch-c",
      "docs/ui-round2-visual-alignment.md",
      ...COMMON_STAGE_PATHS,
    ],
  },
  D: {
    title: "Pool / Stake / Burn / Bridge / Domain visual closure",
    gapReport: "docs/ui-gap-analysis-batch-d-2026-05-26.md",
    screenshotDir: "docs/screenshots/ui-signoff/batch-d",
    stagePaths: [
      "frontend/src/pages",
      "frontend/src/components",
      "frontend/src/styles",
      "frontend/e2e",
      "scripts/ui-design-phase-pipeline.mjs",
      "scripts/capture-ui-signoff-screenshots.mjs",
      "scripts/stress-playwright-100.mjs",
      "docs/ui-gap-analysis-batch-d-2026-05-26.md",
      "docs/screenshots/ui-signoff/batch-d",
      "docs/ui-round2-visual-alignment.md",
      ...COMMON_STAGE_PATHS,
    ],
  },
};

function parseArgs(argv) {
  let batch = "B";
  let sinceIso = "";
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--batch" && argv[i + 1]) {
      batch = String(argv[++i]).toUpperCase();
      continue;
    }
    if (arg.startsWith("--batch=")) {
      batch = arg.slice("--batch=".length).toUpperCase();
      continue;
    }
    if (arg === "--since" && argv[i + 1]) {
      sinceIso = argv[++i];
      continue;
    }
    if (arg.startsWith("--since=")) {
      sinceIso = arg.slice("--since=".length);
    }
  }
  return { batch, sinceIso };
}

function run(cmd, args) {
  console.log(`\n>> ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell,
    env: { ...process.env, ION_VERIFY_NONINTERACTIVE: "1", ION_AGENT_AUTONOMOUS: "1" },
  });
  return result.status ?? 1;
}

const { batch, sinceIso } = parseArgs(process.argv);
const meta = BATCH_META[batch];
if (!meta) {
  console.error(`Unknown batch: ${batch}`);
  process.exit(1);
}

const verifyNote = `verify-100 GREEN (guarded proof, batch ${batch})`;

stagePaths(root, meta.stagePaths);
assertStageScope(root, meta.stagePaths);

let code = run(process.execPath, [
  join(root, "scripts/verify-100-gate.mjs"),
  "assert-commit",
  ...(sinceIso ? ["--since", sinceIso] : []),
]);
if (code !== 0) process.exit(code);

const msg = `ui(design-phase): Batch ${batch} after verify-100 GREEN

- ${meta.title}
- Gap: ${meta.gapReport}
- Screenshots: ${meta.screenshotDir}
- ${verifyNote}
- Autonomous: commit+push triggered by watchdog after PASSED=100`;

const commit = spawnSync("git", ["commit", "-m", msg], {
  cwd: root,
  encoding: "utf8",
  shell,
});
if (commit.status !== 0) {
  const out = `${commit.stdout || ""}${commit.stderr || ""}`;
  if (out.includes("nothing to commit")) {
    console.log("git: nothing to commit (already committed)");
  } else {
    console.error(out);
    process.exit(commit.status ?? 1);
  }
} else {
  console.log("git: commit OK");
}

code = run("git", ["push"]);
if (code !== 0) process.exit(code);

console.log(`\n=== autonomous-git-commit-push Batch ${batch} OK ===`);
process.exit(0);
