#!/usr/bin/env node
/**
 * Fetch curated DEX repos via GitHub REST (not search) and merge into private catalog.
 * UTF-8 without BOM.
 *
 *   node scripts/github-dex-enrich-catalog.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadGitHubToken } from "./load-github-token.mjs";
import { githubDailyDir } from "./ion-private-core-path.mjs";

const root = process.cwd();
const curatedPath = join(root, "scripts", "github-dex-curated-repos.json");
const latestPath = join(githubDailyDir(root), "latest.json");
const latestMdPath = join(githubDailyDir(root), "latest.md");

const CATEGORY = {
  id: "web3-dex-curated",
  label: "DEX implementations (curated list)",
  skills: ["ion-contract-audit", "ion-data-backend", "ion-web3-ui"],
  memoryBank: [".memory-bank/live-data-reference.md", ".memory-bank/architecture-audit.md"],
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchRepo(fullName, token, attempt = 0) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ION-DEX-github-dex-enrich",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`https://api.github.com/repos/${fullName}`, { headers });
  if (res.status === 404) return { fullName, error: "not found" };
  if (res.status === 403 && attempt < 2) {
    const retryAfter = Number(res.headers.get("retry-after") || 0);
    await sleep(retryAfter > 0 ? retryAfter * 1000 : 5000 * (attempt + 1));
    return fetchRepo(fullName, token, attempt + 1);
  }
  if (!res.ok) {
    const body = await res.text();
    return { fullName, error: `${res.status}: ${body.slice(0, 120)}` };
  }
  return { fullName, data: await res.json() };
}

function minimalCuratedRepo(fullName) {
  const name = fullName.includes("/") ? fullName.split("/")[1] : fullName;
  return {
    full_name: fullName,
    name,
    html_url: `https://github.com/${fullName}`,
    description: "Curated DEX / AMM implementation (enrich pending or rate-limited).",
    stars: 0,
    forks: 0,
    language: null,
    topics: [],
    updated_at: null,
    default_branch: "main",
    categoryId: CATEGORY.id,
    categoryLabel: CATEGORY.label,
    relevanceScore: 6,
    suggestedSkills: [...CATEGORY.skills],
    suggestedPrivateSkills: [],
    memoryBank: [...CATEGORY.memoryBank],
    securityPreflight: true,
    clonePath: `vendor-ion-discovery/${name}`,
    curated: true,
    metadataPending: true,
  };
}

function normalize(item) {
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
    categoryId: CATEGORY.id,
    categoryLabel: CATEGORY.label,
    relevanceScore: 6,
    suggestedSkills: [...CATEGORY.skills],
    suggestedPrivateSkills: [],
    memoryBank: [...CATEGORY.memoryBank],
    securityPreflight: true,
    clonePath: `vendor-ion-discovery/${item.name}`,
    curated: true,
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
    "# GitHub Daily Discovery — ION DEX",
    "",
    `Generated: ${report.generatedAt}`,
    `Token: ${report.usedToken ? "yes" : "no"}`,
    "",
    "## Top overall (by stars, deduped)",
    "",
    "| Stars | Repo | Category | Relevance | Skills |",
    "|------:|------|----------|----------:|--------|",
  ];
  for (const r of report.topOverall.slice(0, 40)) {
    const skills = r.suggestedSkills.slice(0, 4).join(", ") || "—";
    lines.push(`| ${r.stars} | [${r.full_name}](${r.html_url}) | ${r.categoryId} | ${r.relevanceScore} | ${skills} |`);
  }
  lines.push("", "## By category", "");
  for (const cat of report.categories) {
    lines.push(`### ${cat.label} (\`${cat.id}\`)`, "");
    if (cat.query) lines.push(`Query: \`${cat.query}\``, "");
    if (!cat.repos?.length) {
      lines.push("_No results._", "");
      continue;
    }
    for (const r of cat.repos) {
      lines.push(`- **${r.full_name}** (${r.stars}★) — ${r.description || "_no description_"}`);
      lines.push(`  - Clone: \`${r.clonePath}\``);
    }
    lines.push("");
  }
  return lines.join("\n");
}

async function main() {
  const token = loadGitHubToken();
  const list = JSON.parse(readFileSync(curatedPath, "utf8")).repos ?? [];
  if (!existsSync(latestPath)) {
    console.error("Missing catalog. Run github-daily-discovery.mjs first.");
    process.exit(1);
  }

  const report = JSON.parse(readFileSync(latestPath, "utf8"));
  const prevCurated =
    (report.categories ?? []).find((c) => c.id === CATEGORY.id)?.repos ?? [];
  const cachedByName = new Map(prevCurated.map((r) => [r.full_name, r]));
  const repos = [];
  const errors = [];

  console.log(`Enriching ${list.length} curated DEX repos (token: ${token ? "yes" : "no"})`);

  for (const fullName of list) {
    const result = await fetchRepo(fullName, token);
    if (result.error) {
      errors.push(`${fullName}: ${result.error}`);
      const cached = cachedByName.get(fullName);
      if (cached && !cached.metadataPending) {
        repos.push(cached);
        console.warn(`  KEEP cached ${fullName} (${cached.stars}★)`);
      } else {
        repos.push(minimalCuratedRepo(fullName));
        console.warn(`  PLACEHOLDER ${fullName}: ${result.error}`);
      }
    } else {
      repos.push(normalize(result.data));
      console.log(`  ${result.data.stargazers_count}★ ${fullName}`);
    }
    await sleep(token ? 350 : 1200);
  }

  const others = (report.categories ?? []).filter((c) => c.id !== CATEGORY.id);
  const catOut = {
    id: CATEGORY.id,
    label: CATEGORY.label,
    query: "curated: scripts/github-dex-curated-repos.json",
    repos: repos.sort((a, b) => b.stars - a.stars),
  };
  report.categories = [...others, catOut];

  const merged = [];
  for (const c of report.categories) {
    if (c.repos?.length) merged.push(...c.repos);
  }
  report.topOverall = dedupeByFullName(merged).sort((a, b) => b.stars - a.stars).slice(0, 60);
  report.generatedAt = new Date().toISOString();
  report.dexCuratedEnrichedAt = report.generatedAt;
  report.dexCuratedErrors = errors;

  writeFileSync(latestPath, JSON.stringify(report, null, 2), "utf8");
  writeFileSync(latestMdPath, buildMarkdown(report), "utf8");
  console.log(`\nWrote ${latestPath}`);
  const fresh = repos.filter((r) => r.curated && !r.metadataPending).length;
  const pending = repos.filter((r) => r.metadataPending).length;
  console.log(`DEX curated: ${repos.length} in catalog (${fresh} with live metadata, ${pending} placeholder, ${errors.length} API errors)`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
