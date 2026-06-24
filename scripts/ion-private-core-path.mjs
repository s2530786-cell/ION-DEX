#!/usr/bin/env node
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

function firstExisting(paths) {
  return paths.find((path) => path && existsSync(path)) ?? null;
}

function workspaceParent(cwd) {
  return dirname(resolve(cwd));
}

export function getPrivateCoreRoot(cwd = process.cwd()) {
  const envPath = process.env.ION_PRIVATE_CORE_ROOT || process.env.ION_PRIVATE_CORE;
  return firstExisting([
    envPath ? resolve(envPath) : null,
    join(resolve(cwd), "ion-private-core"),
    join(workspaceParent(cwd), "ion-private-core"),
    "d:\\ion-private-core",
    "d:\\openclaw-tools\\ion-private-core",
  ]);
}

export function privateSkillsRoot(cwd = process.cwd()) {
  return firstExisting([
    join(resolve(cwd), ".cursor", "skills-private"),
    getPrivateCoreRoot(cwd) ? join(getPrivateCoreRoot(cwd), ".cursor", "skills") : null,
  ]);
}

export function githubDailyDir(cwd = process.cwd()) {
  const privateRoot = getPrivateCoreRoot(cwd);
  return firstExisting([
    privateRoot ? join(privateRoot, ".memory-bank", "github-daily") : null,
    join(resolve(cwd), ".memory-bank", "github-daily"),
  ]) ?? join(resolve(cwd), ".memory-bank", "github-daily");
}

export function aiCivilizationKernelDir(cwd = process.cwd()) {
  const privateRoot = getPrivateCoreRoot(cwd);
  return firstExisting([
    privateRoot ? join(privateRoot, ".memory-bank", "ai-civilization-kernel") : null,
    join(resolve(cwd), ".cursor", "skills-private", "ion-ai-civilization-kernel"),
  ]);
}
