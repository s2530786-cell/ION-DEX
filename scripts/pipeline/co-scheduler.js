#!/usr/bin/env node
/**
 * co-scheduler.js — Composer Orchestrator 调度器
 * 
 * 全自动任务派发引擎：
 *   1. 读取 cursor-queue 任务文件
 *   2. 匹配 18 角色
 *   3. 生成 .cursor/rules/current-tasks.mdc（Cursor 启动自动读取）
 *   4. 生成角色专属任务快照
 *   5. 输出任务报告
 * 
 * 角色 → 任务映射：
 *   PM: 任务优先级排序、backlog管理
 *   CO: 任务派发（本调度器角色）
 *   CE/LE/IE/AE/RE: 各自UI层面任务
 *   VQE: 视觉QA任务
 *   CRE: 代码审查任务
 *   BE: 构建/CI任务
 *   CG: 规则合规任务
 *   DTE/GSE: Token/Harness任务
 * 
 * Usage:
 *   node co-scheduler.js                      # 读队列，生成任务文件
 *   node co-scheduler.js --dispatch            # 派发当前任务给 Cursor
 *   node co-scheduler.js --report              # 输出当前任务进度
 *   node co-scheduler.js --watch               # 后台模式，每5分钟扫描
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");
const QUEUE_DIR = join(PROJECT_ROOT, "cursor-queue");
const RULES_DIR = join(PROJECT_ROOT, ".cursor", "rules");
const TASK_FILE = join(RULES_DIR, "current-tasks.mdc");

// 18 角色定义 + 任务关键词匹配
const ROLES = {
  "PM": { name: "Product Manager", keywords: ["priority", "backlog", "roadmap", "spec", "plan"], tasks: [] },
  "DD": { name: "Design Director", keywords: ["visual", "design", "constitution", "quality"], tasks: [] },
  "UCA": { name: "UI Component Architect", keywords: ["component", "api", "props", "interface"], tasks: [] },
  "CE": { name: "CSS Engineer", keywords: ["css", "style", "glassmorphism", "neon", "backdrop"], tasks: [] },
  "LE": { name: "Layout Engineer", keywords: ["layout", "grid", "flexbox", "responsive", "breakpoint"], tasks: [] },
  "AM": { name: "Asset Manager", keywords: ["asset", "icon", "image", "3d", "webp", "svg"], tasks: [] },
  "IE": { name: "Interaction Engineer", keywords: ["animation", "transition", "hover", "click", "easing"], tasks: [] },
  "AE": { name: "Accessibility Engineer", keywords: ["aria", "a11y", "keyboard", "contrast", "focus"], tasks: [] },
  "RE": { name: "Responsive Engineer", keywords: ["mobile", "tablet", "desktop", "touch", "viewport"], tasks: [] },
  "PE": { name: "Performance Engineer", keywords: ["perf", "bundle", "lazy", "optimize", "load"], tasks: [] },
  "i18n": { name: "Internationalization Engineer", keywords: ["i18n", "locale", "translate", "zh", "en"], tasks: [] },
  "VQE": { name: "Visual QA Engineer", keywords: ["visual", "qa", "screenshot", "pixelmatch", "diff"], tasks: [] },
  "DTE": { name: "Design Token Engineer", keywords: ["token", "design-token", "design-tokens"], tasks: [] },
  "GSE": { name: "Grid System Engineer", keywords: ["grid", "harness", "grid-template"], tasks: [] },
  "CG": { name: ".cursorrules Guardian", keywords: ["rule", "gate", "verify", "trailer", "commit"], tasks: [] },
  "CO": { name: "Composer Orchestrator", keywords: ["dispatch", "task", "queue", "scheduler"], tasks: [] },
  "BE": { name: "Build Engineer", keywords: ["build", "vite", "ci", "deploy", "bundle"], tasks: [] },
  "CRE": { name: "Code Review Engineer", keywords: ["review", "audit", "gate", "P0", "P1", "P2"], tasks: [] },
};

// ─── 读取任务队列 ───
function readQueue() {
  if (!existsSync(QUEUE_DIR)) {
    console.log("[CO] No cursor-queue directory");
    return [];
  }
  const files = readdirSync(QUEUE_DIR).filter(f => f.endsWith(".md")).sort();
  const tasks = [];
  for (const f of files) {
    const p = join(QUEUE_DIR, f);
    const content = readFileSync(p, "utf8");
    const mtime = statSync(p).mtime;
    
    // 提取任务项（以 ### 编号开头的行）
    const items = [];
    const lines = content.split("\n");
    let current = null;
    for (const line of lines) {
      const h3 = line.match(/^###\s+\d+\.\s+(.+)/);
      const checkbox = line.match(/^[-\*]\s+\[([ x])\]\s+(.+)/);
      if (h3) {
        if (current) items.push(current);
        current = { title: h3[1], done: false, subtasks: [], file: f };
      } else if (checkbox && current) {
        current.subtasks.push({ text: checkbox[2], done: checkbox[1] === "x" });
      }
    }
    if (current) items.push(current);
    
    // 判断文件是否已全部完成
    const allDone = items.length > 0 && items.every(i => i.subtasks.length === 0 || i.subtasks.every(s => s.done));
    tasks.push({ file: f, path: p, items, mtime, allDone, content: content.slice(0, 500) });
  }
  return tasks;
}

// ─── 匹配角色 ───
function matchRole(task) {
  const text = (task.title || "").toLowerCase();
  const scores = [];
  for (const [key, role] of Object.entries(ROLES)) {
    let score = 0;
    for (const kw of role.keywords) {
      if (text.includes(kw)) score += 2;
      // 也搜子任务
      for (const st of (task.subtasks || [])) {
        if (st.text.toLowerCase().includes(kw)) score += 1;
      }
    }
    if (score > 0) scores.push({ role: key, name: role.name, score });
  }
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, 3); // top 3 匹配角色
}

// ─── 生成 Cursor 任务文件 ───
function generateCursorTaskFile(tasks) {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  
  let content = `# 🎯 CO-DISPATCH: 前端自动开发任务 (CO-Scheduler)
**旺财派发 | ${now} CST | 立即执行**

## 当前状态
- Cursor 必须读取本文件启动任务
- 每个任务必须 match 角色 → 执行 → 验证 → commit
- 完成后更新 checkbox

---

`;

  // 排序：未完成优先
  const pending = tasks.filter(t => !t.allDone);
  const done = tasks.filter(t => t.allDone);
  const sorted = [...pending, ...done];

  for (const task of sorted) {
    const roles = matchRole(task);
    const roleTags = roles.map(r => `\`${r.role}\``).join(" ");
    const status = task.allDone ? "✅" : "🔴";
    
    content += `## ${status} ${task.file}\n`;
    content += `**Roles:** ${roleTags || "unmatched"} | **Updated:** ${task.mtime.toISOString().slice(0, 16)}\n\n`;
    
    for (const item of task.items) {
      const ck = "☐";
      content += `### ${ck} ${item.title}\n`;
      for (const st of item.subtasks) {
        const stCk = st.done ? "☑" : "☐";
        content += `- ${stCk} ${st.text}\n`;
      }
      content += "\n";
    }
  }

  // ── 铁律 ──
  content += `---

## 🔴 铁律（每次操作前必读）

1. 零 mock 数据，全部对接真实 API
2. 文件 ≤300 行
3. 颜色从 design-tokens.ts 引用，禁止硬编码 hex/rgba
4. 写完后立即 npx tsc --noEmit 检查
5. commit 前缀必须包含 Verify-100-Proof trailer
6. 禁止中文乱码，UTF-8 无 BOM

## 验证命令
\`\`\`
npx tsc --noEmit
node scripts/dev-preflight.mjs
powershell -File scripts/pipeline/pipeline-frontend.ps1 -Mode full
\`\`\`

## Commit 流程
\`\`\`
powershell -File scripts/verify-100.ps1            # 等待 GREEN
node scripts/verify-100-gate.mjs post-commit       # 注入 trailer
git push
\`\`\`

---
*CO-Scheduler: 每次心跳自动刷新*
`;
  return content;
}

// ─── 状态报告 ───
function reportStatus(tasks) {
  const pending = tasks.filter(t => !t.allDone);
  const done = tasks.filter(t => t.allDone);
  
  console.log(`\n=== CO-Scheduler Report ===`);
  console.log(`Total queue files: ${tasks.length}`);
  console.log(`Pending: ${pending.length} | Done: ${done.length}`);
  console.log("");
  
  if (pending.length > 0) {
    console.log("## Pending Tasks");
    for (const t of pending) {
      const roles = matchRole(t);
      console.log(`  🔴 ${t.file}`);
      console.log(`     Roles: ${roles.map(r => `${r.role}(${r.score})`).join(", ")}`);
      for (const item of t.items) {
        console.log(`     - ${item.title}`);
      }
    }
  }
  
  if (done.length > 0) {
    console.log("## Completed Tasks");
    for (const t of done) {
      console.log(`  ✅ ${t.file}`);
    }
  }
}

// ─── Main ───
function main() {
  const args = process.argv.slice(2);
  const mode = args.includes("--report") ? "report" : 
               args.includes("--watch") ? "watch" : 
               "generate";
  
  if (mode === "watch") {
    console.log("[CO] Watch mode — every 5 min");
    const run = () => {
      const tasks = readQueue();
      if (tasks.length > 0) {
        const content = generateCursorTaskFile(tasks);
        mkdirSync(RULES_DIR, { recursive: true });
        const old = existsSync(TASK_FILE) ? readFileSync(TASK_FILE, "utf8") : "";
        if (old !== content) {
          writeFileSync(TASK_FILE, content, "utf8");
          console.log(`[CO] Updated ${TASK_FILE} (${content.length} bytes)`);
        } else {
          console.log("[CO] No changes");
        }
        reportStatus(tasks);
      }
    };
    run();
    setInterval(run, 300000); // 5 min
    return;
  }
  
  const tasks = readQueue();
  if (tasks.length === 0) {
    console.log("[CO] No tasks in queue. Idle.");
    return;
  }
  
  if (mode === "report") {
    reportStatus(tasks);
    return;
  }
  
  // Generate mode
  const content = generateCursorTaskFile(tasks);
  mkdirSync(RULES_DIR, { recursive: true });
  writeFileSync(TASK_FILE, content, "utf8");
  console.log(`[CO] Written ${TASK_FILE} (${content.length} bytes)`);
  console.log(`     ${tasks.length} queue files processed`);
  reportStatus(tasks);
  
  // 也同步到 SESSION_STATE.md 摘要
  const sessionPath = join(PROJECT_ROOT, "SESSION_STATE.md");
  if (existsSync(sessionPath)) {
    const sessionContent = readFileSync(sessionPath, "utf8");
    const lines = sessionContent.split("\n");
    const markerIdx = lines.findIndex(l => l.includes("CO-SCHEDULER"));
    const newSummary = `<!-- CO-SCHEDULER: ${tasks.filter(t => !t.allDone).length} pending, ${tasks.filter(t => t.allDone).length} done (${new Date().toISOString().slice(0,16).replace("T"," ")}) -->`;
    if (markerIdx >= 0) {
      lines[markerIdx] = newSummary;
    } else {
      lines.splice(2, 0, newSummary);
    }
    writeFileSync(sessionPath, lines.join("\n"), "utf8");
    console.log(`[CO] Synced SESSION_STATE.md summary`);
  }
}

main();
