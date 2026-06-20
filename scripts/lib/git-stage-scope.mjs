import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function runGit(root, args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: options.stdio ?? "pipe",
  });
  if ((result.status ?? 1) !== 0) {
    const detail = `${result.stdout || ""}${result.stderr || ""}`.trim();
    throw new Error(`git ${args.join(" ")} failed${detail ? `: ${detail}` : ""}`);
  }
  return (result.stdout || "").trim();
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

function isWithinAllowed(path, allowedPaths) {
  const normalized = normalizeRepoPath(path);
  return allowedPaths.some((allowed) => {
    const scope = normalizeRepoPath(allowed);
    return normalized === scope || normalized.startsWith(`${scope}/`);
  });
}

function isIgnoredGeneratedPath(path) {
  return normalizeRepoPath(path).endsWith(".tsbuildinfo");
}

export function stagePaths(root, paths) {
  if (!Array.isArray(paths) || paths.length === 0) {
    throw new Error("No stage paths configured for this workflow step.");
  }
  runGit(root, ["add", "--", ...paths]);
}

export function assertStageScope(root, paths) {
  if (!Array.isArray(paths) || paths.length === 0) {
    throw new Error("No stage paths configured for this workflow step.");
  }
  const allowed = paths.map(normalizeRepoPath);
  const staged = splitLines(
    runGit(root, ["diff", "--cached", "--name-only", "--relative", "--diff-filter=ACDMRTUXB"]),
  );
  if (staged.length === 0) {
    throw new Error("No staged files found for the current workflow step.");
  }

  const outside = staged.filter((path) => !isWithinAllowed(path, allowed));
  if (outside.length > 0) {
    throw new Error(
      `Staged paths escape the current workflow scope: ${outside.slice(0, 8).join(", ")}`,
    );
  }

  const unstagedWithin = splitLines(
    runGit(root, ["diff", "--name-only", "--relative", "--diff-filter=ACDMRTUXB", "--", ...paths]),
  );
  const untrackedWithin = splitLines(
    runGit(root, ["ls-files", "--others", "--exclude-standard", "--", ...paths]),
  );
  const missingStage = [...new Set([...unstagedWithin, ...untrackedWithin])]
    .filter((path) => !isIgnoredGeneratedPath(path))
    .filter((path) => isWithinAllowed(path, allowed))
    .filter((path) => !staged.includes(path))
    .filter((path) => existsSync(join(root, path)) || true);

  if (missingStage.length > 0) {
    throw new Error(
      `Workflow scope still has unstaged changes: ${missingStage.slice(0, 8).join(", ")}`,
    );
  }

  return staged;
}
