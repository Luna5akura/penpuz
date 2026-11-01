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

  it('covers every entry once in the first cycle', () => {
    const firstCycle = committedRotationIndices.slice(0, allPuzzles.length);
    const sorted = [...firstCycle].sort((a, b) => a - b);
    const expected = Array.from({ length: allPuzzles.length }, (_, index) => index);
    expect(sorted).toEqual(expected);
  });

  it('freezes past days to the currently live balanced rotation', () => {
    // The committed schedule must reproduce the live rotation for every
    // already-served day, so existing completions never change puzzles.
    for (let day = 0; day < dailyRotation.length; day += 1) {
      const liveEntry = dailyRotation[day];
      const committedIndex = committedRotationIndices[day];
      expect(allPuzzles[committedIndex]).toBe(liveEntry);
    }
  });

  it('stays deterministic across repeated reads', () => {
    const read = () => committedRotationIndices.map((index) => allPuzzles[index].puzzLink);
    expect(read()).toEqual(read());
  });
});
