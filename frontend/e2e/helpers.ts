import type { Page } from "@playwright/test";

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
