#!/usr/bin/env node
/**
 * Resolve ion-private-core root (closed-source).
 * UTF-8 without BOM.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

export function getPrivateCoreRoot(cwd = process.cwd()) {
  const env = process.env.ION_PRIVATE_CORE_ROOT?.trim();
  if (env && existsSync(env)) return env;

  const candidates = [
    "d:\\openclaw-tools\\ion-private-core",
    join(cwd, "..", "ion-private-core"),
    join(cwd, "ion-private-core"),
  ];
  for (const p of candidates) {
    if (existsSync(join(p, ".git")) || existsSync(join(p, ".cursor", "skills"))) {
      return p;
    }
  }
  return null;
}

/** Catalog + runs live ONLY in private core when available. */
export function githubDailyDir(cwd = process.cwd()) {
  const priv = getPrivateCoreRoot(cwd);
  if (priv) return join(priv, ".memory-bank", "github-daily");
  return join(cwd, ".memory-bank", "github-daily");
}

export function privateSkillsRoot(cwd = process.cwd()) {
  const priv = getPrivateCoreRoot(cwd);
  return priv ? join(priv, ".cursor", "skills") : null;
}

export function requirePrivateCore(cwd = process.cwd()) {
  const priv = getPrivateCoreRoot(cwd);
  if (!priv) {
    throw new Error(
      "ion-private-core not found. Clone https://github.com/s2530786-cell/ion-private-core and set ION_PRIVATE_CORE_ROOT.",
    );
  }
  return priv;
}
