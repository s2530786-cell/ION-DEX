// func-contract-test.mjs — P0-2 ION FunC contract test gate (beyond compile-func.mjs)
// 1) compile-func.mjs (22/22 fragment + entry compile)
// 2) contracts/ion compile-all.js artifacts (6 deployable modules)
// 3) SHA-256 regression on each entry codeBoc (contracts/ion/test/bytecode-golden.json)
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ION_ROOT = join(REPO_ROOT, 'contracts', 'ion');
const BUILD_DIR = join(ION_ROOT, 'build');
const GOLDEN_PATH = join(ION_ROOT, 'test', 'bytecode-golden.json');

const ENTRIES = [
  'deployer.fc',
  'lp_account.fc',
  'lp_wallet.fc',
  'pool.fc',
  'router.fc',
  'vault.fc',
];

const MIN_CODE_BOC_BYTES = 64;

function run(cmd, args, cwd = REPO_ROOT) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', env: process.env });
  if (r.error) {
    console.error(`[func-contract-test] spawn error: ${r.error.message}`);
    process.exit(1);
  }
  if (typeof r.status === 'number' && r.status !== 0) {
    process.exit(r.status);
  }
}

function sha256Boc(codeBoc) {
  return createHash('sha256').update(Buffer.from(codeBoc, 'base64')).digest('hex');
}

function loadGolden() {
  if (!existsSync(GOLDEN_PATH)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(GOLDEN_PATH, 'utf8'));
  } catch (e) {
    console.error(`[func-contract-test] invalid golden JSON: ${/** @type {Error} */ (e).message}`);
    process.exit(1);
  }
}

function assertArtifacts(golden, updateGolden) {
  let failed = false;
  const nextGolden = { ...golden };
  const checked = [];

  for (const entry of ENTRIES) {
    const base = entry.replace(/\.fc$/u, '');
    const artifactPath = join(BUILD_DIR, `${base}.json`);
    if (!existsSync(artifactPath)) {
      console.error(`  ${base} ❌ missing artifact ${artifactPath}`);
      failed = true;
      continue;
    }

    let artifact;
    try {
      artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));
    } catch (e) {
      console.error(`  ${base} ❌ artifact parse error: ${/** @type {Error} */ (e).message}`);
      failed = true;
      continue;
    }

    const codeBoc = typeof artifact.codeBoc === 'string' ? artifact.codeBoc : '';
    if (!codeBoc) {
      console.error(`  ${base} ❌ empty codeBoc in artifact`);
      failed = true;
      continue;
    }

    const byteLen = Buffer.from(codeBoc, 'base64').length;
    if (byteLen < MIN_CODE_BOC_BYTES) {
      console.error(`  ${base} ❌ codeBoc too small (${byteLen} bytes)`);
      failed = true;
      continue;
    }

    const hash = sha256Boc(codeBoc);
    const prev = golden[base];
    if (!prev) {
      nextGolden[base] = hash;
      console.log(`  ${base} ✅  artifact ${byteLen} bytes (golden recorded)`);
    } else if (prev !== hash) {
      console.error(`  ${base} ❌ bytecode hash drift`);
      console.error(`       expected ${prev}`);
      console.error(`       got      ${hash}`);
      failed = true;
    } else {
      console.log(`  ${base} ✅  artifact ${byteLen} bytes (golden match)`);
    }
    checked.push(base);
  }

  if (updateGolden && checked.length > 0) {
    mkdirSync(dirname(GOLDEN_PATH), { recursive: true });
    writeFileSync(GOLDEN_PATH, `${JSON.stringify(nextGolden, null, 2)}\n`, 'utf8');
    console.log(`[func-contract-test] wrote ${GOLDEN_PATH}`);
  }

  return failed ? 1 : 0;
}

function main() {
  const updateGolden = process.argv.includes('--update-golden');

  console.log('=== ION FunC contract test gate ===\n');

  console.log('Step 1/3: compile-func.mjs (fragments + entries)');
  run(process.execPath, ['scripts/compile-func.mjs']);

  console.log('\nStep 2/3: contracts/ion compile-all.js (deployable artifacts)');
  run(process.execPath, ['scripts/compile-all.js'], ION_ROOT);

  console.log('\nStep 3/3: bytecode golden regression');
  const golden = loadGolden();
  const code = assertArtifacts(golden, updateGolden || Object.keys(golden).length === 0);
  if (code !== 0) {
    console.error('\n[func-contract-test] FAILED');
    process.exit(code);
  }

  console.log('\n[func-contract-test] ALL GREEN');
}

main();
