#!/usr/bin/env node
/**
 * Auto-Watcher — Monitors project files and auto-runs audit pipeline on change.
 * 
 * Watches .sol, .fc, .ts, .tsx files. On change → debounce 3s → run audit.
 * This is the "auto-execute, auto-run" engine Cursor needs.
 * 
 * Usage: node scripts/auto-watcher.mjs
 * Or as background process: Start-Process node -ArgumentList "scripts/auto-watcher.mjs" -NoNewWindow
 */

import { watch } from 'node:fs';
import { execSync, spawn } from 'node:child_process';
import { join, extname } from 'node:path';
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';

const ROOT = 'D:\\openclaw-tools\\ion-dex-nuke';
const LOG_DIR = join(ROOT, 'reports');
const LOG_FILE = join(LOG_DIR, 'audit-history.log');
const ERROR_FILE = join(LOG_DIR, 'audit-errors.md');

// Init
if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });

const FORGE = 'D:\\openclaw-tools\\foundry\\bin\\forge.exe';
const SLITHER = 'D:\\openclaw-tools\\venv\\Scripts\\slither.exe';
const SOLHINT = 'solhint';

let debounceTimer = null;
let lastAudit = 0;
const DEBOUNCE_MS = 3000;
const MIN_INTERVAL_MS = 10000; // Don't audit more than once every 10s

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_FILE, line + '\n');
}

function errorReport(label, output) {
  const ts = new Date().toISOString();
  appendFileSync(ERROR_FILE, `\n## ${label} — ${ts}\n\`\`\`\n${output.slice(0, 5000)}\n\`\`\`\n`);
}

function run(label, cmd, cwd, timeout = 60000) {
  try {
    const out = execSync(cmd, { cwd, timeout, encoding: 'utf8', stdio: ['pipe','pipe','pipe'] });
    const ok = !out.includes('FAIL') || label.includes('solhint');
    if (!ok) errorReport(label, out);
    return { ok, out };
  } catch (e) {
    const out = e.stderr || e.message || '';
    errorReport(label, out);
    return { ok: false, out };
  }
}

function auditSolFiles(files) {
  log(`🔄 AUDIT triggered by: ${files.slice(0, 3).map(f => f.replace(ROOT,'')).join(', ')}`);

  const results = [];
  const cwd = join(ROOT, 'contracts', 'bsc');

  // 1. Forge build
  const buildResult = run('forge build', `${FORGE} build`, cwd, 60000);
  results.push({ name: 'forge build', ok: buildResult.ok });

  // 2. If build OK, run tests
  let testOk = true;
  if (buildResult.ok) {
    const testResult = run('forge test', `${FORGE} test`, cwd, 120000);
    testOk = testResult.ok;
    results.push({ name: 'forge test', ok: testOk });
  }

  // 3. Solhint
  const solhintResult = run('solhint', `${SOLHINT} "${join(ROOT, 'contracts', 'bsc', 'src', '**', '*.sol')}"`, ROOT, 15000);
  results.push({ name: 'solhint', ok: solhintResult.ok });

  // Summary
  const fails = results.filter(r => !r.ok);
  if (fails.length === 0) {
    log(`✅ ALL GREEN | forge build + test + solhint`);
  } else {
    log(`❌ ${fails.length} FAILURES: ${fails.map(f => f.name).join(', ')}`);
  }
}

function auditFuncFiles(files) {
  log(`⚡ FUNC AUDIT: ${files.length} file(s) changed`);
  try {
    execSync('node scripts/compile-func.mjs', { cwd: ROOT, timeout: 30000, stdio: 'pipe' });
    log('✅ FunC compile OK');
  } catch (e) {
    log('❌ FunC compile FAILED');
    errorReport('func-compile', e.stderr || e.message);
  }
}

// ─── WATCHERS ───

function watchDir(dir, handler) {
  if (!existsSync(dir)) return;
  watch(dir, { recursive: true }, (event, filename) => {
    if (!filename) return;

    const now = Date.now();
    if (now - lastAudit < MIN_INTERVAL_MS) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      lastAudit = now;
      handler([join(dir, filename)]);
    }, DEBOUNCE_MS);
  });
}

// Solidity watchers
const solDirs = [
  join(ROOT, 'contracts', 'bsc', 'src'),
  join(ROOT, 'contracts', 'bsc', 'test'),
  join(ROOT, 'contracts', 'bsc', 'script'),
];
solDirs.forEach(d => watchDir(d, auditSolFiles));

// FunC watchers
const funcDirs = [
  join(ROOT, 'contracts', 'ion'),
];
funcDirs.forEach(d => watchDir(d, auditFuncFiles));

log('👁️ Auto-Watcher started — watching .sol / .fc files');
log(`   Debounce: ${DEBOUNCE_MS}ms | Min interval: ${MIN_INTERVAL_MS}ms`);
log(`   Logs: ${LOG_FILE}`);
log(`   Errors: ${ERROR_FILE}`);

// Keep alive — watchdog heartbeat every 5 min
setInterval(() => {
  // Just keep the process alive, heartbeat logged at trace level
}, 300000);

// Graceful shutdown
process.on('SIGINT', () => {
  log('🛑 Auto-Watcher stopped');
  process.exit(0);
});
process.on('SIGTERM', () => {
  log('🛑 Auto-Watcher stopped');  
  process.exit(0);
});
