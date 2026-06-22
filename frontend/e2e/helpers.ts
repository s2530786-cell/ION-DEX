import { expect, type Page } from "@playwright/test";
import { dismissBootSplashIfPresent } from "./boot-splash";
import type { AppLocale } from "@/i18n/types";

/** Skips boot splash + risk modal for automated UI tests. */
export async function installE2eSessionFlags(page: Page, options: { locale?: AppLocale } = {}) {
  const locale = options.locale ?? "en-US";
  await page.addInitScript((nextLocale) => {
    try {
      const e2eSettings = {
        darkMode: true,
        defaultSlippagePct: "0.5",
        pushNotifications: true,
        locale: nextLocale,
      };
      const settingsKey = "ion-dex-app-settings";
      const originalGetItem = Storage.prototype.getItem;
      const originalSetItem = Storage.prototype.setItem;
      const originalRemoveItem = Storage.prototype.removeItem;

      // Keep a deterministic settings baseline across reloads and test-local clears.
      Storage.prototype.getItem = function getItemPatched(key: string) {
        if (key === settingsKey) {
          return originalGetItem.call(this, key) ?? JSON.stringify(e2eSettings);
        }
        return originalGetItem.call(this, key);
      };

      Storage.prototype.setItem = function setItemPatched(key: string, value: string) {
        if (key === settingsKey) {
          try {
            const parsed = JSON.parse(value) as Record<string, unknown>;
            if (typeof parsed.locale !== "string") {
              parsed.locale = nextLocale;
            }
            return originalSetItem.call(this, key, JSON.stringify(parsed));
          } catch {
            return originalSetItem.call(this, key, JSON.stringify({ ...e2eSettings, locale: nextLocale }));
          }
        }
        return originalSetItem.call(this, key, value);
      };

      Storage.prototype.removeItem = function removeItemPatched(key: string) {
        if (key === settingsKey) {
          return originalSetItem.call(this, key, JSON.stringify({ ...e2eSettings, locale: nextLocale }));
        }
        return originalRemoveItem.call(this, key);
      };

      document.documentElement.dataset.ionE2eStable = "1";
      window.localStorage.setItem("ion-dex-risk-ack-v1", "1");
      originalSetItem.call(window.localStorage, settingsKey, JSON.stringify({ ...e2eSettings, locale: nextLocale }));
    } catch {
      // private mode / quota
    }
  }, locale);
}

/** Bypasses TonConnect / wallet overlay pointer interception during E2E. */
export async function domClick(page: Page, testId: string) {
  await page.getByTestId(testId).first().evaluate((el) => {
    (el as HTMLElement).click();
  });
}

/** React controlled inputs need the native value setter + input event. */
export async function fillControlledInput(page: Page, testId: string, value: string) {
  await page.getByTestId(testId).evaluate((el, v) => {
    const isTextArea = el instanceof HTMLTextAreaElement;
    const proto = isTextArea ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    const field = el as HTMLInputElement | HTMLTextAreaElement;
    setter?.call(field, v);
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

export function playwrightAppOrigin(): string {
  return process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8787";
}

/** Waits for main shell after boot splash; retries navigation up to 3 times. */
export async function ensureAppShell(page: Page, path = "/") {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (await page.getByTestId("main-content").isVisible().catch(() => false)) {
      return;
    }
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await dismissBootSplashIfPresent(page);
    await page.waitForTimeout(400);
  }
  await expect(page.getByTestId("main-content")).toBeVisible({ timeout: 30_000 });
}
