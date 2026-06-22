import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  APP_SETTINGS_STORAGE_KEY,
  applyAppSettingsToDocument,
  loadAppSettings,
  saveAppSettings,
} from "@/lib/appSettings";
import {
  DEFAULT_APP_LOCALE,
  getAlternateLocale,
  getLocaleLabel,
  type AppLocale,
} from "@/i18n/types";

type I18nContextValue = {
  locale: AppLocale;
  isZh: boolean;
  localeLabel: string;
  alternateLocale: AppLocale;
  setLocale: (nextLocale: AppLocale) => void;
  toggleLocale: () => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLocale = DEFAULT_APP_LOCALE,
}: PropsWithChildren<{ initialLocale?: AppLocale }>) {
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);

  const setLocale = useCallback((nextLocale: AppLocale) => {
    setLocaleState(nextLocale);
    const nextSettings = { ...loadAppSettings(), locale: nextLocale };
    saveAppSettings(nextSettings);
    applyAppSettingsToDocument(nextSettings);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(getAlternateLocale(locale));
  }, [locale, setLocale]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== APP_SETTINGS_STORAGE_KEY) {
        return;
      }
      const nextLocale = loadAppSettings().locale;
      setLocaleState((current) => (current === nextLocale ? current : nextLocale));
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      isZh: locale === "zh-CN",
      localeLabel: getLocaleLabel(locale),
      alternateLocale: getAlternateLocale(locale),
      setLocale,
      toggleLocale,
    }),
    [locale, setLocale, toggleLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider.");
  }
  return context;
}
