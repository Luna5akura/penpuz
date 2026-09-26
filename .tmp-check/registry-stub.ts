import { parseBattleshipLink } from './utils.ts';
export const puzzleRegistry: Record<string, { parsePuzzLink: (link: string) => unknown | null }> = {
  battleship: { parsePuzzLink: parseBattleshipLink },
  battleships: { parsePuzzLink: parseBattleshipLink },
  skyscrapers: { parsePuzzLink: () => null },
};
export const resolvePuzzleEntry = (entry: { puzzLink: string }) => {
  const type = entry.puzzLink.match(/[?&]([a-z-]+)\//)?.[1];
  return type ? puzzleRegistry[type]?.parsePuzzLink(entry.puzzLink) ?? null : null;
};
export const getPuzzleTemplate = () => ({ name: {} });
