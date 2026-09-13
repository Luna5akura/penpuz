/**
 * Best-effort localStorage access.
 *
 * Browsers can expose localStorage while still throwing on access (private
 * browsing, disabled storage, sandboxed iframes) and writes can fail when the
 * quota is exhausted. Puzzle progress is an enhancement, so those failures
 * should never take down the application.
 */
export function readLocalStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocalStorage(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeLocalStorage(key: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
