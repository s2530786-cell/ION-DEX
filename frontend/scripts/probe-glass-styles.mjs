import { chromium } from "playwright";

const bases = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["http://127.0.0.1:3010", "http://127.0.0.1:3001"];

const browser = await chromium.launch();
const page = await browser.newPage();

for (const base of bases) {
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 20_000 });
  await page.getByTestId("dashboard-swap-stage").waitFor({ timeout: 15_000 });
  const report = await page.evaluate(() => {
    const inner =
      document.querySelector('[data-testid="dashboard-swap-stage"] .neon-glass-card__inner') ??
      document.querySelector(".neon-glass-card__inner");
    const outer = document.querySelector(".neon-glass-card");
    const shell = document.querySelector(".glass-shell-frame");
    const read = (el) => {
      if (!el) return null;
      const cs = getComputedStyle(el);
      return {
        backdropFilter: cs.backdropFilter,
        backgroundColor: cs.backgroundColor,
        transform: cs.transform,
        animationName: cs.animationName,
        boxShadow: cs.boxShadow.slice(0, 80),
      };
    };
    return {
      inner: read(inner),
      outer: read(outer),
      shell: read(shell),
      neonCardCount: document.querySelectorAll(".neon-glass-card").length,
    };
  });
  console.log(`\n=== ${base} ===`);
  console.log(JSON.stringify(report, null, 2));
}

await browser.close();
