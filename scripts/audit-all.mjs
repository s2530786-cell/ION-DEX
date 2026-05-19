#!/usr/bin/env node
/**
 * Cursor Agent Tool Belt — Auto Audit Script
 * 
 * Runs all installed security/code-quality tools on the project.
 * Called by: Cursor Agent, CI pipeline, or manual `node scripts/audit-all.mjs`
 * 
 * Tool belt installed:
 * - forge (Foundry) — compile + test Solidity
 * - solhint — Solidity linter
 * - slither — Static security analyzer
 * - aider — AI pair programming CLI
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'D:\\openclaw-tools\\ion-dex-nuke';
const VENV_PYTHON = 'D:\\openclaw-tools\\venv\\Scripts\\python.exe';
const SOLHINT = 'solhint';
const SLITHER = 'D:\\openclaw-tools\\venv\\Scripts\\slither.exe';

const results = [];
let pass = 0, fail = 0;

function run(label, cmd, opts = {}) {
  const cwd = opts.cwd || ROOT;
  const timeout = opts.timeout || 60000;
  try {
    const out = execSync(cmd, { cwd, timeout, encoding: 'utf8', stdio: ['pipe','pipe','pipe'] });
    const ok = out.includes('PASS') || !out.includes('Error') || opts.allowOutput;
    if (ok) { pass++; results.push(`✅ ${label}`); }
    else { fail++; results.push(`❌ ${label}`); }
    if (opts.verbose) console.log(out.slice(0, 1000));
    return { ok, out };
  } catch (e) {
    if (opts.optional) {
      results.push(`⚠️ ${label} (skipped: not installed)`);
      return { ok: true, out: '' };
    }
    fail++;
    results.push(`❌ ${label}: ${e.message?.slice(0, 120)}`);
    return { ok: false, out: e.stderr || e.message };
  }
}

// ─── 1. FORGE COMPILE ───
function auditForge() {
  console.log('\n🔨 FORGE (Foundry)');
  run('forge build', `D:\\openclaw-tools\\foundry\\bin\\forge.exe build`, {
    cwd: join(ROOT, 'contracts', 'bsc'),
    timeout: 120000
  });
}

// ─── 2. FORGE TEST ───
function auditForgeTest() {
  console.log('\n🧪 FORGE TEST');
  run('forge test', `D:\\openclaw-tools\\foundry\\bin\\forge.exe test --no-match-path "**/attackers/**"`, {
    cwd: join(ROOT, 'contracts', 'bsc'),
    timeout: 300000
  });
}

// ─── 3. SOLHINT ───
function auditSolhint() {
  console.log('\n📏 SOLHINT');
  const files = join(ROOT, 'contracts', 'bsc', 'src', '**', '*.sol');
  run('solhint', `${SOLHINT} "${files}"`, { timeout: 30000 });
}

// ─── 4. SLITHER ───
function auditSlither() {
  console.log('\n🔍 SLITHER');
  if (!existsSync(SLITHER)) {
    results.push('⚠️ slither (not installed in venv)');
    return;
  }
  const contracts = join(ROOT, 'contracts', 'bsc', 'src');
  run('slither', `${SLITHER} "${contracts}" --solc D:\\openclaw-tools\\foundry\\bin\\forge.exe`, {
    timeout: 180000,
    allowOutput: true
  });
}

// ─── 5. COMPILE FUNC ───
function auditFunc() {
  console.log('\n⚡ FUNC');
  const script = join(ROOT, 'scripts', 'compile-func.mjs');
  if (existsSync(script)) {
    run('compile-func', `node "${script}"`, { timeout: 60000 });
  } else {
    results.push('⚠️ compile-func.mjs (not found)');
  }
}

// ─── 6. FRONTEND BUILD ───
function auditFrontend() {
  console.log('\n🎨 FRONTEND');
  const fe = join(ROOT, 'frontend');
  if (!existsSync(join(fe, 'package.json'))) {
    results.push('⚠️ frontend (no package.json)');
    return;
  }
  run('tsc --noEmit', 'npx tsc --noEmit', { cwd: fe, timeout: 60000 });
  run('vite build', 'npx vite build', { cwd: fe, timeout: 120000 });
}

// ─── 7. BACKEND BUILD ───
function auditBackend() {
  console.log('\n⚙️ BACKEND');
  const be = join(ROOT, 'backend');
  if (!existsSync(join(be, 'package.json'))) {
    results.push('⚠️ backend (no package.json)');
    return;
  }
  run('tsc --noEmit', 'npx tsc --noEmit', { cwd: be, timeout: 60000 });
}

// ─── MAIN ───
console.log('═══════════════════════════════════════');
console.log('🛡️  ION DEX — Full Audit Pipeline');
console.log('═══════════════════════════════════════');

auditForge();
auditForgeTest();
auditSolhint();
auditSlither();
auditFunc();
auditFrontend();
auditBackend();

console.log('\n═══════════════════════════════════════');
console.log('📊 AUDIT RESULTS');
console.log('═══════════════════════════════════════');
for (const r of results) console.log(r);
console.log(`\n✅ ${pass} | ❌ ${fail} | ⚠️ ${results.length - pass - fail}`);
console.log(fail > 0 ? '\n🔴 AUDIT FAILED — fix errors before proceeding' : '\n🟢 ALL CHECKS PASSED');

process.exit(fail > 0 ? 1 : 0);
