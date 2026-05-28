/**
 * Shared helpers for github-discovered SKILL.md stubs.
 * UTF-8 without BOM.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function slugify(name, fullName) {
  const base = (fullName ?? name).replace(/\//g, "-");
  return base
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export function repoRecord(fullName, fields = {}) {
  const name = fullName.includes("/") ? fullName.split("/")[1] : fullName;
  return {
    full_name: fullName,
    name,
    html_url: `https://github.com/${fullName}`,
    description: fields.description ?? "",
    stars: fields.stars ?? 0,
    categoryId: fields.categoryId ?? "awesome-ingest",
    categoryLabel: fields.categoryLabel ?? "Awesome list ingest",
    relevanceScore: fields.relevanceScore ?? 3,
    suggestedSkills: fields.suggestedSkills ?? ["tavily"],
    suggestedPrivateSkills: fields.suggestedPrivateSkills ?? [],
    clonePath: fields.clonePath ?? `vendor-ion-discovery/${name}`,
    ingestSource: fields.ingestSource ?? null,
  };
}

export function buildSkillMd(repo, vendorRoot) {
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
${repo.ingestSource ? `| Ingest source | \`${repo.ingestSource}\` |` : ""}

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
- Awesome ingest: \`.memory-bank/github-daily/awesome-ingest/\`
`,
  };
}

export function writeSkillStub(stubsRoot, repo, vendorRoot) {
  const { skillName, content } = buildSkillMd(repo, vendorRoot);
  const dir = join(stubsRoot, skillName);
  mkdirSync(dir, { recursive: true });
  const skillPath = join(dir, "SKILL.md");
  writeFileSync(skillPath, content, "utf8");
  return { skillName, skillPath };
}
