#!/usr/bin/env node
/**
 * Autonomous work watchdog — detect stalled/stopped jobs and resume the work queue.
 *
 * Usage:
 *   node scripts/autonomous-work-watchdog.mjs --once
 *   node scripts/autonomous-work-watchdog.mjs --daemon --interval 90
 *   scripts\run-autonomous-work-watchdog.cmd
 */

import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const tempDir = process.env.TEMP || process.env.TMP || root;
const isWin = process.platform === "win32";
const shell = isWin;
const queuePath = join(root, ".memory-bank", "autonomous-work-queue.json");
const statePath = join(root, ".memory-bank", "autonomous-work-watchdog-state.json");
const logPath = join(root, ".memory-bank", "autonomous-work-watchdog.log");
const lockPath = join(tempDir, "ion-verify-100.lock");
const verifyStallMs = 25 * 60 * 1000;
const logStallMs = 15 * 60 * 1000;
const logDeadMs = 8 * 60 * 1000;

/** @type {{ daemon: boolean; once: boolean; chainDepth: number }} */
const runtime = { daemon: false, once: false, chainDepth: 0 };

function parseArgs(argv) {
  let once = false;
  let daemon = false;
  let intervalSec = 90;
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--once") once = true;
    if (a === "--daemon") daemon = true;
    if (a === "--interval" && argv[i + 1]) intervalSec = Number(argv[++i]);
  }
  if (!once && !daemon) once = true;
  return { once, daemon, intervalSec };
}

