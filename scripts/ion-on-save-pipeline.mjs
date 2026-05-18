// ion-on-save-pipeline.mjs — runs on EVERY save workflow the user opted into:
// 1) quick UTF-8 / NUL / BOM check on the saved file (when applicable)
// 2) FunC compilation gate: node scripts/compile-func.mjs (all contracts/ion targets)
//
// Entry points:
//   - Cursor Hooks: `--cursor-hook` + JSON on stdin (afterFileEdit / afterTabFileEdit).
//   - VS Code "Run On Save": pass absolute "${file}" as first argument (no stdin).
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.normalize(path.join(SCRIPTS_DIR, '..'));

const INCLUDE_ENCODING_EXT = /\.(fc|tsx?|jsx?|mjs|cjs|json|jsonc|md|sol|yaml|yml|html|css|scss|ps1|toml)$/i;

function parseHookFilePath() {
  /** @returns {string} */
  let raw = '';
  try {
    raw = fs.readFileSync(0, 'utf8');
  } catch {
    raw = '';
  }
  raw = typeof raw === 'string' ? raw.trim() : '';
  if (!raw) return '';
  try {
    const j = JSON.parse(raw);
    if (typeof j.file_path === 'string' && j.file_path.trim()) {
      return j.file_path.trim();
    }
  } catch {
    /* ignore */
  }
  return '';
}

function shouldSkipHeavyPath(norm) {
  const p = norm.toLowerCase().replace(/\//g, path.sep);
  return (
    p.includes(`${path.sep}node_modules${path.sep}`) ||
    p.includes(`${path.sep}.git${path.sep}`) ||
    p.includes(`${path.sep}dist${path.sep}`) ||
    p.includes(`${path.sep}build${path.sep}`) ||
    p.includes(`${path.sep}out${path.sep}`) ||
    p.includes(`${path.sep}coverage${path.sep}`)
  );
}

/** @returns {{ ok: true } | { ok: false; reason: string }} */
function encodingQuickCheck(norm) {
  if (!existsReadable(norm)) {
    return { ok: false, reason: `file not readable: ${norm}` };
  }
  if (!INCLUDE_ENCODING_EXT.test(norm)) {
    return { ok: true };
  }

  let buf;
  try {
    buf = fs.readFileSync(norm);
  } catch (e) {
    return { ok: false, reason: `read failed: ${norm}: ${/** @type {Error} */ (e).message}` };
  }
  if (!buf?.length) {
    return { ok: true };
  }
  if (buf.includes(0)) {
    return { ok: false, reason: `NUL byte detected: ${norm}` };
  }
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return { ok: false, reason: `UTF-16 LE BOM: ${norm}` };
  }
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    return { ok: false, reason: `UTF-16 BE BOM: ${norm}` };
  }
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return { ok: false, reason: `UTF-8 BOM (repo requires no BOM): ${norm}` };
  }
  return { ok: true };
}

function existsReadable(p) {
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function runCompileFunc() {
  const scriptPath = path.join(REPO_ROOT, 'scripts', 'compile-func.mjs');
  if (!existsReadable(scriptPath)) {
    console.error('[ion-on-save] Missing scripts/compile-func.mjs; skip compile.');
    return 0;
  }
  const r = spawnSync(process.execPath, [scriptPath], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: { ...process.env },
  });
  if (r.error) {
    console.error('[ion-on-save] compile-func spawn error:', /** @type {Error} */ (r.error).message);
    return 1;
  }
  if (typeof r.status === 'number') {
    return r.status;
  }
  return 1;
}

/** @returns {{ ok: true } | { ok: false; reason: string }} */
function scanGarbage(filePath) {
  if (!/\.fc$/.test(filePath)) return { ok: true };
  
  let lines;
  try {
    lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  } catch (e) {
    return { ok: false, reason: `read failed: ${e.message}` };
  }

  // Known garbage patterns (case-insensitive)
  const GARBAGE_PATTERNS = [
    /^[a-z]+['\u2019]?[a-z]+$/i,  // pinyin garbage like "bian'jibianji", "hi", "test"
    /^(hello|hi|test|asdf|todo|fixme|wtf|foo|bar|baz|blah|meh|temp|tmp|xxx|ggg|abc|123|qwerty|fubar)$/i,
    /^[a-z]{1,5}$/i,  // single short random words not in comment
    /^[a-z]+\d+[a-z]*$/i,  // like "thing123"
  ];

  const violations = [];
  let blankStreak = 0;
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trimEnd();
    const lineNum = i + 1;

    // Track block comments
    if (trimmed.startsWith('{-')) inBlockComment = true;
    if (trimmed.endsWith('-}')) { inBlockComment = false; continue; }
    if (inBlockComment) continue;

    // Track blank lines
    if (trimmed === '') {
      blankStreak++;
      if (blankStreak > 2) {
        violations.push(`Line ${lineNum}: excessive blank lines (>2 consecutive)`);
        blankStreak = 0; // reset to avoid flooding
      }
      continue;
    } else {
      blankStreak = 0;
    }

    // Skip comments
    if (trimmed.startsWith(';;')) continue;

    // Check for garbage patterns
    for (const pattern of GARBAGE_PATTERNS) {
      if (pattern.test(trimmed)) {
        violations.push(`Line ${lineNum}: garbage detected "${trimmed.slice(0, 40)}"`);
        break;
      }
    }
  }

  if (violations.length > 0) {
    return { ok: false, reason: violations.slice(0, 5).join('; ') };
  }
  return { ok: true };
}

function main() {
  const hookMode = process.argv.includes('--cursor-hook');
  let fp = '';

  if (hookMode) {
    fp = parseHookFilePath();
  } else {
    fp = process.argv[2]
      ? path.normalize(process.argv[2])
      : '';
  }

  if (!fp) {
    /** Cursor may emit hooks with unreadable stdin; fail open */
    console.warn('[ion-on-save] No file_path; exiting 0.');
    process.exitCode = 0;
    return;
  }

  fp = path.normalize(fp);
  const normAbs = fp;

  if (shouldSkipHeavyPath(normAbs)) {
    console.warn('[ion-on-save] Skipped artifact path:', normAbs);
    process.exitCode = 0;
    return;
  }

  const enc = encodingQuickCheck(normAbs);
  if (!enc.ok) {
    console.error('[ion-on-save] Encoding check FAILED:', enc.reason);
    process.exitCode = 1;
    return;
  }

  // Garbage scan for .fc files
  if (/\.fc$/.test(normAbs)) {
    const garbage = scanGarbage(normAbs);
    if (!garbage.ok) {
      console.error('[ion-on-save] 🚫 GARBAGE DETECTED:', garbage.reason);
      console.error('[ion-on-save] Fix the garbage before committing!');
      process.exitCode = 1;
      return;
    }
    console.log('[ion-on-save] Garbage scan: clean');
  }

  const code = runCompileFunc();
  process.exitCode = code ?? 1;
}

main();
