#!/usr/bin/env node
/**
 * Clone awesome-list repos → parse ALL github.com/owner/repo links → skill stubs.
 * No Search API category cap; this is how you "crawl" thousands of repos from curated lists.
 *
 * Usage:
 *   node scripts/github-daily-awesome-ingest.mjs
 *   node scripts/github-daily-awesome-ingest.mjs --source awesome-web-scraping
 *   node scripts/github-daily-awesome-ingest.mjs --repo lorien/awesome-web-scraping --stubs
 *   node scripts/github-daily-awesome-ingest.mjs --all-enabled --merge-catalog
 *
 * UTF-8 without BOM.
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { loadGitHubToken } from "./load-github-token.mjs";
import { githubDailyDir, getPrivateCoreRoot, privateSkillsRoot } from "./ion-private-core-path.mjs";
import { repoRecord, writeSkillStub } from "./github-discovered-stub-lib.mjs";

const root = process.cwd();
const configPath = join(root, "scripts", "github-daily-awesome-sources.json");

const GITHUB_REPO_RE =
  /https?:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(?:[/?#).,\]'">]|$)/gi;

const SKIP_OWNERS = new Set([
  "topics",
  "features",
  "marketplace",
  "collections",
  "orgs",
  "settings",
  "login",
  "signup",
]);

const SKIP_REPO_SUFFIX = /\.(md|git|patch|diff)$/i;

function parseArgs(argv) {
  const opts = {
    source: null,
    repo: null,
    allEnabled: false,
    stubs: true,
    mergeCatalog: false,
    dryRun: false,
    skipClone: false,
    quiet: false,
    noEnrich: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--source" && argv[i + 1]) opts.source = argv[++i];
    else if (a === "--repo" && argv[i + 1]) opts.repo = argv[++i];
    else if (a === "--all-enabled") opts.allEnabled = true;
    else if (a === "--stubs") opts.stubs = true;
    else if (a === "--no-stubs") opts.stubs = false;
    else if (a === "--merge-catalog") opts.mergeCatalog = true;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--skip-clone") opts.skipClone = true;
    else if (a === "--no-enrich") opts.noEnrich = true;
    else if (a === "--quiet") opts.quiet = true;
  }
  return opts;
}

function loadConfig() {
  return JSON.parse(readFileSync(configPath, "utf8"));
}

function log(opts, msg) {
  if (!opts.quiet) console.log(msg);
}

function walkMarkdownFiles(dir, globHint) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const p = join(current, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === ".git" || ent.name === "node_modules") continue;
        stack.push(p);
      } else if (/\.(md|markdown)$/i.test(ent.name)) {
        out.push(p);
      }
    }
  }
  return out;
}

function extractRepoLinks(text) {
  const found = new Set();
  let m;
  const re = new RegExp(GITHUB_REPO_RE.source, GITHUB_REPO_RE.flags);
  while ((m = re.exec(text)) !== null) {
    const owner = m[1];
    let repo = m[2];
    if (SKIP_OWNERS.has(owner.toLowerCase())) continue;
    repo = repo.replace(/\.git$/i, "");
    if (SKIP_REPO_SUFFIX.test(repo)) continue;
    if (repo.length < 1 || owner.length < 1) continue;
    found.add(`${owner}/${repo}`);
  }
  return [...found];
}

function cloneSource(source, vendorRoot, defaults, opts) {
  const dest = join(vendorRoot, defaults.cloneSubdir ?? "_awesome-ingest", source.id);
  const url = `https://github.com/${source.repo}.git`;
  if (opts.skipClone && existsSync(dest)) {
    log(opts, `Using existing clone: ${dest}`);
    return dest;
  }
  if (opts.dryRun) {
    log(opts, `DRY-RUN clone ${url} -> ${dest}`);
    return dest;
  }
  mkdirSync(join(dest, ".."), { recursive: true });
  if (existsSync(dest)) {
    log(opts, `Pull/refresh ${dest}`);
    spawnSync("git", ["-C", dest, "pull", "--ff-only"], { stdio: "inherit", shell: false });
    return dest;
  }
  log(opts, `Cloning ${source.repo} -> ${dest}`);
  const r = spawnSync("git", ["clone", "--depth", "1", url, dest], {
    stdio: "inherit",
    shell: false,
  });
  if (r.status !== 0) throw new Error(`git clone failed: ${source.repo}`);
  return dest;
}

async function enrichRepo(fullName, token, delayMs) {
  if (!token) {
    return { description: "", stars: 0 };
  }
  const url = `https://api.github.com/repos/${fullName}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "ION-DEX-awesome-ingest",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (res.status === 404) return { description: "(not found)", stars: 0, missing: true };
  if (res.status === 403 || res.status === 429) {
    await sleep(delayMs * 4);
    return enrichRepo(fullName, token, delayMs);
  }
  if (!res.ok) return { description: "", stars: 0 };
  const data = await res.json();
  await sleep(delayMs);
  return {
    description: data.description ?? "",
    stars: data.stargazers_count ?? 0,
    topics: data.topics ?? [],
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function selectSources(cfg, opts) {
  if (opts.repo) {
    const id = opts.source ?? slugFromRepo(opts.repo);
    return [{ id, repo: opts.repo, label: opts.repo, suggestedSkills: ["tavily"] }];
  }
  let list = cfg.sources ?? [];
  if (opts.source) {
    list = list.filter((s) => s.id === opts.source);
    if (!list.length) throw new Error(`Unknown source id: ${opts.source}`);
  } else if (!opts.allEnabled) {
    list = list.filter((s) => s.enabled !== false);
    if (list.length > 1) list = [list[0]];
  } else {
    list = list.filter((s) => s.enabled !== false);
  }
  return list;
}

function slugFromRepo(fullName) {
  return fullName.replace(/\//g, "-").toLowerCase();
}

function mergeIntoCatalog(cwd, sourceId, repos, opts) {
  const latestPath = join(githubDailyDir(cwd), "latest.json");
  if (!existsSync(latestPath)) {
    log(opts, "WARN: no latest.json — run discovery first or skip --merge-catalog");
    return;
  }
  const report = JSON.parse(readFileSync(latestPath, "utf8"));
  const catId = `awesome-ingest-${sourceId}`;
  const label = `Awesome ingest: ${sourceId}`;
  const existing = (report.categories ?? []).filter((c) => c.id !== catId);
  const entry = {
    id: catId,
    label,
    query: `awesome-ingest clone parse (${sourceId})`,
    repos: repos.map((r) => ({
      full_name: r.full_name,
      name: r.name,
      html_url: r.html_url,
      description: r.description,
      stars: r.stars,
      topics: r.topics ?? [],
      categoryId: catId,
      categoryLabel: label,
      relevanceScore: r.relevanceScore,
      suggestedSkills: r.suggestedSkills,
      clonePath: r.clonePath,
    })),
  };
  report.categories = [...existing, entry];
  report.mergedAwesomeIngest = new Date().toISOString();
  writeFileSync(latestPath, JSON.stringify(report, null, 2), "utf8");
  log(opts, `Merged ${repos.length} repos into catalog category ${catId}`);
}

async function ingestSource(source, cfg, opts) {
  const defaults = cfg.defaults ?? {};
  const vendorRoot =
    process.env.ION_VENDOR_DISCOVERY_ROOT || "d:\\vendor-ion-discovery";
  const ingestDir = join(githubDailyDir(root), "awesome-ingest");
  mkdirSync(ingestDir, { recursive: true });

  const clonePath = opts.dryRun
    ? join(vendorRoot, defaults.cloneSubdir ?? "_awesome-ingest", source.id)
    : cloneSource(source, vendorRoot, defaults, opts);

  if (!opts.dryRun && !existsSync(clonePath)) {
    throw new Error(`Clone path missing: ${clonePath}`);
  }

  const mdFiles = opts.dryRun ? [] : walkMarkdownFiles(clonePath);
  const linkSet = new Set();
  // Always include the source repo itself, even if README has no github.com links.
  if (source.repo) linkSet.add(source.repo);
  for (const file of mdFiles) {
    const text = readFileSync(file, "utf8");
    for (const full of extractRepoLinks(text)) linkSet.add(full);
  }

  let fullNames = [...linkSet].sort();
  const max =
    source.maxReposPerSource ?? defaults.maxReposPerSource ?? null;
  if (typeof max === "number" && max > 0 && fullNames.length > max) {
    log(opts, `Capping ${fullNames.length} -> ${max} repos for ${source.id}`);
    fullNames = fullNames.slice(0, max);
  }

  log(opts, `[${source.id}] ${source.repo}: ${mdFiles.length} markdown files → ${fullNames.length} unique repos`);

  const token = loadGitHubToken();
  const enrich =
    !opts.noEnrich && (source.enrichWithApi ?? defaults.enrichWithApi !== false);
  const delayMs = source.apiDelayMs ?? defaults.apiDelayMs ?? 350;

  const repos = [];
  for (const fullName of fullNames) {
    let meta = { description: "", stars: 0, topics: [] };
    if (enrich && !opts.dryRun) {
      meta = await enrichRepo(fullName, token, delayMs);
      if (meta.missing) continue;
    }
    repos.push(
      repoRecord(fullName, {
        description: meta.description,
        stars: meta.stars,
        categoryId: `awesome-ingest-${source.id}`,
        categoryLabel: source.label ?? source.id,
        suggestedSkills: source.suggestedSkills ?? ["tavily"],
        ingestSource: source.repo,
        relevanceScore: meta.stars >= 10000 ? 5 : meta.stars >= 1000 ? 4 : 3,
      }),
    );
  }

  const outJson = join(ingestDir, `${source.id}.json`);
  const payload = {
    generatedAt: new Date().toISOString(),
    sourceId: source.id,
    sourceRepo: source.repo,
    clonePath,
    markdownFiles: mdFiles.length,
    repoCount: repos.length,
    repos,
  };
  if (!opts.dryRun) {
    writeFileSync(outJson, JSON.stringify(payload, null, 2), "utf8");
    log(opts, `Wrote ${outJson}`);
  }

  if (opts.mergeCatalog && !opts.dryRun) {
    mergeIntoCatalog(root, source.id, repos, opts);
  }

  if (opts.stubs && !opts.dryRun) {
    const priv = getPrivateCoreRoot(root);
    if (!priv) {
      console.error("Set ION_PRIVATE_CORE_ROOT for skill stubs");
      process.exit(1);
    }
    const stubsRoot = privateSkillsRoot(root)
      ? join(privateSkillsRoot(root), "github-discovered")
      : join(priv, ".cursor", "skills", "github-discovered");
    mkdirSync(stubsRoot, { recursive: true });
    let n = 0;
    for (const repo of repos) {
      writeSkillStub(stubsRoot, repo, vendorRoot);
      n++;
      if (n % 25 === 0) log(opts, `  stubs: ${n}/${repos.length}`);
    }
    log(opts, `Skill stubs written: ${n} → ${stubsRoot}`);
  }

  return payload;
}

async function main() {
  const opts = parseArgs(process.argv);
  const cfg = loadConfig();

  if (!getPrivateCoreRoot(root) && opts.stubs) {
    console.error("ION_PRIVATE_CORE_ROOT required for --stubs");
    process.exit(1);
  }

  const sources = selectSources(cfg, opts);
  if (!sources.length) {
    console.error("No sources selected. Check github-daily-awesome-sources.json enabled flags.");
    process.exit(1);
  }

  log(opts, `Awesome ingest: ${sources.length} source(s)`);

  const summary = [];
  for (const source of sources) {
    const payload = await ingestSource(source, cfg, opts);
    summary.push({
      id: source.id,
      repo: source.repo,
      repoCount: payload.repoCount,
    });
  }

  const summaryPath = join(githubDailyDir(root), "awesome-ingest", "summary.json");
  if (!opts.dryRun) {
    mkdirSync(join(githubDailyDir(root), "awesome-ingest"), { recursive: true });
    writeFileSync(
      summaryPath,
      JSON.stringify({ generatedAt: new Date().toISOString(), sources: summary }, null, 2),
      "utf8",
    );
  }

  console.log("\nDone:", JSON.stringify(summary, null, 2));
  console.log("Re-run: node scripts/sync-github-discovered-public-index.mjs");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
