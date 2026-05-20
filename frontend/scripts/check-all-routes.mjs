import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3001";
const routes = [
  "",
  "#dashboard",
  "#swap",
  "#pool",
  "#stake",
  "#bridge",
  "#trade",
  "#grid",
  "#burn",
  "#domain",
  "#ai",
];

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (err) => errors.push({ route: "global", msg: String(err) }));

for (const hash of routes) {
  const url = `${base}/${hash}`;
  const routeErrors = [];
  const handler = (err) => routeErrors.push(String(err));
  page.on("pageerror", handler);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
  await page.waitForTimeout(800);
  page.off("pageerror", handler);
  const len = await page.locator("#root").innerText().then((t) => t.length).catch(() => 0);
  console.log(hash || "home", "rootLen=", len, routeErrors.length ? routeErrors : "ok");
  if (routeErrors.length) errors.push({ hash, routeErrors });
}
await browser.close();
process.exit(errors.length ? 1 : 0);
