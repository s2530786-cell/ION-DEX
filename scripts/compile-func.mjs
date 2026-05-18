// compile-func.mjs — Compile FunC contracts for ION DEX
// Each standalone deployable uses its own pragma + includes + recv_internal.
// Library/getter fragments are validated via an ephemeral probe that pulls the
// right include DAG and defines a minimal recv_internal so Fift can emit `main`.
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { compileFunc } from '@ton-community/func-js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'contracts', 'ion');
function toPosix(p) {
  return p.replace(/\\/g, '/');
}
const ROOT_POSIX = toPosix(ROOT).replace(/\/$/, '');

/** @returns {string} path relative to contracts/ion (POSIX) */
function relIon(absPath) {
  const abs = toPosix(absPath);
  const prefix = ROOT_POSIX + '/';
  if (!abs.startsWith(prefix)) {
    throw new Error(`compile-func: path outside ROOT: ${absPath}`);
  }
  return abs.slice(prefix.length);
}

function collectFiles(dir, files = {}) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectFiles(full, files);
    } else if (entry.endsWith('.fc')) {
      const key = toPosix(full);
      files[key] = readFileSync(full, 'utf8');
    }
  }
  return files;
}

// Also collect funcbox deps
const funcboxDir = join(ROOT, 'node_modules/@ston-fi/funcbox');
const deps = {};

// Recursively collect all .fc files, including funcbox
function collectAll(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.')) collectAll(full);
    } else if (entry.name.endsWith('.fc')) {
      deps[toPosix(full)] = readFileSync(full, 'utf8');
    }
  }
}

collectAll(ROOT);
collectAll(funcboxDir);

const probeKey = ROOT_POSIX + '/__ion_fragment_probe.fc';

/** Standalone deployed contracts compile as-is */
const ENTRY_BASES = new Set([
  'deployer.fc',
  'lp_account.fc',
  'lp_wallet.fc',
  'pool.fc',
  'router.fc',
  'vault.fc',
]);

/** recv_internal stub so codegen produces TVM entry / Fift main */
const RECV_STUB =
  '\n() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {\n}\n';

/**
 * Pre-built inclusion DAG probes for non-entry files under contracts/ion.
 * Keys match relIon(...) from ROOT.
 *
 * Fragments intentionally avoid wrapping with extra #pragma blocks when they
 * are already prefixed by `#pragma version` — included files carry their pragma.
 *
 * Keys must mirror every non-entry `.fc` that `collectAll(ROOT)` returns.
 *
 * Pool order matches pool.fc getter chain; router matches router.fc deps.
 *
 * Keep this mapping updated whenever add/remove/move FunC fragments.
 */
