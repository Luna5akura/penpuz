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
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/n2n2u2k2g2l2r2k2n2s2n-16',
  },
  {
    type: 'nurikabe' as const,
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/8i1h2g5p2zi5j22k4zh1p6g1h2i7',
  },
];

const START_DATE = '2026-04-10';

export function getDailyPuzzle(): { puzzle: PuzzleData; index: number; daysSinceStart: number } | null {
  const todayStr = new Date().toISOString().slice(0, 10);

  // 使用 UTC 时间点计算，确保跨时区结果一致
  const start = new Date(START_DATE + 'T00:00:00Z');
  const today = new Date(todayStr + 'T00:00:00Z');

  const diffTime = today.getTime() - start.getTime();
  let daysSinceStart = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // 若当前日期早于起始日期，返回第一题
  if (daysSinceStart < 0) daysSinceStart = 0;

  const index = daysSinceStart % allPuzzles.length;

  const entry = allPuzzles[index];
  const parsed = parsePuzzLink(entry.puzzLink);
  if (!parsed) return null;

  return {
    puzzle: parsed,
    index: index,
    daysSinceStart: daysSinceStart,
  };
}

export function getHistoryPuzzles(daysSinceStart: number): { puzzle: PuzzleData; index: number }[] {
  if (daysSinceStart <= 0) return [];

  const seen = new Set<number>();
  const history: { puzzle: PuzzleData; index: number }[] = [];

  for (let d = 0; d < daysSinceStart; d++) {
    const idx = d % allPuzzles.length;
    if (!seen.has(idx)) {
      seen.add(idx);
      const entry = allPuzzles[idx];
      const parsed = parsePuzzLink(entry.puzzLink);
      if (parsed) {
        history.push({ puzzle: parsed, index: idx });
      }
    }
  }
  return history;
}