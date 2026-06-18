#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const root = process.cwd();

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: root,
    stdio: "inherit",
    encoding: "utf8",
  });
  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

runGit(["config", "core.hooksPath", ".githooks"]);
runGit(["config", "--get", "core.hooksPath"]);