const FRAGMENT_PROBE_BODY = /** @type {Record<string,string>} */ ({
  'common/common.fc': '#pragma version >=0.4.4;\n#include "common/common.fc";',
  'common/errors.fc': '#pragma version >=0.4.4;\n#include "common/errors.fc";',
  'common/params.fc':
    '#pragma version >=0.4.4;\n#include "common/errors.fc";\n#include "common/params.fc";',
  'common/contracts.fc':
    '#pragma version >=0.4.4;\n' +
      '#include "common/errors.fc";\n' +
      '#include "common/params.fc";\n' +
      '#include "common/contracts.fc";',
  'common/gas.fc':
    '#pragma version >=0.4.4;\n' +
      '#include "common/errors.fc";\n' +
      '#include "common/params.fc";\n' +
      '#include "common/gas.fc";',
  'common/op.fc':
    '#pragma version >=0.4.4;\n' +
      '#include "node_modules/@ston-fi/funcbox/autoload.fc";\n' +
      '#include "common/op.fc";',
  'common/utils.fc':
    '#pragma version >=0.4.4;\n' +
      '#include "node_modules/@ston-fi/funcbox/autoload.fc";\n' +
      '#include "common/errors.fc";\n' +
      '#include "common/params.fc";\n' +
      '#include "common/op.fc";\n' +
      '#include "common/gas.fc";\n' +
      '#include "common/contracts.fc";\n' +
      '#include "common/utils.fc";',

  'pool/storage.fc':
    '#pragma version >=0.4.4;\n#include "common/common.fc";\n#include "pool/storage.fc";',
  'pool/headers.fc': '#pragma version >=0.4.4;\n#include "pool/headers.fc";',
  'pool/pools/constant_product.fc':
    '#pragma version >=0.4.4;\n' +
      '#include "common/common.fc";\n' +
      '#include "pool/storage.fc";\n' +
      '#include "pool/pools/constant_product.fc";',
  'pool/pools/stableswap.fc':
    '#pragma version >=0.4.4;\n' +
      '#include "common/common.fc";\n' +
      '#include "pool/storage.fc";\n' +
      '#include "pool/pools/constant_product.fc";\n' +
      '#include "pool/pools/stableswap.fc";',
  'pool/get.fc':
    '#pragma version >=0.4.4;\n' +
      '#include "common/common.fc";\n' +
      '#include "pool/storage.fc";\n' +
      '#include "pool/headers.fc";\n' +
      '#include "pool/pools/constant_product.fc";\n' +
      '#include "pool/pools/stableswap.fc";\n' +
      '#include "pool/get.fc";',

  'router/storage.fc':
    '#pragma version >=0.4.4;\n#include "common/common.fc";\n#include "router/storage.fc";',
  'router/utils.fc':
    '#pragma version >=0.4.4;\n' +
      '#include "common/common.fc";\n' +
      '#include "router/storage.fc";\n' +
      '#include "router/utils.fc";',
  'router/dex.fc': '#pragma version >=0.4.4;\n#include "router/dex.fc";',
  'router/get.fc':
    '#pragma version >=0.4.4;\n' +
      '#include "common/common.fc";\n' +
      '#include "router/storage.fc";\n' +
      '#include "router/utils.fc";\n' +
      '#include "router/get.fc";',
});

const rootFiles = Object.keys(deps).filter(
  (f) =>
    !f.includes('node_modules/') &&
    !f.endsWith('_test.fc') &&
    !f.endsWith('test_case.fc') &&
    !f.endsWith('test_empty.fc') &&
    !f.endsWith('.test.fc') &&
    f !== probeKey &&
    !f.endsWith('/__ion_fragment_probe.fc'),
);

console.log(`Total .fc files: ${Object.keys(deps).length}`);
console.log(`Root contracts / fragments checked: ${rootFiles.length}`);
console.log(
  `(entries ${ENTRY_BASES.size} direct; ${Object.keys(FRAGMENT_PROBE_BODY).length} fragment probes configured)`,
);

let failed = false;

for (const targetAbs of rootFiles) {
  const rel = relIon(targetAbs);
  const title = targetAbs.split(/[/\\]/).pop();

  /** @type {Record<string,string>} */
  let sourcesPayload = deps;
  let compileTargets = /** @type {string[]} */ ([targetAbs]);

  try {
    const basename = rel.split('/').pop() || '';

    const isPrimary =
      basename === rel && ENTRY_BASES.has(basename); // deployer.fc at root etc.

    if (!isPrimary) {
      const body = FRAGMENT_PROBE_BODY[rel];
      if (!body) {
        console.log(`  ${title} ❌ missing probe body for fragment rel=${rel}`);
        failed = true;
        continue;
      }
      compileTargets = [probeKey];
      sourcesPayload = { ...deps, [probeKey]: body + RECV_STUB };
    }

    const result = await compileFunc({
      targets: compileTargets,
      sources: sourcesPayload,
    });

    if (result.status === 'error') {
      const msg = result.message.substring(0, 320);
      console.log(`  ${title} ❌ ${msg}`);
      failed = true;
    } else {
      console.log(`  ${title} ✅  (${result.codeBoc?.length || '?'} bytes)`);
    }
  } catch (e) {
    console.log(`  ${title} ❌ ${e.message?.substring(0, 200)}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
