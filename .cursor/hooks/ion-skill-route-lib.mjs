/**
 * Shared ION Skill route helpers for Cursor hooks. UTF-8 without BOM.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

export function resolvePaths(hookDir) {
  const root = join(hookDir, "..", "..");
  const hookCacheDir = hookDir;
  return {
    root,
    hookCacheDir,
    sessionCachePath: join(hookCacheDir, ".ion-skill-route-last.json"),
    subagentCachePath: join(hookCacheDir, ".ion-skill-route-last-subagent.json"),
  };
}

export function readStdinSync() {
  if (process.stdin.isTTY) {
    return "";
  }
  try {
    return readFileSync(0, "utf8").trim();
  } catch {
    return "";
  }
}

export function parseStdinJson(stdinRaw) {
  if (!stdinRaw) return {};
  try {
    return JSON.parse(stdinRaw);
  } catch {
    return {};
  }
}

export function runSkillRoute(root, taskText) {
  const script = join(root, "scripts", "skill-route.mjs");
  const args = [script, "--git", "--json", "--quiet"];
  if (taskText && String(taskText).trim()) {
    args.push("--task", String(taskText).trim());
  }
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.status !== 0 || !result.stdout?.trim()) {
    return { route: null, error: result.stderr?.trim() || `exit ${result.status}` };
  }
  try {
    return { route: JSON.parse(result.stdout), error: null };
  } catch (err) {
    return { route: null, error: String(err) };
  }
}

export function compactRoute(route) {
  return {
    version: route.version,
    pathRouteIds: route.pathRouteIds,
    keywordRouteIds: route.keywordRouteIds,
    skills: route.skills,
    docs: route.docs,
    memory: route.memory,
    verify: route.verify,
    preflight: route.preflight,
    securityPreflight: route.securityPreflight,
    manifest: route.manifest,
    autopilotSkill: route.autopilotSkill,
  };
}

function formatSkillLines(skills) {
  const lines = [];
  for (const s of skills ?? []) {
    const label = s.source === "missing" ? "MISSING" : s.source.toUpperCase();
    lines.push(`- [${label}] **${s.id}** → \`${s.path ?? "not installed"}\``);
  }
  return lines.length ? lines.join("\n") : "- (none)";
}

export function formatRouteMarkdown(route, options) {
  const {
    title,
    intro,
    hookScript,
    metaLines = [],
    includeFullJson = true,
  } = options;
  const compact = compactRoute(route);
  const lines = [
    title,
    "",
    intro,
    hookScript ? `脚本：\`${hookScript}\`` : null,
    "",
    `**path routes:** ${compact.pathRouteIds.join(", ") || "(none)"}`,
    `**keyword routes:** ${compact.keywordRouteIds.join(", ") || "(none)"}`,
    "",
    "### Skills",
    formatSkillLines(route.skills),
  ].filter((line) => line !== null);

  if (route.docs?.length) {
    lines.push("", "### Docs", ...route.docs.map((d) => `- \`${d}\``));
  }
  if (route.memory?.length) {
    lines.push("", "### Memory bank", ...route.memory.map((m) => `- \`${m}\``));
  }
  if (route.preflight) {
    lines.push("", "- **Preflight:** `node scripts/dev-preflight.mjs`");
  }
  if (route.securityPreflight) {
    lines.push("- **Security preflight:** `node scripts/security-preflight.mjs`");
  }
  if (route.verify?.length) {
    lines.push("", "### Verify", ...route.verify.map((v) => `- \`${v}\``));
  }
  if (includeFullJson) {
    lines.push(
      "",
      "### 路由 JSON",
      "```json",
      JSON.stringify(compact, null, 2),
      "```",
      "",
      "手动刷新：`node scripts/skill-route.mjs --git --json`",
      `Manifest：\`${compact.manifest}\``,
    );
  }
  for (const m of metaLines) {
    if (m) lines.push(m);
  }
  return lines.join("\n");
}

export function formatSessionContext(route, sessionInput) {
  const meta = [];
  if (sessionInput?.session_id) meta.push(`Session: \`${sessionInput.session_id}\``);
  if (sessionInput?.composer_mode) meta.push(`Mode: \`${sessionInput.composer_mode}\``);
  return formatRouteMarkdown(route, {
    title: "## ION Skill Autopilot（sessionStart Hook）",
    intro:
      "本段在 Agent 会话启动时注入。请**先 Read** 下列 SKILL.md，再实现或改代码。",
    hookScript: ".cursor/hooks/ion-skill-route-session.mjs",
    metaLines: meta,
    includeFullJson: true,
  });
}

export function formatSubagentContext(route, subagentInput) {
  const meta = [];
  if (subagentInput?.subagent_type) meta.push(`Subagent type: \`${subagentInput.subagent_type}\``);
  if (subagentInput?.subagent_id) meta.push(`Subagent id: \`${subagentInput.subagent_id}\``);
  if (subagentInput?.task) {
    const taskPreview =
      subagentInput.task.length > 200
        ? `${subagentInput.task.slice(0, 200)}…`
        : subagentInput.task;
    meta.push(`Task: ${taskPreview}`);
  }
  return formatRouteMarkdown(route, {
    title: "## ION Skill Autopilot（subagent / Task 子代理）",
    intro:
      "本子代理会话启动时注入（路径来自 git + 任务关键词）。请**先 Read** 列出的 SKILL.md，再执行 Task 描述中的工作。",
    hookScript: ".cursor/hooks/ion-skill-route-subagent.mjs",
    metaLines: meta,
    includeFullJson: true,
  });
}

export function formatCompactSubagentPrefix(route) {
  const compact = compactRoute(route);
  const skillIds = (route.skills ?? []).map((s) => s.id).join(", ");
  return [
    "[ION Skill Autopilot — 子代理路由]",
    `pathRoutes: ${compact.pathRouteIds.join(", ") || "none"}`,
    `keywordRoutes: ${compact.keywordRouteIds.join(", ") || "none"}`,
    `skills: ${skillIds || "none"}`,
    `Read SKILL.md for each skill before coding. Manifest: ${compact.manifest}`,
    "",
    "---",
    "",
  ].join("\n");
}

export function fallbackContext(hookLabel, error) {
  return [
    `## ION Skill Autopilot（${hookLabel} — fallback）`,
    "",
    "路由计算失败，请手动执行：",
    "",
    "```bash",
    "node scripts/skill-route.mjs --git",
    "```",
    "",
    error ? `Error: ${error}` : "",
    "Router: `.cursor/skills/ion-skill-autopilot/SKILL.md`",
  ]
    .filter(Boolean)
    .join("\n");
}

export function writeCache(cachePath, payload) {
  try {
    mkdirSync(dirname(cachePath), { recursive: true });
    writeFileSync(cachePath, JSON.stringify(payload, null, 2), "utf8");
  } catch {
    // optional
  }
}

export function readCachedRoute(cachePath) {
  if (!existsSync(cachePath)) return null;
  try {
    const raw = readFileSync(cachePath, "utf8");
    const data = JSON.parse(raw);
    return data.route ?? data;
  } catch {
    return null;
  }
}
