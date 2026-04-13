// src/puzzles/database.ts
import { PuzzleData, DailyPuzzleData, HistoryPuzzleData, PuzzleTemplate } from './types';
import { parsePuzzLink } from './Nurikabe/utils';
import { parseFillominoLink } from './Fillomino/utils';

// ==================== 统一存储所有谜题 ====================
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
  {
    type: 'fillomino' as const,
    puzzLink: 'https://pzprxs.vercel.app/p?fillomino/10/10/5i1g1h2g1g3h6g1g1i36g1g1g3g1h1g6i3g52g6g11g5g34g4i5g1h1g4k54k1g5h4g1g3i1j4000000000100040000000200080000000000',
  },
  {
    type: 'nurikabe' as const,
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/2j2h1zo2g2h1g.n.g2h1g1zo2h1j1',
  },
];

const START_DATE = '2026-04-10';

export function getDailyPuzzle(): DailyPuzzleData | null {
  // 获取北京时间（Asia/Shanghai）当天日期字符串 YYYY-MM-DD
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // 格式化为 YYYY-MM-DD
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value.padStart(2, '0');
  const day = parts.find(p => p.type === 'day')!.value.padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // 开始日期也按北京时间解释
  const start = new Date(START_DATE + 'T00:00:00+08:00'); // ← 明确使用北京时区
  const today = new Date(todayStr + 'T00:00:00+08:00');

  let daysSinceStart = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceStart < 0) daysSinceStart = 0;

  const index = daysSinceStart % allPuzzles.length;
  const entry = allPuzzles[index];

  let puzzle: PuzzleData;
  if (entry.type === 'nurikabe') {
    const parsed = parsePuzzLink(entry.puzzLink);
    if (!parsed) return null;
    puzzle = parsed;
  } else if (entry.type === 'fillomino') {
    puzzle = parseFillominoLink(entry.puzzLink);
  } else {
    return null;
  }

  return {
    puzzle,
    template: templates[entry.type],
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
    let puzzle: PuzzleData;

    if (entry.type === 'nurikabe') {
      const parsed = parsePuzzLink(entry.puzzLink);
      if (!parsed) continue;
      puzzle = parsed;
    } else {
      puzzle = parseFillominoLink(entry.puzzLink);
    }

    history.push({
      puzzle,
      template: templates[entry.type],
      index: idx,
    });
  }
  return history;
}

const templates: Record<'nurikabe' | 'fillomino', PuzzleTemplate> = {
  nurikabe: {
    type: 'nurikabe' as const,
    name: 'Nurikabe',
    nameCn: '数墙',
    rulesTitle: '游戏规则',
    rules: [
      '涂黑一些空格，使得所有涂黑的格子连通成一个整体，且没有全部涂黑的2×2结构。',
      '每一组连通的留白格必须恰好包含一个数字。',
      '数字表示其所在的留白的连通组格数。',
    ],
    exampleTitle: '例题（5×5）',
    playableLabel: '可游玩例题（点击或拖动练习）',
    answerLabel: '正确答案',
    example: {
      puzzleType: 'nurikabe',
      width: 5,
      height: 5,
      clues: [
        { row: 0, col: 0, value: '?' },
        { row: 2, col: 0, value: 3 },
        { row: 4, col: 1, value: 1 },
        { row: 3, col: 4, value: 5 },
      ],
      correctSolution: [
        [0, 0, 0, 1, 1],
        [1, 1, 1, 1, 0],
        [0, 0, 0, 1, 0],
        [1, 1, 1, 1, 0],
        [1, 0, 1, 0, 0],
      ],
    },
  },
  fillomino: {
    type: 'fillomino' as const,
    name: 'Fillomino',
    nameCn: '码牌',
    rulesTitle: '游戏规则',
    rules: [
      '沿虚格线把盘面分成若干个区域，使得任意两个相邻的区域面积都不同。',
      '数字表示其所在区域的面积。',
    ],
    exampleTitle: '例题（6×6）',
    playableLabel: '可游玩例题（点击或拖动练习）',
    answerLabel: '正确答案',
    example: {
      puzzleType: 'fillomino',
      width: 6,
      height: 6,
      cluesGrid: [
        [null, null, 4, null, null, null],
        [null, 5, 3, null, 2, null],
        [null, null, null, null, 5, 2],
        [3, 3, null, null, null, null],
        [null, 2, null, 1, 4, null],
        [null, null, null, 3, null, null],
      ],
      correctGrid: [   // ← 已为您准备的有效解（满足分区规则）
        [5, 5, 4, 4, 4, 4],
        [5, 5, 3, 2, 2, 1],
        [3, 5, 3, 3, 5, 2],
        [3, 3, 5, 5, 5, 2],
        [2, 2, 5, 1, 4, 4],
        [1, 3, 3, 3, 4, 4],
      ],
    },
  },
} as const;