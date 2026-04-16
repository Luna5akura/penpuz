import { createContext } from 'react';
import type { Locale } from './types';
import { messages } from './messages';

export interface I18nContextValue {
  locale: Locale;
  copy: (typeof messages)[Locale];
  toggleLocale: () => void;
}

export const I18nContext = createContext<I18nContextValue | null>(null);
