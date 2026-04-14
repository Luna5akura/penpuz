import type { DailyPuzzleData, HistoryPuzzleData, PuzzleEntry } from './types';
import { getPuzzleTemplate, resolvePuzzleEntry } from './registry';

// ==================== 统一获取北京时间日期字符串 ====================
/**
 * 返回当前北京时间（Asia/Shanghai）的 YYYY-MM-DD 字符串
 * 严格以北京时间 00:00 为日期分界点
 */
export function getBeijingDateStr(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value.padStart(2, '0');
  const day = parts.find(p => p.type === 'day')!.value.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ==================== 统一存储所有谜题 ====================
const allPuzzles: PuzzleEntry[] = [
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
  {
    type: 'fillomino' as const,
    puzzLink: 'https://pzprxs.vercel.app/p?fillomino/10/10/5i1g1h2g1g3h6g1g1i36g1g1g3g1h1g6i3g52g6g11g5g34g4i5g1h1g4k54k1g5h4g1g3i1j4000000000100040000000200080000000000',
  },
  {
    type: 'nurikabe' as const,
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/2j2h1zo2g2h1g.n.g2h1g1zo2h1j1',
  },
  {
    type: 'fillomino' as const,
    puzzLink: 'https://pzprxs.vercel.app/p?fillomino/9/9/g3h1h5g4g1i1g2g6h1h2g3g1i1g4g5h1h2g3g1i1g4g6h1h4g3g1i1g3g5h1h3g',
  },
  {
    type: 'nurikabe' as const,
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/g5p5k5p5s5p5zo5k5g5m',
  },
  {
    type: 'yajilin' as const,
    puzzLink: 'https://pzprxs.vercel.app/p?yajilin/10/10/q30k20d32i1141h3221i42d12k40q',
  },
  {
    type: 'fillomino' as const,
    puzzLink: 'https://pzprxs.vercel.app/p?fillomino/10/10/9h9h9h9g34i332h454i13g94g9h9g39j51n14j9g19h94g9g331i23h32i323g9h9h9h9000000000000000000000000000000000008',
  },
  {
    type: 'yajilin' as const,
    puzzle: {
      type: 'yajilin' as const,
      width: 6,
      height: 6,
      clues: [
        { row: 1, col: 1, direction: 'right', value: '?' },
        { row: 1, col: 2, direction: 'down', value: 2 },
        { row: 1, col: 3, direction: 'down', value: 0 },
        { row: 1, col: 4, direction: 'down', value: 2 },
        { row: 2, col: 1, direction: 'right', value: 2 },
        { row: 2, col: 3, direction: 'right', value: 1 },
        { row: 3, col: 1, direction: 'right', value: 0 },
        { row: 3, col: 2, direction: 'down', value: 1 },
        { row: 3, col: 3, direction: 'down', value: 0 },
        { row: 3, col: 4, direction: 'down', value: 1 },
        { row: 4, col: 1, direction: 'right', value: 2 },
        { row: 4, col: 3, direction: 'right', value: 1 },
      ],
    },
  },
];

const START_DATE = '2026-04-09';

export function getDailyPuzzle(): DailyPuzzleData | null {
  const todayStr = getBeijingDateStr(); // ← 使用统一北京时间函数

  // 开始日期也按北京时间解释
  const start = new Date(START_DATE + 'T00:00:00+08:00');
  const today = new Date(todayStr + 'T00:00:00+08:00');

  let daysSinceStart = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceStart < 0) daysSinceStart = 0;

  const index = daysSinceStart % allPuzzles.length;
  const entry = allPuzzles[index];
  const puzzle = resolvePuzzleEntry(entry);
  if (!puzzle) return null;

  return {
    puzzle,
    template: getPuzzleTemplate(entry.type),
    index,
    daysSinceStart,
  };
}

export function getHistoryPuzzles(daysSinceStart: number): HistoryPuzzleData[] {
  if (daysSinceStart <= 0) return [];

  const seen = new Set<number>();
  const history: HistoryPuzzleData[] = [];

  for (let d = 0; d < daysSinceStart; d++) {
    const idx = d % allPuzzles.length;
    if (seen.has(idx)) continue;
    seen.add(idx);

    const entry = allPuzzles[idx];
    const puzzle = resolvePuzzleEntry(entry);
    if (!puzzle) continue;

    history.push({
      puzzle,
      template: getPuzzleTemplate(entry.type),
      index: idx,
    });
  }
  return history;
}
