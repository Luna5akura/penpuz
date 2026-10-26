import { createContext, useContext } from 'react';

/**
 * Optional restart action provided by the app shell and consumed by the
 * puzzle assist toolbar.  Boards rendered outside the main puzzle page
 * (examples, all-puzzles page) have no provider, so the restart button is
 * simply not shown there.
 */
export const RestartActionContext = createContext<(() => void) | null>(null);

export function useRestartAction(): (() => void) | null {
  return useContext(RestartActionContext);
}
