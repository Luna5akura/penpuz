import type { DailyPuzzleData, HistoryPuzzleData, PuzzleEntry } from './types';
import { getPuzzleTemplate, resolvePuzzleEntry } from './registry';

// ==================== 统一获取北京时间日期字符串 ====================
/**
 * 返回当前北京时间（Asia/Shanghai）的 YYYY-MM-DD 字符串
 * 严格以北京时间 00:00 为日期分界点
 */
export function getBeijingDateStr(): string {
  return formatBeijingDate(new Date());
}

function formatBeijingDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value.padStart(2, '0');
  const day = parts.find(p => p.type === 'day')!.value.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ==================== 统一存储所有谜题 ====================
const allPuzzles: PuzzleEntry[] = [
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/2l2u2l2n2m2m.k2g2i2q2l2s',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/n2n2u2k2g2l2r2k2n2s2n-16',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/8i1h2g5p2zi5j22k4zh1p6g1h2i7',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?fillomino/10/10/5i1g1h2g1g3h6g1g1i36g1g1g3g1h1g6i3g52g6g11g5g34g4i5g1h1g4k54k1g5h4g1g3i1j4000000000100040000000200080000000000',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/2j2h1zo2g2h1g.n.g2h1g1zo2h1j1',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?fillomino/9/9/g3h1h5g4g1i1g2g6h1h2g3g1i1g4g5h1h2g3g1i1g4g6h1h4g3g1i1g3g5h1h3g',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/g5p5k5p5s5p5zo5k5g5m',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?yajilin/10/10/q30k20d32i1141h3221i42d12k40q',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?starbattle/10/10/2/00lhksmullfd75hm00u85lakb8442q5alk2f',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/04094i94i94i94i84g007s00007000000s00ca212',
    difficulty: '极难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?fillomino/10/10/9h9h9h9g34i332h454i13g94g9h9g39j51n14j9g19h94g9g331i23h32i323g9h9h9h9000000000000000000000000000000000008',
    difficulty: '极难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?akari/10/10/bjbjbg.icqb6acvacgan.ldhbj',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?aqre/10/10/bbdr0i1k2o4gf0ln5lcinv81o283o281nvci12321003g23011102012113',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nikoji/8/8/1g2h1g2j3i3g4h3g4j4l2j3g2h4g5i4j6g7h4g5',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?mintonette/10/10/.h4i4m3p4h42h2i4m3k4h1q2h4h14zh2h./',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?starbattle/10/10/2/95u69hu893vvm8pui8i25qcjdef4aa4kek16',
    difficulty: '极难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/.i.n.g.k.n.h.g.g.l.i.h.g.g.j.k.n.g.i.g.l.o',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/204h92i14284h52a4k1vu700u0vo07vo000032210142134242',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?fillomino/10/10/g1j1m124h1h1h651h146h1k25125h1h1h46124k1h651h146h1h1h251m1j1g',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?akari/10/10/kbibjcs2bhbbbjcbbh1bscjbici',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?fillomino/10/10/2h2h2h2j34n56j2h2h2h2g46g64g53h53g35g46g2h2h2h2j35n64j2h2h2h2',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/j1i1g1j.g.i.m.n1h.p1h1h.k.j11p.h.i.l1i1',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?aqre/10/10/69dmr9ibdmqkirdml4dmg9dmvv00dmvv00dm433033301423134300343133',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/022ecspp3ojj76e8010sf0000see70000unu44444444',
    difficulty: '极难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?starbattle/10/10/2/g01u3o3v7svo3ofg81ftfgvgdo1g3n1u1u7u',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?yajilin/10/10/41h22m21i31a311121e21l11e112141a41i41m12h33',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?akari/10/10/ibbhcjcgbhbblbxblbbhbgcjbhbcg',
    difficulty: '极难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/sfovhpu3s7ofgv1u043o3ovvs707s007s7vozi',
    difficulty: '极难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?fillomino/10/10/41h44h14h7j5i613h713i5j6h4i441h44i44i4h5j3i617h716g1g3j5g14i44i4',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/o.s1n1k2p2l5j3i5j3u4n4j',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?akari/10/10/sbcrbcgckbjbkbgbbrccq',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?kurarin/10/10/p8i8i8h2i3zh3g888882s8i8r8g8g4g8g8r8i8r2g888882zh2i3i8i4i8p',
    difficulty: '极难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/58agl1c0o18agl1a2k0000sf30vv30vv00001121222g2g1021',
    difficulty: '极难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?starbattle/10/10/2/gocnvvvvvvvvspc711dmla00000000ladifq',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?aqre/10/10/lbaml80000002ldaql0000vv000000vv0000205053g061502',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/akl9ail5aakl9ail5a6cpj6cpj6cpj6cpj6c0g0i2h0h00k0h002h',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?fillomino/10/10/1h1h1h1g14g34g32h3l3g1h1h1h1g3h43h4h4h54h2g1h1h1h1g2l2h54g15g13g1h1h1h1',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?yajilin/10/10/h33a23k22d31p1140h3021p43d13k13a41h',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?kurarin/10/10/p4m4qcg4g4gcucucgcgcg4qcg4i4g4q8g4g8gcucu8g4g8g4q4mcp',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/akl9ail5aakl9ail5a6c1jpg6cpj6c63pj0c101g111111111111g11g1g10',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/s2m2t2m2t2j2r.h2x2',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/zk4n2i3i3i2l1i5i.i3n3zk',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?fillomino/10/10/i5g4h2g5g4g3g3j2g1g1g5g3h2g5i3h5j3h12h3j5h4i5g3h3g5g3g1g1j1g2g4g5g3h2g5i',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?yajilin/10/10/k21f32c22d31f21k41f11k31f42d11c42f11k',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?heyawake/10/10/4g90i1224488g90i1400003vs00007vo0000534523551',
    difficulty: '简单',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/h6y6j3n3m2p2m4n4j5y5h',
    difficulty: '困难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?yajilin/10/10/m42b22n11f31f31h31f21f12n42b31m',
    difficulty: '极难',
  },
  {
    puzzLink: 'https://pzprxs.vercel.app/p?nurikabe/10/10/h2j2g11j2m2j1h2j2m1j2h2j2h2j1m2j1h2j2m2j2',
    difficulty: '困难',
  },
];



const START_DATE = '2026-04-09';
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

export function getPuzzleDateStr(daysSinceStart: number): string {
  const start = new Date(`${START_DATE}T00:00:00+08:00`);
  const targetDate = new Date(start.getTime() + daysSinceStart * MILLISECONDS_PER_DAY);
  return formatBeijingDate(targetDate);
}

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
    template: getPuzzleTemplate(puzzle.type),
    difficulty: entry.difficulty,
    index,
    daysSinceStart,
    dateStr: todayStr,
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
      template: getPuzzleTemplate(puzzle.type),
      difficulty: entry.difficulty,
      index: idx,
      dateStr: getPuzzleDateStr(d),
      daysSinceStart: d,
    });
  }
  return history;
}
