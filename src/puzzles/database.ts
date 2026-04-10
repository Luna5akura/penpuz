// src/puzzles/database.ts
import { PuzzleData } from './types';
import { parsePuzzLink } from './Nurikabe/utils';

const allPuzzles = [
  {
    type: 'nurikabe' as const,
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/2l2u2l2n2m2m.k2g2i2q2l2s',
  },
];

export function getDailyPuzzle(): { puzzle: PuzzleData; index: number } | null {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = today.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % allPuzzles.length;

  const entry = allPuzzles[index];
  const parsed = parsePuzzLink(entry.puzzLink);

  if (!parsed) return null;

  return {
    puzzle: parsed,
    index: index,
  };
}