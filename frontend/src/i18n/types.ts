export const APP_LOCALES = ["zh-CN", "en-US"] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_APP_LOCALE: AppLocale = "zh-CN";

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && APP_LOCALES.includes(value as AppLocale);
}

export function getLocaleLabel(locale: AppLocale): string {
  return locale === "zh-CN" ? "简体中文" : "English";
}

export function getAlternateLocale(locale: AppLocale): AppLocale {
  return locale === "zh-CN" ? "en-US" : "zh-CN";
}

export function pickLocaleValue<T>(locale: AppLocale, values: Record<AppLocale, T>): T {
  return values[locale];
}

export function getLocaleText(locale: AppLocale, zhCN: string, enUS: string): string {
  return locale === "zh-CN" ? zhCN : enUS;
}
