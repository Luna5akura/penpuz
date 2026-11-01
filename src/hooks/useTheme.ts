import { useCallback, useEffect, useRef, useState } from 'react';

export type ThemePreference = 'light' | 'dark';

const STORAGE_KEY = 'penpuz-theme';
const LIGHT_THEME_COLOR = '#f8f1e3';
const DARK_THEME_COLOR = '#241c12';
const TRANSITION_CLASS = 'theme-transitioning';
const TRANSITION_DURATION_MS = 350;

function readStoredTheme(): ThemePreference | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

function getSystemTheme(): ThemePreference {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function updateThemeColorMeta(theme: ThemePreference) {
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.content = theme === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
  }
}

/**
 * Manual light/dark toggle.  Until the user makes an explicit choice the
 * preference follows the system; afterwards the stored choice wins.
 *
 * While the theme flips, a temporary class makes every component animate its
 * colors with the same duration so the switch feels synchronized.
 */
export function useTheme() {
  const [theme, setTheme] = useState<ThemePreference>(() => readStoredTheme() ?? getSystemTheme());
  const appliedRef = useRef(false);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: ThemePreference = current === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Storage unavailable; the toggle still applies for this session.
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    if (appliedRef.current) {
      // User-initiated switch (or later system-preference change): animate.
      root.classList.add(TRANSITION_CLASS);
      root.classList.toggle('dark', theme === 'dark');
      window.setTimeout(() => root.classList.remove(TRANSITION_CLASS), TRANSITION_DURATION_MS);
    } else {
      // First application must not animate the whole page on load.
      root.classList.toggle('dark', theme === 'dark');
      appliedRef.current = true;
    }

    updateThemeColorMeta(theme);
  }, [theme]);

  useEffect(() => {
    if (readStoredTheme() !== null) return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setTheme(media.matches ? 'dark' : 'light');
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  return { theme, toggleTheme };
}
