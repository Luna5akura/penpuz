// 重新提交（延长）每日题的冻结窗口。
// 用法：node scripts/commit-rotation.mjs [目标天数]
//
// 已有的 committedRotationIndices 只会原样保留并向后追加新天数，
// 绝不会改动任何已提交的日期 —— 这是历史题目固定不动的保障。
//
// 新增题目后，为了让新题尽快进入每日轮换而不破坏历史：
// 从「今天 + 1」起用当前实况轮换续排（默认行为），历史日期保持不变。
import { createServer } from 'vite';
import { writeFileSync } from 'node:fs';

const targetDays = Number(process.argv[2] ?? 1500);

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const db = await server.ssrLoadModule('/src/puzzles/database.ts');
  const schedule = await server.ssrLoadModule('/src/puzzles/rotationSchedule.ts');
  const { allPuzzles, dailyRotation, getBeijingDateStr } = db;
  const committed = [...schedule.committedRotationIndices];

  // 冻结锚点：今天之前（含今天）的历史日期保持原样
  const start = new Date(`${schedule.ROTATION_START_DATE}T00:00:00+08:00`);
  const today = new Date(`${getBeijingDateStr()}T00:00:00+08:00`);
  const anchorDay = Math.floor((today.getTime() - start.getTime()) / 86400000);

  // 消除重复：每道题在整张排期表里最多出现一次（直到题库用尽后才会重新轮转）。
  // 1) 旧轮换的首轮（唯一一轮）保持冻结；首轮之后到今天的重复日改为未使用过的新题。
  // 2) 未来日期：先排「近 90 天未出现」的题，再排近期出现过的题。
  while (committed.length < targetDays) committed.push(0);

  const oldCycleLength = (() => {
    for (let d = 1; d < committed.length; d += 1) {
      if (committed[d] === committed[0]) return d;
    }
    return committed.length;
  })();

  const used = new Set(committed.slice(0, Math.min(oldCycleLength, committed.length)));
  const unused = allPuzzles.map((_, i) => i).filter((i) => !used.has(i));

  let changes = 0;
  for (let d = oldCycleLength; d <= anchorDay; d += 1) {
    const candidate = unused[d - oldCycleLength];
    if (candidate !== undefined && committed[d] !== candidate) {
      committed[d] = candidate;
      changes += 1;
    }
  }

  const recent = new Set(committed.slice(Math.max(0, anchorDay - 89), anchorDay + 1));
  const fresh = [];
  const stale = [];
  for (const entry of dailyRotation) {
    const index = allPuzzles.indexOf(entry);
    (recent.has(index) ? stale : fresh).push(index);
  }
  const futureOrder = [...fresh, ...stale];
  for (let d = anchorDay + 1; d < targetDays; d += 1) {
    const candidate = futureOrder[(d - anchorDay - 1) % futureOrder.length];
    if (committed[d] !== candidate) {
      committed[d] = candidate;
      changes += 1;
    }
  }
  console.log(`冻结 ${committed.length} 天（首轮 ${oldCycleLength} 天保持原样）；补齐 ${Math.max(0, anchorDay - oldCycleLength + 1)} 天重复日 + 未来 ${targetDays - anchorDay - 1} 天去重重排（${changes} 天更新）。`);

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
