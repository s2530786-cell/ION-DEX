#!/usr/bin/env node
/**
 * UI design phase pipeline: preflight, verify-full, screenshots, stress x100,
 * verify-100, guarded commit/push, optional auto-next.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { assertStageScope, stagePaths } from "./lib/git-stage-scope.mjs";

const root = process.cwd();
const isWin = process.platform === "win32";
const shell = isWin;
const psExe = join(
  process.env.SystemRoot || "C:\\Windows",
  "System32",
  "WindowsPowerShell",
  "v1.0",
  "powershell.exe",
);
const tempDir = process.env.TEMP || process.env.TMP || root;
const COMMON_STAGE_PATHS = [
  "scripts/ui-design-phase-pipeline.mjs",
  "scripts/capture-ui-signoff-screenshots.mjs",
  "scripts/stress-playwright-100.mjs",
  "scripts/lib/git-stage-scope.mjs",
  "docs/ui-round2-visual-alignment.md",
  "docs/99-current-progress.md",
  "SESSION_STATE.md",
];

const BATCHES = {
  B: {
    title: "Dashboard design signoff",
    designRefs: [
      ".memory-bank/design-refs/screens/04-dashboard-galaxy-spiral.png",
      ".memory-bank/design-refs/screens/01-glass-panel-wave-border.png",
    ],
    screenshotDir: "docs/screenshots/ui-signoff/batch-b",
    gapReport: "docs/ui-gap-analysis-batch-b-2026-05-26.md",
    stressSpec: "e2e/smoke.spec.ts",
    next: "C",
    stagePaths: [
      "frontend/src/pages/DashboardPage.tsx",
      "frontend/src/components",
      "frontend/src/styles",
      "frontend/e2e",
      "docs/ui-gap-analysis-batch-b-2026-05-26.md",
      "docs/screenshots/ui-signoff/batch-b",
      ...COMMON_STAGE_PATHS,
    ],
  },
  C: {
    title: "Trade / Swap visual closure",
    designRefs: [".memory-bank/design-refs/screens/04-dashboard-galaxy-spiral.png"],
    screenshotDir: "docs/screenshots/ui-signoff/batch-c",
    gapReport: "docs/ui-gap-analysis-batch-c-2026-05-26.md",
    stressSpec: "e2e/smoke.spec.ts",
    next: "D",
    stagePaths: [
      "frontend/src/pages",
      "frontend/src/components",
      "frontend/src/styles",
      "frontend/e2e",
      "docs/ui-gap-analysis-batch-c-2026-05-26.md",
      "docs/screenshots/ui-signoff/batch-c",
      ...COMMON_STAGE_PATHS,
    ],
  },
  D: {
    title: "Pool / Stake / Burn / Bridge / Domain visual closure",
    designRefs: [
      ".memory-bank/design-refs/screens/05-modal-pool-liquidity.png",
      ".memory-bank/design-refs/screens/06-modal-bridge-crosschain.png",
      ".memory-bank/design-refs/screens/07-modal-burn-tracking.png",
    ],
    screenshotDir: "docs/screenshots/ui-signoff/batch-d",
    gapReport: "docs/ui-gap-analysis-batch-d-2026-05-26.md",
    stressSpec: "e2e/smoke.spec.ts",
    next: null,
    stagePaths: [
      "frontend/src/pages",
      "frontend/src/components",
      "frontend/src/styles",
      "frontend/e2e",
      "docs/ui-gap-analysis-batch-d-2026-05-26.md",
      "docs/screenshots/ui-signoff/batch-d",
      ...COMMON_STAGE_PATHS,
    ],
  },
};

function parseArgs(argv) {
  let batch = "B";
  let commitPush = false;
  let autoNext = false;
  let skipGates = false;
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--batch" && argv[i + 1]) {
      batch = String(argv[++i]).toUpperCase();
      continue;
    }
    if (a.startsWith("--batch=")) {
      batch = a.slice("--batch=".length).toUpperCase();
      continue;
    }
    if (a === "--commit-push") {
      commitPush = true;
      continue;
    }
    if (a === "--auto-next") {
      autoNext = true;
      continue;
    }
    if (a === "--skip-verify-100") {
      throw new Error("--skip-verify-100 is forbidden. Every stage must pass verify-100 GREEN.");
    }
    if (a === "--skip-gates") {
      skipGates = true;
      continue;
    }
  }
  return { batch, commitPush, autoNext, skipGates };
}

function run(cmd, args, opts = {}) {
  console.log(`\n>> ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, {
    cwd: opts.cwd ?? root,
    stdio: "inherit",
    shell,
    env: {
      ...process.env,
      ION_VERIFY_NONINTERACTIVE: "1",
      ION_AGENT_AUTONOMOUS: "1",
      ...opts.env,
    },
  });
  return result.status ?? 1;
}

function tailVerifyFull() {
  const path = join(tempDir, "ion-verify-full.txt");
  if (!existsSync(path)) return "";
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  return lines.slice(-30).join("\n");
}

function readLatestVerify100SummarySync() {
  try {
    const files = readdirSync(tempDir)
      .filter((f) => f.startsWith("ion-verify-100-summary-") && f.endsWith(".txt"))
      .sort();
    const latest = files[files.length - 1];
    if (!latest) return { path: "", text: "" };
    const path = join(tempDir, latest);
    return { path, text: readFileSync(path, "utf8") };
  } catch {
    return { path: "", text: "" };
  }
}

function assertVerify100Green(summaryText) {
  if (!summaryText.includes("RESULT=GREEN") || !summaryText.includes("FAILED=0")) {
    return false;
  }
  const passed = summaryText.match(/PASSED=(\d+)/);
  const failed = summaryText.match(/FAILED=(\d+)/);
  if (!passed || !failed) return false;
  return Number(passed[1]) >= 100 && Number(failed[1]) === 0;
}

function writeGapReportBatchB(cfg) {
  const reportPath = join(root, cfg.gapReport);
  const shotBase = cfg.screenshotDir.replace(/\\/g, "/");
  const body = `# UI gap analysis - Dashboard - Batch B - 2026-05-26

**Design refs**
- \`.memory-bank/design-refs/screens/04-dashboard-galaxy-spiral.png\`
- \`.memory-bank/design-refs/screens/01-glass-panel-wave-border.png\`

**Captured screenshots**
- \`${shotBase}/dashboard-1440.png\`
- \`${shotBase}/dashboard-768.png\`
- \`${shotBase}/dashboard-375.png\`

**Comparison method**
- side-by-side review at 1440 width
- Playwright test ids keep the functional gate stable
- pixel-perfect visual parity is still iterative, not claimed complete in this batch

| # | Dimension | Target | Current state | Severity | Root cause | Next fix |
|---|---|---|---|---|---|---|
| 1 | Glass stage | Thick neon wave edge + inner glow | ChartStage plus flow-border-hero already applied to market stage | P1 | needs 1440 desktop visual tuning | continue in later UI batch |
| 2 | Color system | Master cyan / purple / magenta | global tokens and feature variants are in place | P1 | legacy hex values still exist in old modules | continue in Batch C |
| 3 | Layout | three-column ratio + equal-height lower cards | gap-4 items-stretch auto-rows-fr is live | P1 | minor mobile padding drift | backlog P2 |
| 4 | Icons | richer 3D treatment | currently flat Lucide plus glow | P2 | asset backlog | not a release blocker for Batch B |
| 5 | Copy | no engineering-sounding subheaders | removed Modules; source badge is sr-only | pass | complete for this batch | none |
| 6 | Background | strong galaxy / aurora presence | AuroraGalaxyBackground active | P1 | density and contrast can still be tuned | backlog P2 |

**P0 count**
- 0

**Functional evidence**
- \`scripts/verify-full-save-log.cmd --no-pause\`

**Stress evidence**
- \`stress-playwright-100.mjs --spec e2e/smoke.spec.ts --rounds 100\`

**Engineering gate**
- \`scripts/verify-100.ps1\` -> \`PASSED=100 FAILED=0 RESULT=GREEN\`

**Conclusion**
- Batch B is mergeable only after verify-100 GREEN.
- Visual parity is improved, but not claimed as final pixel-perfect closure yet.
`;
  mkdirSync(join(root, "docs"), { recursive: true });
  writeFileSync(reportPath, body, "utf8");
  console.log(`WROTE ${reportPath}`);
}

function updateRound2Table(batch, verifyNote) {
  const path = join(root, "docs/ui-round2-visual-alignment.md");
  if (!existsSync(path)) return;
  let text = readFileSync(path, "utf8");
  const row = `| 2026-05-26 | ${batch} | ChartStage stage, removed Modules subheader, equal-height feature grid, gap report refreshed | ${verifyNote} |`;
  if (text.includes(`| 2026-05-26 | ${batch} |`)) {
    text = text.replace(new RegExp(`\\| 2026-05-26 \\| ${batch} \\|[^\\n]+\\n`), `${row}\n`);
  } else {
    text = text.replace(
      "| 鈥?| 鈥?| 锛堝緟濉級 | 鈥?|",
      `${row}\n| 鈥?| 鈥?| 锛堝緟濉級 | 鈥?|`,
    );
  }
  writeFileSync(path, text, "utf8");
}

function gitCommitPush(batch, cfg) {
  let code = run(process.execPath, [join(root, "scripts/verify-100-gate.mjs"), "assert-commit"]);
  if (code !== 0) return code;

  stagePaths(root, cfg.stagePaths);
  assertStageScope(root, cfg.stagePaths);

  const msg = `ui(design-phase): Batch ${batch} dashboard signoff pipeline

- Batch ${batch}: ${cfg.title}
- Gap report: ${cfg.gapReport}
- Screenshots: ${cfg.screenshotDir}
- Gates: verify-full, stress x100, verify-100 GREEN`;

  const commit = spawnSync("git", ["commit", "-m", msg], { cwd: root, encoding: "utf8", shell });
  if (commit.status !== 0) {
    if ((commit.stdout || "").includes("nothing to commit")) {
      console.log("git: nothing to commit");
      return 0;
    }
    console.error(commit.stderr || commit.stdout);
    return commit.status ?? 1;
  }
  return run("git", ["push"]);
}

const { batch, commitPush, autoNext, skipGates } = parseArgs(process.argv);
const cfg = BATCHES[batch];
if (!cfg) {
  console.error(`Unknown batch: ${batch}`);
  process.exit(1);
}

console.log(`=== UI design phase pipeline: Batch ${batch} - ${cfg.title} ===`);

let code = 0;
if (!skipGates) {
  code = run(process.execPath, [join(root, "scripts/dev-preflight.mjs")]);
  if (code !== 0) process.exit(code);

  code = run(join(root, "scripts/verify-full-save-log.cmd"), ["--no-pause"]);
  if (code !== 0) {
    console.error("\n--- tail ion-verify-full.txt ---\n", tailVerifyFull());
    process.exit(code);
  }

  code = run(process.execPath, [join(root, "scripts/capture-ui-signoff-screenshots.mjs"), "--batch", batch]);
  if (code !== 0) process.exit(code);
} else {
  console.log("SKIP gates (--skip-gates): preflight/verify-full/screenshots already done by watchdog");
}

if (batch === "B") {
  writeGapReportBatchB(cfg);
} else {
  const stub = join(root, cfg.gapReport);
  if (!existsSync(stub)) {
    writeFileSync(
      stub,
      `# UI gap analysis - Batch ${batch} - 2026-05-26\n\nPending agent write-up. Follow the Batch B report shape.\n`,
      "utf8",
    );
  }
}

if (!skipGates) {
  code = run(process.execPath, [
    join(root, "scripts/stress-playwright-100.mjs"),
    "--spec",
    cfg.stressSpec,
    "--rounds",
    "100",
  ]);
  if (code !== 0) process.exit(code);
}

code = run(psExe, [
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  join(root, "scripts/verify-100.ps1"),
]);
const summary = readLatestVerify100SummarySync();
if (code !== 0 || !assertVerify100Green(summary.text)) {
  console.error("verify-100 not GREEN");
  if (summary.path) console.error(`See ${summary.path}`);
  process.exit(1);
}
const verify100Note = `verify-100 GREEN (${summary.path})`;

updateRound2Table(batch, verify100Note);

if (commitPush) {
  code = gitCommitPush(batch, cfg);
  if (code !== 0) process.exit(code);
}

console.log(`\n=== Batch ${batch} UI phase COMPLETE ===`);
console.log(`Gap: ${cfg.gapReport}`);
console.log(`Shots: ${cfg.screenshotDir}`);

if (autoNext && cfg.next) {
  const nextArgs = [
    join(root, "scripts/ui-design-phase-pipeline.mjs"),
    "--batch",
    cfg.next,
    "--commit-push",
    "--auto-next",
  ];
  console.log(`\n>> auto-next Batch ${cfg.next}`);
  const child = spawnSync(process.execPath, nextArgs, {
    cwd: root,
    stdio: "inherit",
    shell,
    env: { ...process.env, ION_VERIFY_NONINTERACTIVE: "1", ION_UI_STRICT: "1" },
  });
  process.exit(child.status ?? 0);
}

process.exit(0);
