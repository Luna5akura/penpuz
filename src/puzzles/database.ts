// src/puzzles/database.ts
import { PuzzleData } from './types';
import { parsePuzzLink } from './Nurikabe/utils';

const allPuzzles = [
  {
    type: 'nurikabe' as const,
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/2l2u2l2n2m2m.k2g2i2q2l2s',
  },
  {
    type: 'nurikabe' as const,
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/11/11/zg87zn4l3g9q1n2q6h5zj',
  },
  {
    type: 'nurikabe' as const,
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/n2n2u2k2g2l2r2k2n2s2n-16',
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

export function getHistoryPuzzles(currentIndex: number): { puzzle: PuzzleData; index: number }[] {
  return allPuzzles
    .map((entry, i) => {
      if (i === currentIndex) return null;
      const parsed = parsePuzzLink(entry.puzzLink);
      if (!parsed) return null;
      return { puzzle: parsed, index: i };
    })
    .filter((item): item is { puzzle: PuzzleData; index: number } => item !== null);
}