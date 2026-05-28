#!/usr/bin/env node
/**
 * Generate public SKILL.md stubs for vendor-ion-discovery repos (no secrets).
 * UTF-8 without BOM.
 *
 * Usage:
 *   node scripts/github-daily-skill-stubs.mjs
 *   node scripts/github-daily-skill-stubs.mjs --from-installed
 *   node scripts/github-daily-skill-stubs.mjs --repo OpenZeppelin/openzeppelin-contracts
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { githubDailyDir, privateSkillsRoot, getPrivateCoreRoot } from "./ion-private-core-path.mjs";
import { resolveStubRepoList, rankPerCategoryTop } from "./github-daily-rank.mjs";

const root = process.cwd();
const dailyDir = githubDailyDir(root);
const latestPath = join(dailyDir, "latest.json");
const installedPath = join(dailyDir, "installed.json");
const curatedPath = join(root, "scripts", "github-daily-stub-repos.json");
const dexCuratedPath = join(root, "scripts", "github-dex-curated-repos.json");
const privSkills = privateSkillsRoot(root);
const stubsRoot = privSkills
  ? join(privSkills, "github-discovered")
  : join(root, ".cursor", "skills", "github-discovered");

function parseArgs(argv) {
  const opts = { fromInstalled: false, repo: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--from-installed") opts.fromInstalled = true;
    else if (argv[i] === "--repo" && argv[i + 1]) opts.repo = argv[++i];
  }
  return opts;
}

function slugify(name, fullName) {
  const base = (fullName ?? name).replace(/\//g, "-");
  return base
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function findInCatalog(report, fullName) {
  const inTop = report.topOverall.find((r) => r.full_name === fullName);
  if (inTop) return inTop;
  for (const cat of report.categories ?? []) {
    const hit = (cat.repos ?? []).find((r) => r.full_name === fullName);
    if (hit) return hit;
  }
  return null;
}

function repoFromCurated(fullName) {
  const name = fullName.includes("/") ? fullName.split("/")[1] : fullName;
  return {
    full_name: fullName,
    name,
    html_url: `https://github.com/${fullName}`,
    description: "Curated DEX / AMM repo (see github-dex-curated-repos.json).",
    stars: 0,
    categoryId: "web3-dex-curated",
    categoryLabel: "DEX implementations (curated list)",
    relevanceScore: 6,
    suggestedSkills: ["ion-contract-audit", "ion-data-backend", "ion-web3-ui"],
    suggestedPrivateSkills: [],
    clonePath: `vendor-ion-discovery/${name}`,
  };
}

function isDexCurated(fullName) {
  if (!existsSync(dexCuratedPath)) return false;
  const list = JSON.parse(readFileSync(dexCuratedPath, "utf8")).repos ?? [];
  return list.includes(fullName);
}

function repoFromInstalled(entry, report) {
  const [owner, name] = entry.full_name.split("/");
  const vendorRoot = process.env.ION_VENDOR_DISCOVERY_ROOT || report.vendorRoot || "d:\\vendor-ion-discovery";
  return {
    full_name: entry.full_name,
    name,
    html_url: `https://github.com/${entry.full_name}`,
    description: "Installed from vendor-ion-discovery (minimal stub — re-run discovery for full metadata).",
    stars: 0,
    categoryId: entry.categoryId ?? "installed",
    categoryLabel: entry.categoryId ?? "installed",
    relevanceScore: 0,
    suggestedSkills: entry.suggestedSkills ?? ["ion-github-daily-discovery"],
    suggestedPrivateSkills: [],
    clonePath: `vendor-ion-discovery/${name}`,
    _vendorRoot: vendorRoot,
  };
}

function buildSkillMd(repo, vendorRoot) {
  const skillName = `github-discovered-${slugify(repo.name, repo.full_name)}`;
  const skills = [...new Set(repo.suggestedSkills ?? [])];
  const privateSkills = [...new Set(repo.suggestedPrivateSkills ?? [])];
  const dest = join(vendorRoot, repo.name).replace(/\\/g, "/");

  return {
    skillName,
    content: `---
name: ${skillName}
description: >-
  Upstream stub for ${repo.full_name} (${repo.stars}★). Local clone at ${dest}.
  Load when integrating this repo into ION DEX; pair with suggested project Skills.
  CONFIDENTIAL — ion-private-core only. Never commit to public ion-dex-nuke remote.
---

# GitHub Discovered: ${repo.full_name}

| Field | Value |
|-------|-------|
| Stars | ${repo.stars} |
| Category | ${repo.categoryId} — ${repo.categoryLabel} |
| URL | ${repo.html_url} |
| Local path | \`${dest}\` |
| Relevance | ${repo.relevanceScore ?? "n/a"} |

## When to use

${repo.description || "No description in catalog."}

## Load with ION Skills

${skills.length ? skills.map((s) => `- \`.cursor/skills/${s}/SKILL.md\` or \`.cursor/skills-private/${s}/\``).join("\n") : "- `ion-github-daily-discovery`"}

${privateSkills.length ? `\n**Private Skills (ion-private-core only):**\n${privateSkills.map((s) => `- \`${s}\``).join("\n")}` : ""}

## Agent workflow

1. Confirm clone exists: \`${dest}\` (else \`node scripts/github-daily-install.mjs --repo ${repo.full_name}\`).
2. Run \`skill-vetter\` + license review before production wiring.
3. \`node scripts/skill-route.mjs --task "<task>"\` for autopilot routing.
4. Do **not** copy proprietary upstream code into public commits; link vendor path only.

## Catalog

- Machine: \`.memory-bank/github-daily/latest.json\`
- Human: \`.memory-bank/github-daily/latest.md\`
`,
  };
}

function main() {
  const opts = parseArgs(process.argv);
  if (!existsSync(latestPath)) {
    console.error("Missing catalog. Run: node scripts/github-daily-discovery.mjs");
    process.exit(1);
  }
  const report = JSON.parse(readFileSync(latestPath, "utf8"));
  const vendorRoot = process.env.ION_VENDOR_DISCOVERY_ROOT || report.vendorRoot || "d:\\vendor-ion-discovery";

  let fullNames = [];
  if (opts.repo) {
    fullNames = [opts.repo];
  } else if (opts.fromInstalled && existsSync(installedPath)) {
    const inst = JSON.parse(readFileSync(installedPath, "utf8"));
    fullNames = inst.entries.map((e) => e.full_name);
  } else if (existsSync(curatedPath)) {
    const stubCfg = JSON.parse(readFileSync(curatedPath, "utf8"));
    fullNames = resolveStubRepoList(root, stubCfg);
    if (stubCfg.mode === "catalog-top-per-category") {
      const summary = rankPerCategoryTop(root, stubCfg);
      console.log(
        `Stub source: catalog-top-per-category limit=${stubCfg.limitPerCategory ?? 5}/category · ${summary.byCategory.length} categories · ${summary.totalRepos} repos`,
      );
    } else if (stubCfg.mode === "catalog-top") {
      console.log(
        `Stub source: catalog-top limit=${stubCfg.limit ?? 5} scope=${stubCfg.scope ?? "all-dev"}`,
      );
    }
  }

  if (fullNames.length === 0) {
    console.error("No repos selected. Use --repo, --from-installed, or github-daily-stub-repos.json");
    process.exit(1);
  }

  if (!getPrivateCoreRoot(root)) {
    console.error(
      "ion-private-core required for github-discovered stubs. Set ION_PRIVATE_CORE_ROOT or clone private repo.",
    );
    process.exit(1);
  }

  mkdirSync(stubsRoot, { recursive: true });
  const manifestSkills = [];

  const installed = existsSync(installedPath)
    ? JSON.parse(readFileSync(installedPath, "utf8"))
    : { entries: [] };

  for (const fullName of fullNames) {
    let repo = findInCatalog(report, fullName);
    if (!repo) {
      const inst = installed.entries.find((e) => e.full_name === fullName);
      if (inst) repo = repoFromInstalled(inst, report);
    }
    if (!repo && isDexCurated(fullName)) repo = repoFromCurated(fullName);
    if (!repo) {
      console.warn(`SKIP (not in catalog or installed): ${fullName}`);
      continue;
    }
    const { skillName, content } = buildSkillMd(repo, vendorRoot);
    const dir = join(stubsRoot, skillName);
    mkdirSync(dir, { recursive: true });
    const skillPath = join(dir, "SKILL.md");
    writeFileSync(skillPath, content, "utf8");
    console.log(`Wrote ${skillPath}`);
    manifestSkills.push(skillName);
  }

  const indexPath = join(stubsRoot, "README.md");
  writeFileSync(
    indexPath,
    `# GitHub Discovered Skill stubs\n\nAuto-generated. Do not hand-edit SKILL.md — re-run \`node scripts/github-daily-skill-stubs.mjs\`.\n\n${manifestSkills.map((s) => `- \`${s}\``).join("\n")}\n`,
    "utf8",
  );
  console.log(`\nStubs: ${manifestSkills.length} · index: ${indexPath}`);
}

main();
