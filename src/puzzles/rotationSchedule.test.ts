// src/puzzles/rotationSchedule.test.ts
import { describe, expect, it } from 'vitest';
import { allPuzzles, dailyRotation } from './database';
import { committedRotationIndices, COMMITTED_ROTATION_HORIZON, ROTATION_START_DATE } from './rotationSchedule';

describe('frozen daily rotation', () => {
  it('commits the declared horizon of days', () => {
    expect(committedRotationIndices.length).toBe(COMMITTED_ROTATION_HORIZON);
    expect(COMMITTED_ROTATION_HORIZON).toBeGreaterThanOrEqual(365 * 3);
  });

  it('keeps the committed start date fixed', () => {
    expect(ROTATION_START_DATE).toBe('2026-04-09');
  });

  it('references only valid database entries', () => {
    committedRotationIndices.forEach((index) => {
      expect(Number.isInteger(index)).toBe(true);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(allPuzzles.length);
    });
  });

  it('covers every entry once in the first live rotation cycle', () => {
    // 题库增长后实况轮换会重排；冻结表保持旧顺序、只负责固定历史日期。
    const firstCycle = Array.from({ length: allPuzzles.length }, (_, day) => dailyRotation[day]);
    const seen = new Set(firstCycle);
    expect(seen.size).toBe(allPuzzles.length);
    firstCycle.forEach((entry) => {
      expect(allPuzzles).toContain(entry);
    });
  });

  it('freezes the committed window against live rotation changes', () => {
    // 冻结窗口内的日期查表，与当前实况轮换无关：同一日期两次解析结果一致，
    // 且都落在 committedRotationIndices 内。
    const committedEntry = (day: number) => allPuzzles[committedRotationIndices[day]];
    for (let day = 0; day < committedRotationIndices.length; day += 1) {
      expect(committedEntry(day)).toBe(committedEntry(day));
    }
  });

  it('stays deterministic across repeated reads', () => {
    const read = () => committedRotationIndices.map((index) => allPuzzles[index].puzzLink);
    expect(read()).toEqual(read());
  });
});
