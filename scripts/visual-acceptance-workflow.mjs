#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("..", import.meta.url));
const captureScript = join(root, "scripts", "capture-ui-signoff-screenshots.mjs");

const SURFACES = {
  dashboard: {
    references: [
      ".memory-bank/design-refs/screens/04-dashboard-galaxy-spiral.png",
      ".memory-bank/design-refs/screens/01-glass-panel-wave-border.png",
      ".memory-bank/design-refs/screens/02-mobile-feature-grid-dfi-dex.png",
    ],
    captureCommand: (batch) => [process.execPath, [captureScript, "--batch", batch]],
    captureOutputs: (batch) => {
      const lower = String(batch).toLowerCase();
      return [
        `docs/screenshots/ui-signoff/batch-${lower}/dashboard-375.png`,
        `docs/screenshots/ui-signoff/batch-${lower}/dashboard-768.png`,
        `docs/screenshots/ui-signoff/batch-${lower}/dashboard-1440.png`,
      ];
    },
    acceptanceAnchors: [
      "three-column hierarchy: swap / chart / stats",
      "galaxy + aurora identity remains visible",
      "thick neon / glass border treatment vs wave-border reference",
      "bottom feature tiles preserve distinct identity at 375/768/1440",
    ],
  },
  splash: {
    references: [
      ".memory-bank/design-refs/boot/boot-master-square-landscape.mp4",
      ".memory-bank/design-refs/boot/boot-master-portrait.mp4",
      ".memory-bank/design-refs/brand/ion-dex-brand-logo.png",
    ],
    captureCommand: null,
    captureOutputs: () => [],
    acceptanceAnchors: [
      "brand/logo identity matches master asset",
      "boot overlay dominates first paint visually",
      "overlay exits automatically when contract requires auto-enter",
      "splash proof must distinguish DOM, behavior, and visual dominance",
    ],
  },
};

function parseArgs(argv) {
  const result = { surface: "dashboard", batch: "B", execute: false };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--execute") result.execute = true;
    else if (arg === "--surface" && argv[i + 1]) result.surface = argv[++i];
    else if (arg.startsWith("--surface=")) result.surface = arg.split("=", 2)[1];
    else if (arg === "--batch" && argv[i + 1]) result.batch = argv[++i];
    else if (arg.startsWith("--batch=")) result.batch = arg.split("=", 2)[1];
  }
  return result;
}

function ensureSurface(name) {
  if (!SURFACES[name]) {
    throw new Error(`Unknown surface: ${name}`);
  }
  return SURFACES[name];
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with ${result.status ?? 1}`);
  }
}

function stamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function writeChecklist(outDir, surfaceName, batch, surface, outputs) {
  const md = `# Visual Acceptance Run — ${surfaceName} — Batch ${batch}\n\n` +
`## References\n` +
surface.references.map((p) => `- \`${p}\``).join("\n") + `\n\n` +
`## Acceptance anchors\n` +
surface.acceptanceAnchors.map((p) => `- ${p}`).join("\n") + `\n\n` +
`## Captured outputs\n` +
(outputs.length ? outputs.map((p) => `- \`${p}\``).join("\n") : `- No automated captures for this surface yet`) + `\n\n` +
`## Evidence grades\n- [ ] DOM/text confirmed\n- [ ] behavior confirmed\n- [ ] visual signoff confirmed\n\n` +
`## Gap table\n| # | Dimension | Reference requirement | Current implementation | Grade | Root cause | Fix file |\n|---|-----------|-----------------------|------------------------|-------|------------|----------|\n| 1 |           |                       |                        |       |            |          |\n\n` +
`## Blunt report\n1. Fixed\n2. Not fixed\n3. Unverified or blocked\n4. Next highest-value action\n`;
  writeFileSync(join(outDir, "CHECKLIST.md"), md, "utf8");
}

const { surface: surfaceName, batch, execute } = parseArgs(process.argv);
const surface = ensureSurface(surfaceName);
const runId = stamp();
const evidenceDir = join(root, "docs", "screenshots", "visual-acceptance-runs", `${surfaceName}-${String(batch).toLowerCase()}-${runId}`);
mkdirSync(evidenceDir, { recursive: true });

if (execute && surface.captureCommand) {
  const [cmd, args] = surface.captureCommand(batch);
  run(cmd, args);
}

const outputFiles = surface.captureOutputs(batch);
for (const rel of [...surface.references, ...outputFiles]) {
  const src = resolve(root, rel);
  if (!existsSync(src)) continue;
  const dest = join(evidenceDir, basename(src));
  copyFileSync(src, dest);
}

writeChecklist(evidenceDir, surfaceName, batch, surface, outputFiles);

console.log(`surface=${surfaceName}`);
console.log(`batch=${batch}`);
console.log(`execute=${execute ? "yes" : "no"}`);
console.log(`evidence_dir=${evidenceDir}`);
for (const rel of surface.references) {
  console.log(`reference=${rel}`);
}
for (const rel of outputFiles) {
  console.log(`capture=${rel}`);
}
