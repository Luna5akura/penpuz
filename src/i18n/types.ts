export const locales = ['zh-CN', 'en'] as const;

export type Locale = (typeof locales)[number];

export type LocalizedText = Record<Locale, string>;
export type LocalizedTextList = Record<Locale, string[]>;
