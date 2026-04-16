import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nContext, type I18nContextValue } from './context';
import { defaultLocale, localeStorageKey, messages } from './messages';
import type { Locale } from './types';

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;

  const stored = localStorage.getItem(localeStorageKey);
  return stored === 'en' || stored === 'zh-CN' ? stored : defaultLocale;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => readStoredLocale());

  useEffect(() => {
    localStorage.setItem(localeStorageKey, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const toggleLocale = useCallback(() => {
    setLocale((current) => (current === 'zh-CN' ? 'en' : 'zh-CN'));
  }, []);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    copy: messages[locale],
    toggleLocale,
  }), [locale, toggleLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
