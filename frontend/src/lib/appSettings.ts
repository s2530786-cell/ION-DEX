import { DEFAULT_APP_LOCALE, isAppLocale, type AppLocale } from "@/i18n/types";

export const APP_SETTINGS_STORAGE_KEY = "ion-dex-app-settings";

/** Keys cleared by “Clear local cache”; wallet session keys are never removed. */
export const CLEARABLE_CACHE_PREFIXES = ["ion-dex-cache-", "ion-dex-draft-", "ion-risk-ack"] as const;

export type AppSettings = {
  darkMode: boolean;
  defaultSlippagePct: string;
  pushNotifications: boolean;
  locale: AppLocale;
};

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: true,
  defaultSlippagePct: "0.5",
  pushNotifications: true,
  locale: DEFAULT_APP_LOCALE,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseSlippagePct(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0.1 || parsed > 5) {
    return null;
  }
  return parsed;
}

export function loadAppSettings(): AppSettings {
  if (typeof window === "undefined") {
    return { ...DEFAULT_SETTINGS };
  }
  try {
    const raw = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return { ...DEFAULT_SETTINGS };
    }
    const darkMode = typeof parsed.darkMode === "boolean" ? parsed.darkMode : DEFAULT_SETTINGS.darkMode;
    const slippageCandidate =
      typeof parsed.defaultSlippagePct === "string" ? parsed.defaultSlippagePct : DEFAULT_SETTINGS.defaultSlippagePct;
    const defaultSlippagePct =
      parseSlippagePct(slippageCandidate) !== null ? slippageCandidate : DEFAULT_SETTINGS.defaultSlippagePct;
    const pushNotifications =
      typeof parsed.pushNotifications === "boolean" ? parsed.pushNotifications : DEFAULT_SETTINGS.pushNotifications;
    const locale = isAppLocale(parsed.locale) ? parsed.locale : DEFAULT_SETTINGS.locale;
    return { darkMode, defaultSlippagePct, pushNotifications, locale };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveAppSettings(settings: AppSettings): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function applyAppSettingsToDocument(settings: AppSettings): void {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.dataset.ionDarkMode = settings.darkMode ? "1" : "0";
  document.documentElement.dataset.ionSlippage = settings.defaultSlippagePct;
  document.documentElement.dataset.ionLocale = settings.locale;
  document.documentElement.lang = settings.locale;
}

export function clearAppLocalCache(): number {
  if (typeof window === "undefined") {
    return 0;
  }
  let removed = 0;
  const keys = Object.keys(window.localStorage);
  for (const key of keys) {
    if (CLEARABLE_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      window.localStorage.removeItem(key);
      removed += 1;
    }
  }
  return removed;
}

export function seedDemoCacheEntries(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem("ion-dex-cache-demo-panel", JSON.stringify({ ts: Date.now() }));
}
