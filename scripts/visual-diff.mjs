/**
 * Visual Regression Diff Runner
 * 
 * Usage: node scripts/visual-diff.mjs [page-name]
 * Example: node scripts/visual-diff.mjs dashboard
 * 
 * Steps:
 * 1. Takes Playwright screenshot of specified page
 * 2. Compares against baseline (if exists)
 * 3. Outputs diff report + pixel difference %
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(PROJECT_ROOT, '.visual-screenshots');

const PAGES = {
  home: '/',
  swap: '/swap',
  pool: '/pool',
  stake: '/stake',
  bridge: '/bridge',
};

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const THRESHOLD = 0.02; // 2% pixel difference = fail

async function takeScreenshot(pageName, url) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // Wait for animations
  
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${pageName}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  
  await browser.close();
  return screenshotPath;
}

async function compareWithBaseline(pageName) {
  const currentPath = path.join(SCREENSHOTS_DIR, `${pageName}.png`);
  const baselinePath = path.join(SCREENSHOTS_DIR, `${pageName}-baseline.png`);
  const diffPath = path.join(SCREENSHOTS_DIR, `${pageName}-diff.png`);

  if (!fs.existsSync(baselinePath)) {
    // First run — save as baseline
    fs.copyFileSync(currentPath, baselinePath);
    return { status: 'baseline_created', diffPercent: 0 };
  }

  const current = PNG.sync.read(fs.readFileSync(currentPath));
  const baseline = PNG.sync.read(fs.readFileSync(baselinePath));

  if (current.width !== baseline.width || current.height !== baseline.height) {
    return { status: 'size_mismatch', diffPercent: 100, error: 'Dimension mismatch' };
  }

  const diff = new PNG({ width: current.width, height: current.height });
  const mismatchedPixels = pixelmatch(
    current.data, baseline.data, diff.data,
    current.width, current.height,
    { threshold: 0.1 }
  );

  const totalPixels = current.width * current.height;
  const diffPercent = mismatchedPixels / totalPixels;

  fs.writeFileSync(diffPath, PNG.sync.write(diff));

  return {
    status: diffPercent > THRESHOLD ? 'failed' : 'passed',
    diffPercent: (diffPercent * 100).toFixed(2),
    mismatchedPixels,
    totalPixels,
    diffImagePath: diffPath,
  };
}

async function main() {
  const pageName = process.argv[2];
  
  if (!pageName) {
    console.log('Available pages:', Object.keys(PAGES).join(', '));
    console.log('Usage: node scripts/visual-diff.mjs <page-name>');
    console.log('       node scripts/visual-diff.mjs all');
    process.exit(0);
  }

  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  if (pageName === 'all') {
    const results = {};
    for (const [name, url] of Object.entries(PAGES)) {
      console.log(`\n📸 ${name}...`);
      await takeScreenshot(name, url);
      const result = await compareWithBaseline(name);
      results[name] = result;
      console.log(`   ${result.status === 'passed' ? '✅' : result.status === 'baseline_created' ? '🆕' : '❌'} ${result.status} | diff: ${result.diffPercent}%`);
    }
    
    // Summary
    const failed = Object.entries(results).filter(([_, r]) => r.status === 'failed');
    console.log(`\n${'='.repeat(40)}`);
    console.log(`Total: ${Object.keys(results).length} | Failed: ${failed.length}`);
    if (failed.length > 0) {
      console.log('Failed pages:', failed.map(([n]) => n).join(', '));
      process.exit(1);
    }
  } else {
    const url = PAGES[pageName];
    if (!url) {
      console.error(`Unknown page: ${pageName}`);
      console.log('Available pages:', Object.keys(PAGES).join(', '));
      process.exit(1);
    }

    console.log(`📸 ${pageName}...`);
    await takeScreenshot(pageName, url);
    const result = await compareWithBaseline(pageName);
    console.log(`${result.status === 'passed' ? '✅' : result.status === 'baseline_created' ? '🆕' : '❌'} ${result.status} | diff: ${result.diffPercent}%`);
    
    if (result.diffPercent > 0) {
      console.log(`   Mismatched: ${result.mismatchedPixels} / ${result.totalPixels} pixels`);
      console.log(`   Diff image: ${result.diffImagePath}`);
    }
  }
}

main().catch(console.error);
