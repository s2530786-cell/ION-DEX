#!/usr/bin/env node
/**
 * Daily GitHub high-star discovery for ION DEX stack.
 * UTF-8 without BOM.
 *
 * Usage:
 *   node scripts/github-daily-discovery.mjs
 *   node scripts/github-daily-discovery.mjs --dry-run
 *   node scripts/github-daily-discovery.mjs --limit 5
 *   node scripts/github-daily-discovery.mjs --profile full
 *   node scripts/github-daily-discovery.mjs --categories web3-defi-dex --merge
 *   ION_GITHUB_DISCOVERY_PROFILE=broad node scripts/github-daily-discovery.mjs
 *   GITHUB_TOKEN=ghp_... node scripts/github-daily-discovery.mjs
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { loadGitHubToken } from "./load-github-token.mjs";
import { getPrivateCoreRoot, githubDailyDir } from "./ion-private-core-path.mjs";
import { loadDiscoveryConfig } from "./github-daily-load-queries.mjs";

const root = process.cwd();
const privateCore = getPrivateCoreRoot(root);
const outDir = githubDailyDir(root);
const latestPath = join(outDir, "latest.json");
const latestMdPath = join(outDir, "latest.md");
const runsDir = join(outDir, "runs");
const publicPointerPath = join(root, ".memory-bank", "github-daily", "README.md");

function parseArgs(argv) {
  const opts = {
    dryRun: false,
    limit: null,
    quiet: false,
    categories: null,
    merge: false,
    profile: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--quiet") opts.quiet = true;
    else if (a === "--merge") opts.merge = true;
    else if (a === "--limit" && argv[i + 1]) opts.limit = Number(argv[++i]);
    else if (a === "--profile" && argv[i + 1]) opts.profile = argv[++i];
    else if (a === "--categories" && argv[i + 1]) {
      opts.categories = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return opts;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function scoreRelevance(repo, tags) {
  const blob = `${repo.name} ${repo.description ?? ""} ${(repo.topics ?? []).join(" ")}`.toLowerCase();
  let score = 0;
  for (const tag of tags) {
    if (blob.includes(tag.toLowerCase())) score += 1;
  }
  if (repo.stargazers_count >= 20000) score += 2;
  else if (repo.stargazers_count >= 5000) score += 1;
  return score;
}

async function searchRepos(q, perPage, token, attempt = 0) {
  const url = new URL("https://api.github.com/search/repositories");
  url.searchParams.set("q", q);
  url.searchParams.set("sort", "stars");
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", String(perPage));

  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ION-DEX-github-daily-discovery",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if ((res.status === 403 || res.status === 429) && attempt < 4) {
    const retryAfter = Number(res.headers.get("retry-after") || 0);
    const waitMs = retryAfter > 0 ? retryAfter * 1000 : 15000 * (attempt + 1);
    await sleep(waitMs);
    return searchRepos(q, perPage, token, attempt + 1);
  }
  if (res.status === 403 || res.status === 429) {
    const body = await res.text();
    throw new Error(`GitHub rate limit (${res.status}): ${body.slice(0, 200)}`);
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub search failed ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.items ?? [];
}

function normalizeRepo(item, category, config) {
  const skills = [...(category.skills ?? [])];
  const privateSkills = [...(category.privateSkills ?? [])];
  const memoryBank = [...(category.memoryBank ?? [])];
  return {
    full_name: item.full_name,
    name: item.name,
    html_url: item.html_url,
    description: item.description ?? "",
    stars: item.stargazers_count,
    forks: item.forks_count,
    language: item.language ?? null,
    topics: item.topics ?? [],
    updated_at: item.updated_at,
    default_branch: item.default_branch,
    categoryId: category.id,
    categoryLabel: category.label,
    section: category.section ?? "ion-dev",
    relevanceScore: scoreRelevance(item, config.ionRelevanceTags),
    suggestedSkills: [...new Set([...skills, ...privateSkills])],
    suggestedPrivateSkills: privateSkills,
    memoryBank,
    securityPreflight: Boolean(category.securityPreflight),
    clonePath: `vendor-ion-discovery/${item.name}`,
  };
}

function dedupeByFullName(repos) {
  const map = new Map();
  for (const r of repos) {
    const prev = map.get(r.full_name);
    if (!prev || r.stars > prev.stars) map.set(r.full_name, r);
  }
  return [...map.values()];
}

function buildMarkdown(report) {
  const lines = [
    "# GitHub Daily Discovery",
    "",
    `Profile: **${report.discoveryProfile}** — ${report.discoveryProfileLabel ?? ""}`,
    `Categories: ${report.categories?.length ?? 0} · Sources: ${(report.discoverySources ?? []).join(", ")}`,
    `Generated: ${report.generatedAt}`,
    `Token: ${report.usedToken ? "yes" : "no (anonymous; low rate limit)"}`,
    "",
    "## Top overall (by stars, deduped)",
    "",
    "| Stars | Repo | Category | Relevance | Skills |",
    "|------:|------|----------|----------:|--------|",
  ];
  for (const r of report.topOverall.slice(0, 40)) {
    const skills = r.suggestedSkills.slice(0, 4).join(", ") || "—";
    lines.push(
      `| ${r.stars} | [${r.full_name}](${r.html_url}) | ${r.categoryId} | ${r.relevanceScore} | ${skills} |`,
    );
  }
  lines.push("", "## By category", "");
  for (const cat of report.categories) {
    lines.push(`### ${cat.label} (\`${cat.id}\`)`, "");
    lines.push(`Query: \`${cat.query}\``, "");
    if (!cat.repos.length) {
      lines.push("_No results or skipped._", "");
      continue;
    }
    for (const r of cat.repos) {
      lines.push(
        `- **${r.full_name}** (${r.stars}★) — ${r.description || "_no description_"}  `,
      );
      lines.push(`  - Skills: ${r.suggestedSkills.join(", ") || "—"}`);
      lines.push(`  - Clone: \`${r.clonePath}\``);
    }
    lines.push("");
  }
  lines.push("## Agent next steps", "");
  lines.push("1. `node scripts/github-daily-install.mjs --list`");
  lines.push("2. `node scripts/github-daily-install.mjs --category web3-defi-dex --top 3`");
  lines.push("3. `node scripts/skill-route.mjs --task \"<your task>\"`");
  lines.push("4. Read private Skill `ion-github-daily-discovery` in ion-private-core");
  return lines.join("\n");
}

function interRequestDelayMs(token, categoryCount) {
  if (!token) return categoryCount > 40 ? 5000 : 4500;
  if (categoryCount > 80) return 1100;
  if (categoryCount > 40) return 900;
  return 800;
}

async function main() {
  const opts = parseArgs(process.argv);
  const loaded = loadDiscoveryConfig(root, opts.profile);
  const config = loaded;
  const token = loadGitHubToken();
  const perPageDefault = opts.limit ?? config.defaults.perPage ?? 8;
  const allRepos = [];
  const categoriesOut = [];

  if (!opts.quiet) {
    console.log("ION GitHub daily discovery");
    console.log(`Profile: ${loaded.profile} (${loaded.profileLabel}) · ${loaded.categoryCount} categories`);
    console.log(
      privateCore
        ? `Catalog (PRIVATE): ${outDir}`
        : "WARN: ion-private-core missing — writing catalog under ion-dex-nuke (do not push)",
    );
    console.log(token ? "Auth: GITHUB_TOKEN set" : "Auth: none (set GITHUB_TOKEN for higher limits)");
  }

  const categoryFilter = opts.categories?.length ? new Set(opts.categories) : null;
  const categoriesToRun = categoryFilter
    ? config.categories.filter((c) => categoryFilter.has(c.id))
    : config.categories;
  const delayMs = interRequestDelayMs(token, categoriesToRun.length);

  if (categoryFilter && categoriesToRun.length === 0) {
    console.error(`No categories matched: ${[...categoryFilter].join(", ")}`);
    process.exit(1);
  }

  let priorReport = null;
  if (opts.merge && existsSync(latestPath)) {
    priorReport = JSON.parse(readFileSync(latestPath, "utf8"));
    if (!opts.quiet) console.log(`Merge: loaded prior catalog (${priorReport.categories?.length ?? 0} categories)`);
  }

  for (const category of categoriesToRun) {
    const perPage = category.perPage ?? perPageDefault;
    const q = category.q;
    if (!opts.quiet) console.log(`\n[${category.id}] ${category.label}`);

    if (opts.dryRun) {
      categoriesOut.push({ id: category.id, label: category.label, query: q, repos: [] });
      continue;
    }

    try {
      const items = await searchRepos(q, perPage, token);
      const repos = items.map((item) => normalizeRepo(item, category, config));
      categoriesOut.push({ id: category.id, label: category.label, query: q, repos });
      allRepos.push(...repos);
      if (!opts.quiet) {
        for (const r of repos.slice(0, 3)) {
          console.log(`  ${r.stars}★ ${r.full_name}`);
        }
      }
      await sleep(delayMs);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
      categoriesOut.push({
        id: category.id,
        label: category.label,
        query: q,
        repos: [],
        error: err.message,
      });
    }
  }

  let categoriesFinal = categoriesOut;
  if (priorReport?.categories?.length) {
    const replaced = new Set(categoriesOut.map((c) => c.id));
    const kept = priorReport.categories.filter((c) => !replaced.has(c.id));
    categoriesFinal = [...kept, ...categoriesOut];
  }

  const mergedRepos = [];
  for (const cat of categoriesFinal) {
    if (cat.repos?.length) mergedRepos.push(...cat.repos);
  }
  const deduped = dedupeByFullName(mergedRepos).sort((a, b) => b.stars - a.stars);
  const topOverall = deduped.slice(0, 100);
  const generatedAt = new Date().toISOString();
  const dateSlug = generatedAt.slice(0, 10);

  const report = {
    version: 2,
    generatedAt,
    discoveryProfile: loaded.profile,
    discoveryProfileLabel: loaded.profileLabel,
    discoverySources: loaded.sourceFiles,
    taxonomySections: loaded.sections,
    usedToken: Boolean(token),
    dryRun: opts.dryRun,
    latestPath,
    vendorRoot: process.env.ION_VENDOR_DISCOVERY_ROOT || "d:\\vendor-ion-discovery",
    categories: categoriesFinal,
    mergedFromPrior: Boolean(priorReport),
    categoriesRun: categoriesToRun.map((c) => c.id),
    topOverall,
    routingManifest: ".cursor/skill-routing.manifest.json",
    privateCoreRoot: privateCore,
    catalogRoot: outDir,
    autopilotSkillPrivate: privateCore
      ? join(privateCore, ".cursor/skills/ion-github-daily-discovery/SKILL.md")
      : null,
    autopilotSkillPublicStub: ".cursor/skills/ion-github-daily-discovery/SKILL.md",
  };

  if (opts.dryRun) {
    if (!opts.quiet) console.log("\nDry run — no files written.");
    return;
  }

  mkdirSync(runsDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(latestPath, JSON.stringify(report, null, 2), "utf8");
  writeFileSync(latestMdPath, buildMarkdown(report), "utf8");
  writeFileSync(join(runsDir, `${dateSlug}.json`), JSON.stringify(report, null, 2), "utf8");

  mkdirSync(join(root, ".memory-bank", "github-daily"), { recursive: true });
  writeFileSync(
    publicPointerPath,
    `# GitHub Daily — 机密目录在闭源仓

**禁止**把 \`latest.json\` / \`latest.md\` / \`runs/\` 提交到公开 \`ion-dex-nuke\`。

| 内容 | 位置 |
|------|------|
| 完整目录 | \`${outDir.replace(/\\/g, "/")}\` |
| 私有 Skill | \`ion-private-core/.cursor/skills/ion-github-daily-discovery/\` |
| 发现 Skill 存根 | \`github-discovered-*\` 仅在 **ion-private-core** |
| 克隆区 | \`d:/vendor-ion-discovery\`（本地 gitignore） |

运行（在 ion-dex-nuke 根目录）：

\`\`\`powershell
node scripts/github-daily-discovery.mjs
node scripts/github-daily-skill-stubs.mjs
\`\`\`

仓库：https://github.com/s2530786-cell/ion-private-core
`,
    "utf8",
  );

  if (!opts.quiet) {
    console.log(`\nWrote ${latestPath}`);
    console.log(`Wrote ${latestMdPath}`);
    console.log(`Repos: ${deduped.length} unique · top star: ${topOverall[0]?.full_name ?? "n/a"}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