function log(line) {
  const row = `[${new Date().toISOString()}] ${line}`;
  console.log(row);
  mkdirSync(join(root, ".memory-bank"), { recursive: true });
  writeFileSync(logPath, `${row}\n`, { encoding: "utf8", flag: "a" });
}

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, data) {
  mkdirSync(join(root, ".memory-bank"), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function persistActiveQueue(active) {
  const queueDoc = readJson(queuePath, { queues: [] });
  const idx = queueDoc.queues?.findIndex((q) => q.id === active.id) ?? -1;
  if (idx < 0) return;
  queueDoc.queues[idx] = active;
  writeJson(queuePath, queueDoc);
}

function scheduleChainTick(state, active, reason) {
  if (!runtime.daemon && !runtime.once) return;
  if (runtime.chainDepth >= 10) {
    log(`CHAIN skip (max depth): ${reason}`);
    return;
  }
  setImmediate(() => {
    runtime.chainDepth += 1;
    log(`CHAIN tick: ${reason} (depth=${runtime.chainDepth})`);
    const result = tick(state);
    runtime.chainDepth -= 1;
    if (result.allDone) {
      log("QUEUE complete (chain)");
      if (runtime.once && runtime.chainDepth <= 0) process.exit(0);
    }
  });
}

function isAlive(pid) {
  if (!pid || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function latestVerify100Summary() {
  try {
    const files = readdirSync(tempDir)
      .filter((f) => f.startsWith("ion-verify-100-summary-") && f.endsWith(".txt"))
      .map((f) => ({ f, mtime: statSync(join(tempDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    if (!files[0]) return { path: "", text: "", mtimeMs: 0 };
    const path = join(tempDir, files[0].f);
    return { path, text: readFileSync(path, "utf8"), mtimeMs: files[0].mtime };
  } catch {
    return { path: "", text: "", mtimeMs: 0 };
  }
}

function isVerify100Green(text) {
  return (
    text.includes("RESULT=GREEN") &&
    /PASSED=100/.test(text) &&
    /FAILED=0/.test(text)
  );
}

function queueActivatedAtMs(queue) {
  const raw = queue?.activatedAt;
  if (!raw) return 0;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : 0;
}

function isFreshVerify100Green(summary, activatedAtMs) {
  if (!isVerify100Green(summary.text)) return false;
  if (activatedAtMs <= 0) return true;
  return summary.mtimeMs >= activatedAtMs - 60_000;
}

function verifyLogPath(summaryText, summaryPath = "") {
  const m = summaryText.match(/LOG=(.+)/m);
  if (m?.[1]) return m[1].trim();
  const stamp = (summaryPath || summaryText).match(/ion-verify-100-summary-(\d{8}-\d{6})/);
  if (stamp?.[1]) return join(tempDir, `ion-verify-100-${stamp[1]}.log`);
  return "";
}

function bestRunAfterActivation(activatedAtMs) {
  try {
    const files = readdirSync(tempDir)
      .filter((f) => f.startsWith("ion-verify-100-summary-") && f.endsWith(".txt"))
      .map((f) => {
        const path = join(tempDir, f);
        return { path, text: readFileSync(path, "utf8"), mtimeMs: statSync(path).mtimeMs };
      })
      .filter((s) => activatedAtMs <= 0 || s.mtimeMs >= activatedAtMs - 60_000)
      .sort((a, b) => b.mtimeMs - a.mtimeMs);
    return files[0] ?? latestVerify100Summary();
  } catch {
    return latestVerify100Summary();
  }
}

function parseVerify100Progress(summaryText) {
  let maxPass = 0;
  for (const line of summaryText.split(/\r?\n/)) {
    const m = line.match(/^PASS (\d+) OK$/);
    if (m) maxPass = Math.max(maxPass, Number(m[1]));
  }
  return { initialPassed: maxPass, startAt: maxPass > 0 ? maxPass + 1 : 1 };
}

function isLogFresh(path, maxAgeMs) {
  if (!path || !existsSync(path)) return false;
  return Date.now() - statSync(path).mtimeMs < maxAgeMs;
}

function isVerify100ExternallyActive(activatedAtMs = 0) {
  if (!existsSync(lockPath)) return false;
  const summary = bestRunAfterActivation(activatedAtMs);
  if (isFreshVerify100Green(summary, activatedAtMs)) return false;
  const vLog = verifyLogPath(summary.text, summary.path);
  if (isLogFresh(vLog, logStallMs)) return true;
  return false;
}

function clearStaleVerifyLock(force = false) {
  if (!existsSync(lockPath)) return false;
  if (!force && isVerify100ExternallyActive()) return false;
  try {
    unlinkSync(lockPath);
    log("Removed stale or orphaned verify-100 lock");
    return true;
  } catch {
    return false;
  }
}

function prepareVerify100Resume(step, queue) {
  const activatedAtMs = queueActivatedAtMs(queue);
  const summary = bestRunAfterActivation(activatedAtMs);
  const vLog = verifyLogPath(summary.text, summary.path);
  const progress = parseVerify100Progress(summary.text);
  if (progress.initialPassed <= 0 || progress.initialPassed >= 100) return false;
  if (isVerify100ExternallyActive(activatedAtMs)) return false;
  clearStaleVerifyLock(true);
  step.status = "pending";
  step.external = false;
  step.managedPid = undefined;
  step.resume = {
    startAt: progress.startAt,
    initialPassed: progress.initialPassed,
    summaryPath: summary.path,
    logPath: vLog,
  };
  step.error = `interrupted at ${progress.initialPassed}/100; auto-resume from ${progress.startAt}`;
  log(
    `REQUEUE verify-100 resume startAt=${progress.startAt} initialPassed=${progress.initialPassed}`,
  );
  return true;
}

function syncVerify100Step(step, queue, state) {
  const activatedAtMs = queueActivatedAtMs(queue);
  const summary = bestRunAfterActivation(activatedAtMs);
  if (isFreshVerify100Green(summary, activatedAtMs)) {
    const wasDone = step.status === "completed";
    step.status = "completed";
    step.completedAt = step.completedAt ?? new Date().toISOString();
    step.summaryPath = summary.path;
    step.external = false;
    step.managedPid = undefined;
    if (!wasDone) {
      log("DETECT verify-100 GREEN — auto-advance");
      persistActiveQueue(queue);
      scheduleChainTick(state, queue, "verify-100-green-sync");
    }
    return;
  }
  if (step.status === "failed") {
    if (!prepareVerify100Resume(step, queue)) {
      step.status = "pending";
      step.external = false;
      step.managedPid = undefined;
      step.error = undefined;
      log("REQUEUE verify-100 from failed -> pending");
    }
    return;
  }
  if (step.status === "running" && step.managedPid && !isAlive(step.managedPid)) {
    prepareVerify100Resume(step, queue);
    return;
  }
  if (step.allowExternal && isVerify100ExternallyActive(activatedAtMs)) {
    step.status = "running";
    step.external = true;
    return;
  }
  if (
    step.status === "running" &&
    !step.managedPid &&
    step.allowExternal &&
    !isVerify100ExternallyActive(activatedAtMs)
  ) {
    const vLog = verifyLogPath(summary.text, summary.path);
    const logStale = vLog && existsSync(vLog) && !isLogFresh(vLog, logDeadMs);
    const lockOrphan = existsSync(lockPath);
    if (lockOrphan || logStale) {
      prepareVerify100Resume(step, queue);
      return;
    }
    step.status = "pending";
    step.external = false;
  }
  if (step.status === "running" && !step.managedPid && !step.allowExternal) {
    step.status = "pending";
  }
}

function runGitCommitPushStep(step, queue, state) {
  const activatedAtMs = queueActivatedAtMs(queue);
  const sinceArg =
    activatedAtMs > 0 ? ["--since", new Date(activatedAtMs).toISOString()] : [];
  const batch = step.batch ?? "B";
  log(`START step=${step.id} git commit+push batch=${batch}`);
  const child = spawn(
    process.execPath,
    [join(root, "scripts/autonomous-git-commit-push.mjs"), "--batch", batch, ...sinceArg],
    {
      cwd: root,
      shell: false,
      stdio: "inherit",
      env: {
        ...process.env,
        ION_VERIFY_NONINTERACTIVE: "1",
        ION_AGENT_AUTONOMOUS: "1",
        ION_WORKFLOW_QUEUE_ID: queue.id,
        ION_WORKFLOW_STEP_ID: step.id,
        ION_WORKFLOW_STAGE: step.title ?? step.id,
        ION_WORKFLOW_ACTIVATED_AT: queue.activatedAt ?? "",
      },
    },
  );
  step.status = "running";
  step.managedPid = child.pid;
  step.startedAt = new Date().toISOString();
  child.on("exit", (code) => {
    if (code === 0) {
      step.status = "completed";
      step.completedAt = new Date().toISOString();
      log(`DONE step=${step.id} commit+push OK`);
      persistActiveQueue(queue);
      scheduleChainTick(state, queue, `${step.id}-ok`);
    } else {
      step.status = "failed";
      step.error = `git-commit-push exit ${code}`;
      log(`FAIL step=${step.id} exit=${code}`);
      persistActiveQueue(queue);
    }
    step.managedPid = undefined;
  });
  return child;
}

function allRequiredDone(queue, step) {
  const requires = step.requires ?? [];
  return requires.every((id) => {
    const dep = queue.steps.find((s) => s.id === id);
    return dep?.status === "completed";
  });
}

function spawnStep(step, queue, state) {
  const cmd = step.command;
  if (!cmd) {
    step.status = "failed";
    step.error = "missing command";
    return null;
  }
  log(`START step=${step.id} cmd=${cmd}`);
  const child = spawn(cmd, {
    cwd: root,
    shell,
    stdio: "inherit",
    env: {
      ...process.env,
      ION_VERIFY_NONINTERACTIVE: "1",
      ION_AGENT_AUTONOMOUS: "1",
    },
  });
  step.status = "running";
  step.managedPid = child.pid;
  step.startedAt = new Date().toISOString();
  step.external = false;
  child.on("exit", (code) => {
    if (code === 0) {
      step.status = "completed";
      step.completedAt = new Date().toISOString();
      log(`DONE step=${step.id} exit=0`);
      persistActiveQueue(queue);
      scheduleChainTick(state, queue, `${step.id}-ok`);
    } else {
      step.status = "failed";
      step.error = `exit ${code}`;
      log(`FAIL step=${step.id} exit=${code}`);
      persistActiveQueue(queue);
    }
    step.managedPid = undefined;
  });
  return child;
}

function runVerify100Step(step, queue, state) {
  const activatedAtMs = queueActivatedAtMs(queue);
  const summary = latestVerify100Summary();
  if (isFreshVerify100Green(summary, activatedAtMs)) {
    step.status = "completed";
    step.summaryPath = summary.path;
    return null;
  }
  if (isVerify100ExternallyActive(activatedAtMs)) {
    step.status = "running";
    step.external = true;
    log(`WAIT step=verify-100 external run active (lock + fresh log)`);
    return null;
  }
  clearStaleVerifyLock();
  if (existsSync(lockPath)) {
    step.status = "running";
    step.external = true;
    log("WAIT step=verify-100 lock held by another process");
    return null;
  }
  const ps = join(
    process.env.SystemRoot || "C:\\Windows",
    "System32",
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe",
  );
  const psArgs = [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    join(root, "scripts", "verify-100.ps1"),
  ];
  if (step.resume?.startAt) {
    psArgs.push(
      "-StartAt",
      String(step.resume.startAt),
      "-InitialPassed",
      String(step.resume.initialPassed ?? 0),
    );
    if (step.resume.summaryPath) {
      psArgs.push("-ResumeSummary", step.resume.summaryPath);
    }
    if (step.resume.logPath) {
      psArgs.push("-ResumeLog", step.resume.logPath);
    }
    log(
      `START step=verify-100 RESUME from ${step.resume.startAt} (passed=${step.resume.initialPassed})`,
    );
  } else {
    log("START step=verify-100 (spawn verify-100.ps1)");
  }
  const child = spawn(
    ps,
    psArgs,
    {
      cwd: root,
      shell: false,
      stdio: "inherit",
      env: {
        ...process.env,
        ION_VERIFY_NONINTERACTIVE: "1",
        ION_AGENT_AUTONOMOUS: "1",
        ION_WORKFLOW_QUEUE_ID: queue.id,
        ION_WORKFLOW_STEP_ID: step.id,
        ION_WORKFLOW_STAGE: step.title ?? step.id,
        ION_WORKFLOW_ACTIVATED_AT: queue.activatedAt ?? "",
      },
    },
  );
  step.status = "running";
  step.managedPid = child.pid;
  step.external = false;
  child.on("exit", (code) => {
    const summary = latestVerify100Summary();
    if (code === 0 && isFreshVerify100Green(summary, activatedAtMs)) {
      step.status = "completed";
      step.summaryPath = summary.path;
      log("DONE step=verify-100 GREEN — auto-advance commit+push");
      persistActiveQueue(queue);
      scheduleChainTick(state, queue, "verify-100-green");
    } else if (code === 2) {
      step.status = "running";
      step.external = true;
      log("WAIT step=verify-100 exit=2 (duplicate lock)");
      persistActiveQueue(queue);
    } else {
      step.status = "failed";
      step.error = `verify-100 exit ${code}`;
      log(`FAIL step=verify-100 exit=${code}`);
      persistActiveQueue(queue);
    }
    step.managedPid = undefined;
  });
  return child;
}

function runVerifyFullStep(step) {
  if (step.status === "completed") return null;
  const cmd = join(
    process.env.SystemRoot || "C:\\Windows",
    "System32",
    "cmd.exe",
  );
  const result = spawnSync(cmd, ["/d", "/c", "scripts\\verify-full-save-log.cmd", "--no-pause"], {
    cwd: root,
    stdio: "inherit",
    shell: false,
    env: { ...process.env, ION_VERIFY_NONINTERACTIVE: "1", ION_AGENT_AUTONOMOUS: "1" },
  });
  const code = result.status ?? 1;
  if (code === 0) {
    step.status = "completed";
    step.error = undefined;
    log("DONE step=verify-full");
  } else {
    step.status = "failed";
    step.error = `verify-full exit ${code}`;
    log(`FAIL step=verify-full exit=${code}`);
  }
  return null;
}

function tick(state) {
  const queueDoc = readJson(queuePath, { queues: [] });
  const active = queueDoc.queues?.find((q) => q.status === "active");
  if (!active) {
    log("No active queue");
    return { allDone: true };
  }

  let managedRunning = false;
  for (const step of active.steps) {
    if (step.kind === "verify-100") syncVerify100Step(step, active, state);
    if (step.status === "running" && step.managedPid) {
      if (isAlive(step.managedPid)) managedRunning = true;
      else if (step.kind === "verify-100") {
        prepareVerify100Resume(step, active);
      } else {
        step.status = "failed";
        step.error = "process died";
      }
    }
  }

  if (!managedRunning) {
    for (const step of active.steps) {
      if (step.kind === "git-commit-push" && step.status === "failed" && allRequiredDone(active, step)) {
        step.status = "pending";
        step.error = undefined;
        log(`REQUEUE step=${step.id} failed git-commit-push -> pending`);
      }
      if (step.status !== "pending") continue;
      if (!allRequiredDone(active, step)) continue;

      if (step.kind === "verify-100") {
        runVerify100Step(step, active, state);
        managedRunning = Boolean(step.managedPid);
        break;
      }
      if (step.kind === "git-commit-push") {
        runGitCommitPushStep(step, active, state);
        managedRunning = true;
        break;
      }
      if (step.kind === "verify-full") {
        runVerifyFullStep(step);
        break;
      }
      if (step.kind === "shell") {
        spawnStep(step, active, state);
        managedRunning = true;
        break;
      }
    }
  }

  const pending = active.steps.filter((s) => s.status === "pending" || s.status === "running");
  const failed = active.steps.filter((s) => s.status === "failed");
  if (pending.length === 0 && failed.length === 0) {
    active.status = "completed";
    log(`QUEUE complete: ${active.id}`);
  }

  state.lastTickAt = new Date().toISOString();
  state.activeQueueId = active.id;
  state.steps = active.steps.map((s) => ({
    id: s.id,
    status: s.status,
    external: s.external,
    managedPid: s.managedPid,
    error: s.error,
  }));
  writeJson(queuePath, queueDoc);
  writeJson(statePath, state);

  return { allDone: active.status === "completed", failed: failed.length, pending: pending.length };
}

async function main() {
  const { once, daemon, intervalSec } = parseArgs(process.argv);
  runtime.once = once;
  runtime.daemon = daemon;
  const state = readJson(statePath, { lastTickAt: null, steps: [] });
  log(`watchdog ${once ? "once" : `daemon interval=${intervalSec}s`} (auto-advance on step OK)`);

  do {
    const result = tick(state);
    if (result.allDone) {
      log("All active queue steps finished.");
      process.exit(0);
    }
    if (once) break;
    await new Promise((r) => setTimeout(r, intervalSec * 1000));
  } while (true);
}

main().catch((err) => {
  log(`FATAL ${err.message}`);
  process.exit(1);
});
