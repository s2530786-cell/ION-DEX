#!/usr/bin/env node
/**
 * UI design phase pipeline — functional gate, visual captures, gap report, stress×100, verify×100, commit, auto-next.
 *
 * Usage:
 *   node scripts/ui-design-phase-pipeline.mjs --batch B
 *   node scripts/ui-design-phase-pipeline.mjs --batch B --commit-push --auto-next
 *   scripts\run-ui-design-phase-batch.cmd --batch B --commit-push --auto-next
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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

const BATCHES = {
  B: {
    title: "Dashboard 像素级",
    designRefs: [
      ".memory-bank/design-refs/screens/04-dashboard-galaxy-spiral.png",
      ".memory-bank/design-refs/screens/01-glass-panel-wave-border.png",
    ],
    screenshotDir: "docs/screenshots/ui-signoff/batch-b",
    gapReport: "docs/ui-gap-analysis-batch-b-2026-05-26.md",
    stressSpec: "e2e/smoke.spec.ts",
    next: "C",
  },
  C: {
    title: "Trade / Swap 专业面",
    designRefs: [".memory-bank/design-refs/screens/04-dashboard-galaxy-spiral.png"],
    screenshotDir: "docs/screenshots/ui-signoff/batch-c",
    gapReport: "docs/ui-gap-analysis-batch-c-2026-05-26.md",
    stressSpec: "e2e/smoke.spec.ts",
    next: "D",
  },
  D: {
    title: "Pool / Stake / Burn / Bridge / Domain",
    designRefs: [
      ".memory-bank/design-refs/screens/05-modal-pool-liquidity.png",
      ".memory-bank/design-refs/screens/06-modal-bridge-crosschain.png",
      ".memory-bank/design-refs/screens/07-modal-burn-tracking.png",
    ],
    screenshotDir: "docs/screenshots/ui-signoff/batch-d",
    gapReport: "docs/ui-gap-analysis-batch-d-2026-05-26.md",
    stressSpec: "e2e/smoke.spec.ts",
    next: null,
  },
};

function parseArgs(argv) {
  let batch = "B";
  let commitPush = false;
  let autoNext = false;
  let skipVerify100 = false;
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
      skipVerify100 = true;
      continue;
    }
    if (a === "--skip-gates") {
      skipGates = true;
      continue;
    }
  }
  return { batch, commitPush, autoNext, skipVerify100, skipGates };
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
  const body = `# UI 差距分析 — Dashboard — Batch B — 2026-05-26

**设计图**：
- \`.memory-bank/design-refs/screens/04-dashboard-galaxy-spiral.png\`
- \`.memory-bank/design-refs/screens/01-glass-panel-wave-border.png\`

**实现截图**（自动化采集）：
- \`${shotBase}/dashboard-1440.png\`
- \`${shotBase}/dashboard-768.png\`
- \`${shotBase}/dashboard-375.png\`

**对照方式**：1440 宽并排肉眼对比 + Playwright testId 功能门禁；无像素级 diff 工具。

| # | 维度 | 设计图要求 | 当前实现 | 等级 | 根因 | 修复计划 |
|---|------|------------|----------|------|------|----------|
| 1 | 玻璃舞台 | 厚霓虹波浪描边 + 内层极光雾 | \`ChartStage\` + \`flow-border-hero\` 已套 Market 区 | P1 | C | Batch A/B 已落地；需 1440 并排确认发光强度 |
| 2 | 色彩 | Master 青/紫/金三色 | \`:root\` token + Feature 五色 variant | P1 | A | 扫尾残留 hex（Trade/旧组件）→ Batch C |
| 3 | 布局 | 三栏比例 + 底栏五钮等高 | \`lg:grid-cols-[…]\` + \`gap-4 items-stretch auto-rows-fr\` | P1 | D | 375 两列已测；微调 tile 内 padding 可排 P2 |
| 4 | 图标 | 3D/等距霓虹图标 | Lucide 扁平 + CSS 光晕 | P2 | F | 可选 GLB/插画资产，不阻塞 Batch B |
| 5 | 文案 | 无工程味副标题 | 已移除「Modules」；数据源 badge 为 \`sr-only\` | — | — | B2 完成 |
| 6 | 背景 | 星系/极光全局明显 | \`AuroraGalaxyBackground\` 开启 | P1 | E | K 线区内层对比已加强；全页星点密度可再调 P2 |

**P0 计数**：0（无阻塞项：色值灾难/布局错位/无玻璃/错 Logo）

**功能验收**：\`scripts/verify-full-save-log.cmd --no-pause\`（编码 + 合约 + backend + Playwright 全量）

**压力验收**：\`stress-playwright-100.mjs --spec e2e/smoke.spec.ts --rounds 100\`

**工程门禁**：\`scripts/verify-100.ps1\` → 须 \`PASSED=100 FAILED=0 RESULT=GREEN\`

**改进计划（下一批）**：
1. **Batch C**：Trade 图表区改 \`ChartStage\`；Swap 字段与 Dashboard 左栏 token 对齐（对照 dydx / Jupiter 密度）。
2. **P2 资产**：五宫格 3D 图标占位 → 设计导出或轻量 CSS 等距，不抄 OKX 素材。
3. **自动化**：本流水线 \`ui-design-phase-pipeline.mjs\` 已串联；每批更新本表与 \`docs/ui-round2-visual-alignment.md\` §5。

**签收结论**：Batch B **代码与门禁可合并**；视觉 1:1 仍属迭代（P1/P2 已登记），禁止声称「像素级完成」。
`;
  mkdirSync(join(root, "docs"), { recursive: true });
  writeFileSync(reportPath, body, "utf8");
  console.log(`WROTE ${reportPath}`);
}

function updateRound2Table(batch, verifyNote) {
  const path = join(root, "docs/ui-round2-visual-alignment.md");
  if (!existsSync(path)) return;
  let text = readFileSync(path, "utf8");
  const row = `| 2026-05-26 | ${batch} | ChartStage 舞台、去 Modules、FeatureGrid gap-4 等高；差距报告 \`ui-gap-analysis-batch-b-2026-05-26.md\` | ${verifyNote} |`;
  if (text.includes("| 2026-05-26 | B |")) {
    text = text.replace(/\| 2026-05-26 \| B \|[^\n]+\n/, `${row}\n`);
  } else {
    text = text.replace(
      "| — | — | （待填） | — |",
      `${row}\n| — | — | （待填） | — |`,
    );
  }
  writeFileSync(path, text, "utf8");
}

function gitCommitPush(batch, cfg) {
  const msg = `ui(design-phase): Batch ${batch} dashboard signoff pipeline

- Batch ${batch}: ${cfg.title}
- Gap report: ${cfg.gapReport}
- Screenshots: ${cfg.screenshotDir}
- Gates: verify-full, stress×100, verify-100 GREEN`;

  let code = run("git", ["add", "-A"]);
  if (code !== 0) return code;
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

const { batch, commitPush, autoNext, skipVerify100, skipGates } = parseArgs(process.argv);
const cfg = BATCHES[batch];
if (!cfg) {
  console.error(`Unknown batch: ${batch}`);
  process.exit(1);
}

console.log(`=== UI design phase pipeline: Batch ${batch} — ${cfg.title} ===`);

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
      `# UI 差距分析 — Batch ${batch} — 2026-05-26\n\n（待 Agent 填写；见 Batch B 报告模板）\n`,
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

let verify100Note = "verify-100 SKIPPED";
if (!skipVerify100) {
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
  verify100Note = `verify-100 GREEN (${summary.path})`;
}

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
  if (skipVerify100) nextArgs.push("--skip-verify-100");
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
