#!/usr/bin/env node
/**
 * Copy GitHub daily artifacts into ion-private-core (if not already there).
 * UTF-8 without BOM.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getPrivateCoreRoot, githubDailyDir } from "./ion-private-core-path.mjs";

const root = process.cwd();
const priv = getPrivateCoreRoot(root);
if (!priv) {
  console.error("ion-private-core not found");
  process.exit(1);
}

const pubDaily = join(root, ".memory-bank", "github-daily");
const privDaily = githubDailyDir(root);
const pubStubs = join(root, ".cursor", "skills", "github-discovered");
const privStubs = join(priv, ".cursor", "skills", "github-discovered");

function copyIfExists(src, dest) {
  if (!existsSync(src)) return false;
  mkdirSync(join(dest, ".."), { recursive: true });
  cpSync(src, dest, { recursive: true, force: true });
  return true;
}

mkdirSync(privDaily, { recursive: true });
mkdirSync(privStubs, { recursive: true });

// Catalog data lives ONLY in ion-private-core — never overwrite private from public.
for (const name of ["installed.json"]) {
  const src = join(pubDaily, name);
  const dest = join(privDaily, name);
  if (copyIfExists(src, dest)) console.log(`Copied ${name} -> private`);
}

if (existsSync(join(pubDaily, "runs"))) {
  copyIfExists(join(pubDaily, "runs"), join(privDaily, "runs"));
  console.log("Copied runs/ -> private");
}

if (existsSync(pubStubs)) {
  copyIfExists(pubStubs, privStubs);
  console.log("Copied github-discovered stubs -> private");
}

const queriesSrc = join(root, "scripts", "github-daily-queries.json");
const queriesDest = join(priv, "scripts", "github-daily-queries.json");
mkdirSync(join(priv, "scripts"), { recursive: true });
writeFileSync(queriesDest, readFileSync(queriesSrc, "utf8"), "utf8");
console.log("Synced github-daily-queries.json -> private");

console.log(`\nPrivate catalog: ${privDaily}`);
console.log(`Private stubs: ${privStubs}`);
console.log("Commit from ion-private-core only — never ion-dex-nuke public remote.");
