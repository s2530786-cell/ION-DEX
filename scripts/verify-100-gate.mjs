#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const tempDir = process.env.TEMP || process.env.TMP || root;
const ignoredWorkspacePaths = new Set([
  ".memory-bank/autonomous-work-queue.json",
  ".memory-bank/autonomous-work-watchdog-state.json",
  ".memory-bank/autonomous-work-watchdog.log",
]);

function runGit(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: options.cwd ?? root,
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
  });
  if ((result.status ?? 1) !== 0) {
    const detail = `${result.stdout || ""}${result.stderr || ""}`.trim();
    throw new Error(`git ${args.join(" ")} failed${detail ? `: ${detail}` : ""}`);
  }
  return (result.stdout || "").trim();
}

function tryGit(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: options.cwd ?? root,
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
  });
  return {
    ok: (result.status ?? 1) === 0,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    status: result.status ?? 1,
  };
}

function ensureGateDir() {
  const gitDir = runGit(["rev-parse", "--git-dir"]);
  const gateDir = resolve(root, gitDir, "ion-verify-gates");
  mkdirSync(gateDir, { recursive: true });
  mkdirSync(join(gateDir, "history"), { recursive: true });
  return gateDir;
}

function sha256(input) {
  return createHash("sha256").update(input).digest("hex");
}

function sha256File(path) {
  return sha256(readFileSync(path));
}

