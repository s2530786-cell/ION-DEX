import type { Page } from "@playwright/test";

export async function dismissBootSplashIfPresent(page: Page) {
  const splash = page.getByTestId("boot-splash-screen");
  if (await splash.isVisible().catch(() => false)) {
    await splash.click({ position: { x: 24, y: 24 }, force: true });
    await splash.waitFor({ state: "hidden", timeout: 8_000 }).catch(() => undefined);
  }
}
