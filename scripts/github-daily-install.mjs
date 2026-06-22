#!/usr/bin/env node
/**
 * Clone / install repos from .memory-bank/github-daily/latest.json
 * UTF-8 without BOM.
 *
 * Usage:
 *   node scripts/github-daily-install.mjs --list
 *   node scripts/github-daily-install.mjs --top 5
 *   node scripts/github-daily-install.mjs --curated   # uses github-daily-stub-repos.json (catalog-top)
 *   node scripts/github-daily-install.mjs --category web3-defi-dex --top 3
 *   node scripts/github-daily-install.mjs --repo owner/name
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { githubDailyDir } from "./ion-private-core-path.mjs";
import { resolveStubRepoList } from "./github-daily-rank.mjs";

const root = process.cwd();
const dailyDir = githubDailyDir(root);
const latestPath = join(dailyDir, "latest.json");
const manifestPath = join(dailyDir, "installed.json");

function parseArgs(argv) {
  const opts = {
    list: false,
    top: 0,
    category: null,
    repo: null,
    curated: false,
    dryRun: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--list") opts.list = true;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--top" && argv[i + 1]) opts.top = Number(argv[++i]);
    else if (a === "--category" && argv[i + 1]) opts.category = argv[++i];
    else if (a === "--repo" && argv[i + 1]) opts.repo = argv[++i];
    else if (a === "--curated") opts.curated = true;
  }
  return opts;
}

function loadLatest() {
  if (!existsSync(latestPath)) {
    console.error("Missing latest catalog. Run: node scripts/github-daily-discovery.mjs");
    process.exit(1);
  }
  return JSON.parse(readFileSync(latestPath, "utf8"));
}

function findRepo(report, fullName) {
  const inTop = report.topOverall.find((r) => r.full_name === fullName);
  if (inTop) return inTop;
  for (const cat of report.categories ?? []) {
    const hit = (cat.repos ?? []).find((r) => r.full_name === fullName);
    if (hit) return hit;
  }
  return null;
}

function vendorRoot(report) {
  return process.env.ION_VENDOR_DISCOVERY_ROOT || report.vendorRoot || "d:\\vendor-ion-discovery";
}

function selectRepos(report, opts) {
  let pool = [];
  if (opts.curated) {
    const curatedPath = join(root, "scripts", "github-daily-stub-repos.json");
    const stubCfg = JSON.parse(readFileSync(curatedPath, "utf8"));
    const names = resolveStubRepoList(root, stubCfg);
    return names.map((full) => findRepo(report, full)).filter(Boolean);
  }
  if (opts.repo) {
    const found = findRepo(report, opts.repo);
    if (!found) {
      console.error(`Repo not in catalog: ${opts.repo}`);
      process.exit(1);
    }
    return [found];
  }
  if (opts.category) {
    const cat = report.categories.find((c) => c.id === opts.category);
    if (!cat) {
      console.error(`Unknown category: ${opts.category}`);
      process.exit(1);
    }
    pool = cat.repos;
  } else {
    pool = report.topOverall;
  }
  pool = [...pool].sort((a, b) => b.stars - a.stars);
  if (opts.top > 0) pool = pool.slice(0, opts.top);
  return pool;
}

function gitClone(repo, dest, dryRun) {
  if (existsSync(join(dest, ".git"))) {
    console.log(`SKIP (exists): ${dest}`);
    return { status: "skipped", dest };
  }
  const url = `${repo.html_url}.git`;
  if (dryRun) {
    console.log(`DRY-RUN clone ${url} -> ${dest}`);
    return { status: "dry-run", dest };
  }
  mkdirSync(dirname(dest), { recursive: true });
  const r = spawnSync("git", ["clone", "--depth", "1", url, dest], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (r.status !== 0) {
    return { status: "failed", dest };
  }
  return { status: "cloned", dest };
}

function main() {
  const opts = parseArgs(process.argv);
  const report = loadLatest();
  const repos = selectRepos(report, opts);
  const rootDir = vendorRoot(report);

  if (opts.list) {
    console.log(`Vendor root: ${rootDir}`);
    console.log(`Catalog: ${latestPath} (${report.generatedAt})\n`);
    for (const r of repos) {
      console.log(
        `${r.stars}★\t${r.full_name}\t[${r.categoryId}]\t${r.suggestedSkills.join(",")}`,
      );
    }
    return;
  }

  if (repos.length === 0) {
    console.log("No repos selected.");
    return;
  }

  const installed = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, "utf8"))
    : { version: 1, entries: [] };

  const results = [];
  for (const repo of repos) {
    const dest = join(rootDir, repo.name);
    console.log(`\n=== ${repo.full_name} ===`);
    const res = gitClone(repo, dest, opts.dryRun);
    results.push({
      full_name: repo.full_name,
      dest,
      ...res,
      suggestedSkills: repo.suggestedSkills,
      categoryId: repo.categoryId,
      clonedAt: new Date().toISOString(),
    });
  }

  if (!opts.dryRun) {
    for (const r of results) {
      if (r.status === "cloned") {
        installed.entries = installed.entries.filter((e) => e.full_name !== r.full_name);
        installed.entries.push(r);
      }
    }
    installed.updatedAt = new Date().toISOString();
    mkdirSync(dailyDir, { recursive: true });
    writeFileSync(manifestPath, JSON.stringify(installed, null, 2), "utf8");
    console.log(`\nUpdated ${manifestPath}`);
  }
}

main();
