// compile-func.mjs — Compile FunC contracts for ION DEX
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { compileFunc } from '@ton-community/func-js';

const ROOT = 'D:/openclaw-tools/ion-dex-nuke/contracts/ion';

function collectFiles(dir, files = {}) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectFiles(full, files);
    } else if (entry.endsWith('.fc')) {
      const key = full.replace(/\\/g, '/');
      files[key] = readFileSync(full, 'utf8');
    }
  }
  return files;
}

// Also collect funcbox deps
const funcboxDir = join(ROOT, 'node_modules/@ston-fi/funcbox');
const funcboxContractDir = join(funcboxDir, 'contracts');
const deps = {};

// Recursively collect all .fc files, including funcbox
function collectAll(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.')) collectAll(full);
    } else if (entry.name.endsWith('.fc')) {
      deps[full.replace(/\\/g, '/')] = readFileSync(full, 'utf8');
    }
  }
}

collectAll(ROOT);
collectAll(funcboxDir);

const rootFiles = Object.keys(deps).filter(f => 
  !f.includes('node_modules/') && 
  !f.endsWith('_test.fc') &&
  !f.endsWith('test_case.fc') &&
  !f.endsWith('test_empty.fc') &&
  !f.endsWith('.test.fc')
);

console.log(`Total .fc files: ${Object.keys(deps).length}`);
console.log(`Root contracts: ${rootFiles.length}`);

for (const target of rootFiles) {
  const name = target.split('/').pop();
  try {
    const result = await compileFunc({
      targets: [target],
      sources: deps
    });
    if (result.status === 'error') {
      const msg = result.message.substring(0, 120);
      console.log(`  ${name} ❌ ${msg}`);
    } else {
      console.log(`  ${name} ✅  (${result.codeBoc?.length || '?'} bytes)`);
    }
  } catch (e) {
    console.log(`  ${name} ❌ ${e.message?.substring(0, 100)}`);
  }
}
