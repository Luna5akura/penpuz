// 重新提交（延长）每日题的冻结窗口。
// 用法：node scripts/commit-rotation.mjs [目标天数]
//
// 已有的 committedRotationIndices 只会原样保留并向后追加新天数，
// 绝不会改动任何已提交的日期 —— 这是历史题目固定不动的保障。
import { createServer } from 'vite';
import { readFileSync, writeFileSync } from 'node:fs';

const targetDays = Number(process.argv[2] ?? 1500);

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const db = await server.ssrLoadModule('/src/puzzles/database.ts');
  const schedule = await server.ssrLoadModule('/src/puzzles/rotationSchedule.ts');
  const { allPuzzles, dailyRotation } = db;
  const committed = [...schedule.committedRotationIndices];

  if (targetDays <= committed.length) {
    console.log(`已冻结 ${committed.length} 天，目标 ${targetDays} 天无需追加。`);
  } else {
    for (let d = committed.length; d < targetDays; d += 1) {
      const entry = dailyRotation[d % dailyRotation.length];
      committed.push(allPuzzles.indexOf(entry));
    }
    console.log(`追加 ${targetDays - committed.length} 天，共冻结 ${committed.length} 天。`);
  }

  const rows = [];
  for (let i = 0; i < committed.length; i += 16) {
    rows.push('  ' + committed.slice(i, i + 16).join(', ') + ',');
  }
  const body = rows.join('\n');
  const file = `// 本文件由 scripts/commit-rotation.mjs 生成，请勿手改。
// “冻结”的每日题安排：第 N 天（自 ROTATION_START_DATE 起）对应
// allPuzzles 中的下标。已提交的条目永不修改、只允许向后追加，
// 从而保证历史日期永远对应同一道题。
export const ROTATION_START_DATE = '2026-04-09';

/** 已冻结的天数（窗口内的日期永不随题库变化而移动）。 */
export const COMMITTED_ROTATION_HORIZON = ${committed.length};

export const committedRotationIndices: readonly number[] = [
${body}
];
`;
  writeFileSync('src/puzzles/rotationSchedule.ts', file);
  console.log('rotationSchedule.ts 已更新。');
} finally {
  await server.close();
}
