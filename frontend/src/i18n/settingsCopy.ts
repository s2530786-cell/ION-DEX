import type { AppLocale } from "@/i18n/types";

export const SETTINGS_NOTIFY_STATE_COPY: Record<AppLocale, { enabled: string; muted: string }> = {
  "zh-CN": {
    enabled: "已开启",
    muted: "已静音",
  },
  "en-US": {
    enabled: "Enabled",
    muted: "Muted",
  },
};

export function getSettingsNotifyStateLabel(locale: AppLocale, enabled: boolean): string {
  return enabled ? SETTINGS_NOTIFY_STATE_COPY[locale].enabled : SETTINGS_NOTIFY_STATE_COPY[locale].muted;
}