function latestSummaryPath() {
  const files = readdirSync(tempDir)
    .filter((name) => name.startsWith("ion-verify-100-summary-") && name.endsWith(".txt"))
    .map((name) => {
      const path = join(tempDir, name);
      return { path, mtimeMs: statSync(path).mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  return files[0]?.path ?? "";
}

function parseSummaryText(text) {
  const passed = Number((text.match(/PASSED=(\d+)/) || [])[1] || 0);
  const failed = Number((text.match(/FAILED=(\d+)/) || [])[1] || 0);
  const result = (text.match(/RESULT=(GREEN|FAILED)/) || [])[1] || "UNKNOWN";
  return { passed, failed, result };
}

function assertGreenSummary(path) {
  if (!path || !existsSync(path)) {
    throw new Error("verify-100 summary missing. Run scripts/verify-100.ps1 first.");
  }
  const text = readFileSync(path, "utf8");
  const parsed = parseSummaryText(text);
  if (parsed.result !== "GREEN" || parsed.passed < 100 || parsed.failed !== 0) {
    throw new Error(`verify-100 summary is not GREEN: ${path}`);
  }
  return { text, parsed };
}

function currentHead() {
  const result = tryGit(["rev-parse", "HEAD"]);
  if (!result.ok) return "NO_HEAD";
  return result.stdout.trim();
}

function currentBranch() {
  const result = tryGit(["rev-parse", "--abbrev-ref", "HEAD"]);
  if (!result.ok) return "DETACHED";
  return result.stdout.trim();
}

function splitLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeRepoPath(path) {
  return path.replace(/\\/g, "/").replace(/^\.\/+/, "").replace(/\/+$/, "");
}

function isIgnoredWorkspacePath(path) {
  return ignoredWorkspacePaths.has(normalizeRepoPath(path));
}

function workspaceEntries() {
  const tracked = splitLines(tryGit(["diff", "--name-only", "--relative", "HEAD", "--"]).stdout);
  const untracked = splitLines(
    tryGit(["ls-files", "--others", "--exclude-standard"]).stdout,
  );
  const paths = [...new Set([...tracked, ...untracked])]
    .map(normalizeRepoPath)
    .filter((path) => !isIgnoredWorkspacePath(path))
    .sort();
  return paths.map((path) => {
    const abs = join(root, path);
    const kind = untracked.includes(path) ? "untracked" : "tracked";
    const digest = existsSync(abs) ? sha256(readFileSync(abs)) : "DELETED";
    return { path, kind, digest };
  });
}

function workspaceSnapshot() {
  const entries = workspaceEntries();
  const payload = JSON.stringify(entries);
  return {
    entries,
    hash: sha256(payload),
    changedPaths: entries.map((entry) => entry.path),
  };
}

function latestProofPath(gateDir) {
  return join(gateDir, "verify-100-latest.json");
}

function pendingCommitPath(gateDir) {
  return join(gateDir, "pending-commit.json");
}

function ledgerPath(gateDir) {
  return join(gateDir, "commit-ledger.json");
}

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function parseFlagValues(argv) {
  const values = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--") && argv[i + 1] && !argv[i + 1].startsWith("--")) {
      values[arg.slice(2)] = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg.startsWith("--") && arg.includes("=")) {
      const [key, value] = arg.slice(2).split(/=(.*)/s);
      values[key] = value;
    }
  }
  return values;
}

function commitProofIdFromMessage(message) {
  return (message.match(/^Verify-100-Proof:\s*(\S+)$/m) || [])[1] || "";
}

function normalizeCommitMessage(text) {
  return text.endsWith("\n") ? text : `${text}\n`;
}

function recordProof(argv) {
  const flags = parseFlagValues(argv);
  const gateDir = ensureGateDir();
  const summaryPath = flags.summary ? resolve(root, flags.summary) : latestSummaryPath();
  const { text, parsed } = assertGreenSummary(summaryPath);
  const snapshot = workspaceSnapshot();
  const createdAt = new Date().toISOString();
  const proofId = `verify100-${createdAt.replace(/[-:.TZ]/g, "").slice(0, 14)}-${sha256(
    text,
  ).slice(0, 8)}`;
  const activatedAt = flags["activated-at"] || process.env.ION_WORKFLOW_ACTIVATED_AT || "";
  const proof = {
    schema: 1,
    id: proofId,
    createdAt,
    type: "verify-100",
    stage: flags.stage || process.env.ION_WORKFLOW_STAGE || "",
    queueId: flags.queue || process.env.ION_WORKFLOW_QUEUE_ID || "",
    stepId: flags.step || process.env.ION_WORKFLOW_STEP_ID || "",
    activatedAt,
    note: flags.note || "",
    summary: {
      path: summaryPath,
      sha256: sha256(text),
      mtimeMs: statSync(summaryPath).mtimeMs,
      passed: parsed.passed,
      failed: parsed.failed,
      result: parsed.result,
    },
    git: {
      head: currentHead(),
      branch: currentBranch(),
      workspaceHash: snapshot.hash,
      changedPaths: snapshot.changedPaths,
      changedCount: snapshot.changedPaths.length,
    },
  };
  const latestPath = latestProofPath(gateDir);
  writeJson(latestPath, proof);
  writeJson(join(gateDir, "history", `${proof.id}.json`), proof);
  console.log(`VERIFY_100_PROOF=${latestPath}`);
  console.log(`VERIFY_100_PROOF_ID=${proof.id}`);
}

function readLatestProofOrThrow(gateDir) {
  const path = latestProofPath(gateDir);
  if (!existsSync(path)) {
    throw new Error("verify-100 proof missing. Run scripts/verify-100.ps1 and wait for RESULT=GREEN.");
  }
  const proof = readJson(path, null);
  if (!proof) {
    throw new Error("verify-100 proof is unreadable.");
  }
  return { path, proof };
}

function assertProofSummaryStillGreen(proof) {
  const { text, parsed } = assertGreenSummary(proof.summary.path);
  const currentSummarySha = sha256(text);
  if (currentSummarySha !== proof.summary.sha256) {
    throw new Error("verify-100 summary changed after proof was recorded.");
  }
  if (parsed.result !== "GREEN" || parsed.passed < 100 || parsed.failed !== 0) {
    throw new Error("verify-100 proof summary is no longer GREEN.");
  }
}

function assertCommit(argv) {
  const flags = parseFlagValues(argv);
  const gateDir = ensureGateDir();
  const { path: proofPath, proof } = readLatestProofOrThrow(gateDir);
  assertProofSummaryStillGreen(proof);

  const currentHeadSha = currentHead();
  if (proof.git.head !== currentHeadSha) {
    throw new Error(
      `HEAD changed after verify-100 proof. proof=${proof.git.head} current=${currentHeadSha}`,
    );
  }

  const since = flags.since || proof.activatedAt;
  if (since) {
    const sinceMs = Date.parse(since);
    if (Number.isFinite(sinceMs) && proof.summary.mtimeMs < sinceMs - 60_000) {
      throw new Error("verify-100 proof is older than the current workflow activation.");
    }
  }

  const snapshot = workspaceSnapshot();
  if (snapshot.hash !== proof.git.workspaceHash) {
    throw new Error("Working tree changed after verify-100 GREEN. Re-run verify-100 before commit.");
  }

  const staged = splitLines(
    tryGit(["diff", "--cached", "--name-only", "--relative", "--diff-filter=ACDMRTUXB"]).stdout,
  );
  if (staged.length === 0) {
    throw new Error("No staged changes found. Stage the current stage files before commit.");
  }

  writeJson(pendingCommitPath(gateDir), {
    schema: 1,
    proofId: proof.id,
    proofPath,
    headBeforeCommit: currentHeadSha,
    branch: currentBranch(),
    validatedAt: new Date().toISOString(),
  });
  console.log(`VERIFY_100_COMMIT_READY=${proof.id}`);
}

function updateCommitMessage(argv) {
  const messageFile = argv[0];
  if (!messageFile) return;
  const gateDir = ensureGateDir();
  const pending = readJson(pendingCommitPath(gateDir), null);
  if (!pending) return;
  const proof = readJson(pending.proofPath, null);
  if (!proof) return;

  const absPath = isAbsolute(messageFile) ? messageFile : resolve(root, messageFile);
  let body = existsSync(absPath) ? readFileSync(absPath, "utf8") : "";
  body = normalizeCommitMessage(body);

  const trailer = `Verify-100-Proof: ${proof.id}`;
  if (/^Verify-100-Proof:\s*\S+$/m.test(body)) {
    body = body.replace(/^Verify-100-Proof:\s*\S+$/m, trailer);
  } else {
    body = `${body.trimEnd()}\n\n${trailer}\n`;
  }

  writeFileSync(absPath, body, "utf8");
  console.log(`VERIFY_100_COMMIT_MSG=${proof.id}`);
}

function finalizeCommit() {
  const gateDir = ensureGateDir();
  const pendingPath = pendingCommitPath(gateDir);
  const pending = readJson(pendingPath, null);
  if (!pending) return;

  const commitSha = currentHead();
  const message = runGit(["show", "-s", "--format=%B", commitSha]);
  const proofId = commitProofIdFromMessage(message);
  if (!proofId || proofId !== pending.proofId) {
    rmSync(pendingPath, { force: true });
    throw new Error("Committed HEAD is missing the Verify-100-Proof trailer.");
  }

  const parent = tryGit(["rev-parse", `${commitSha}^`]);
  const parentSha = parent.ok ? parent.stdout.trim() : "NO_HEAD";
  if (pending.headBeforeCommit !== parentSha) {
    rmSync(pendingPath, { force: true });
    throw new Error(
      `Commit parent mismatch for verify proof. expected=${pending.headBeforeCommit} actual=${parentSha}`,
    );
  }

  const entries = readJson(ledgerPath(gateDir), []);
  const next = entries.filter((entry) => entry.commitSha !== commitSha);
  next.push({
    schema: 1,
    proofId,
    commitSha,
    parentSha,
    branch: currentBranch(),
    recordedAt: new Date().toISOString(),
  });
  writeJson(ledgerPath(gateDir), next.slice(-200));
  rmSync(pendingPath, { force: true });
  console.log(`VERIFY_100_COMMIT_RECORDED=${commitSha}`);
}

function commitsFromPushStdin(stdinText) {
  const commits = [];
  const lines = splitLines(stdinText);
  for (const line of lines) {
    const parts = line.split(/\s+/).filter(Boolean);
    if (parts.length < 4) continue;
    const [, localSha, , remoteSha] = parts;
    if (!localSha || /^0+$/.test(localSha)) continue;
    let rangeArgs;
    if (!remoteSha || /^0+$/.test(remoteSha)) {
      rangeArgs = ["rev-list", "--reverse", localSha, "--not", "--remotes"];
    } else {
      rangeArgs = ["rev-list", "--reverse", `${remoteSha}..${localSha}`];
    }
    const out = tryGit(rangeArgs);
    if (!out.ok) continue;
    commits.push(...splitLines(out.stdout));
  }
  return [...new Set(commits)];
}

function fallbackCommitsToPush() {
  const upstream = tryGit(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"]);
  if (upstream.ok) {
    return splitLines(tryGit(["rev-list", "--reverse", `${upstream.stdout.trim()}..HEAD`]).stdout);
  }
  const head = currentHead();
  return head === "NO_HEAD" ? [] : [head];
}

function assertPush() {
  const gateDir = ensureGateDir();
  const stdinText = readFileSync(0, "utf8");
  const commits = commitsFromPushStdin(stdinText);
  const toCheck = commits.length > 0 ? commits : fallbackCommitsToPush();
  if (toCheck.length === 0) return;

  const ledger = readJson(ledgerPath(gateDir), []);
  for (const commitSha of toCheck) {
    const message = runGit(["show", "-s", "--format=%B", commitSha]);
    const proofId = commitProofIdFromMessage(message);
    if (!proofId) {
      throw new Error(
        `Push blocked: commit ${commitSha.slice(0, 12)} is missing Verify-100-Proof trailer.`,
      );
    }
    const found = ledger.find(
      (entry) => entry.commitSha === commitSha && entry.proofId === proofId,
    );
    if (!found) {
      throw new Error(
        `Push blocked: commit ${commitSha.slice(0, 12)} has no local verify-100 commit record.`,
      );
    }
  }
  console.log(`VERIFY_100_PUSH_READY=${toCheck.length}`);
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  switch (command) {
    case "record":
      recordProof(rest);
      return;
    case "assert-commit":
      assertCommit(rest);
      return;
    case "commit-msg":
      updateCommitMessage(rest);
      return;
    case "post-commit":
      finalizeCommit();
      return;
    case "assert-push":
      assertPush();
      return;
    default:
      throw new Error(
        "Usage: node scripts/verify-100-gate.mjs <record|assert-commit|commit-msg|post-commit|assert-push>",
      );
  }
}

try {
  main();
} catch (error) {
  console.error(`[verify-100-gate] ${error.message}`);
  process.exit(1);
}
