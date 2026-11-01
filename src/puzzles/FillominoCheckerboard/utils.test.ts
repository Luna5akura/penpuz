// src/puzzles/FillominoCheckerboard/utils.test.ts
import { describe, expect, it } from 'vitest';
import { parseFillominoCheckerboardLink } from './utils';
import { validateFillominoCheckerboard } from '../Fillomino/utils';

// WPF Puzzle GP 2016, Round 3 Competitive — puzzles 31-34 by Silke
// Berendes.  Givens and solutions transcribed from the official booklets.
const wpfPuzzles = [
  {
    link: 'fillomino-checkerboard/6/6/h3j1l2h4.2l1h3.4j',
    width: 6,
    height: 6,
    givens: [
      [null, null, 3, null, null, null],
      [null, 1, null, null, null, null],
      [null, null, 2, null, null, 4],
      [null, 2, null, null, null, null],
      [null, null, 1, null, null, 3],
      [null, 4, null, null, null, null],
    ],
    solution: [
      [5, 5, 3, 3, 3, 6],
      [5, 1, 6, 6, 6, 6],
      [5, 5, 2, 2, 6, 4],
      [2, 2, 3, 3, 4, 4],
      [4, 4, 1, 3, 4, 3],
      [1, 4, 4, 1, 3, 3],
    ],
  },
  {
    link: 'fillomino-checkerboard/7/7/h7h1j5m1.3o8.2n3i6p',
    width: 7,
    height: 7,
    givens: [
      [null, null, 7, null, null, 1, null],
      [null, null, null, 5, null, null, null],
      [null, null, null, null, 1, null, 3],
      [null, null, null, null, null, null, null],
      [null, null, 8, null, 2, null, null],
      [null, null, null, null, null, null, 3],
      [null, null, null, 6, null, null, null],
    ],
    solution: [
      [7, 7, 7, 5, 6, 1, 6],
      [7, 5, 5, 5, 6, 6, 6],
      [7, 5, 4, 4, 1, 6, 3],
      [7, 7, 1, 4, 4, 3, 3],
      [6, 6, 8, 2, 2, 8, 8],
      [2, 6, 8, 8, 8, 8, 3],
      [2, 6, 6, 6, 8, 3, 3],
    ],
  },
  {
    link: 'fillomino-checkerboard/8/8/.2j3j2i3h3.3l2k3i2j5.3h1k7o1',
    width: 8,
    height: 8,
    givens: [
      [null, 2, null, null, null, null, 3, null],
      [null, null, null, 2, null, null, null, 3],
      [null, null, 3, null, 3, null, null, null],
      [null, null, null, 2, null, null, null, null],
      [null, 3, null, null, null, 2, null, null],
      [null, null, 5, null, 3, null, null, 1],
      [null, null, null, null, null, 7, null, null],
      [null, null, null, null, null, null, null, 1],
    ],
    solution: [
      [2, 2, 4, 2, 5, 5, 3, 3],
      [4, 4, 4, 2, 5, 5, 5, 3],
      [3, 3, 3, 1, 3, 3, 3, 7],
      [4, 4, 4, 2, 7, 7, 7, 7],
      [3, 3, 4, 2, 7, 2, 2, 7],
      [3, 1, 5, 4, 3, 7, 7, 1],
      [1, 5, 5, 4, 3, 7, 7, 7],
      [5, 5, 4, 4, 3, 7, 7, 1],
    ],
  },
  {
    link: 'fillomino-checkerboard/9/9/.2.3m4i1.5h6i5r8j35i3h3k8h6.62.3h6o6i',
    width: 9,
    height: 9,
    givens: [
      [null, 2, null, 3, null, null, null, null, null],
      [null, null, 4, null, null, null, 1, null, 5],
      [null, null, 6, null, null, null, 5, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, 8, null, null, null, null, 3, 5, null],
      [null, null, 3, null, null, 3, null, null, null],
      [null, null, 8, null, null, 6, null, 6, 2],
      [null, 3, null, null, 6, null, null, null, null],
      [null, null, null, null, null, 6, null, null, null],
    ],
    solution: [
      [1, 2, 2, 3, 3, 3, 5, 5, 5],
      [3, 4, 4, 5, 5, 5, 1, 5, 5],
      [3, 4, 6, 2, 2, 5, 5, 2, 2],
      [3, 4, 6, 6, 6, 3, 3, 5, 5],
      [2, 8, 3, 3, 6, 6, 3, 5, 5],
      [2, 8, 3, 8, 3, 3, 6, 1, 5],
      [8, 8, 8, 8, 3, 6, 6, 6, 2],
      [8, 3, 3, 3, 6, 1, 6, 6, 2],
      [1, 6, 6, 6, 6, 6, 2, 2, 1],
    ],
  },
];

describe('parseFillominoCheckerboardLink', () => {
  it.each(wpfPuzzles.map((puzzle) => [puzzle.link, puzzle] as const))(
    'round-trips WPF competition puzzle %#',
    (link, puzzle) => {
      const parsed = parseFillominoCheckerboardLink(link);
      expect(parsed).not.toBeNull();
      expect(parsed?.width).toBe(puzzle.width);
      expect(parsed?.height).toBe(puzzle.height);
      expect(parsed?.clues).toEqual(puzzle.givens);
    }
  );

  it('accepts full URLs with the query prefix', () => {
    const parsed = parseFillominoCheckerboardLink(
      `https://penpuz.today/?${wpfPuzzles[0].link}`
    );
    expect(parsed?.width).toBe(6);
    expect(parsed?.height).toBe(6);
  });

  it('rejects plain fillomino links', () => {
    expect(parseFillominoCheckerboardLink('fillomino/4/4/g3i1g5g2g4')).toBeNull();
  });
});

describe('WPF competition solutions', () => {
  it.each(wpfPuzzles.map((puzzle) => [puzzle] as const))(
    'solution %# is a valid Fillomino Checkerboard and covers every given',
    (puzzle) => {
      const result = validateFillominoCheckerboard(
        puzzle.solution,
        puzzle.width,
        puzzle.height
      );
      expect(result.valid).toBe(true);

      puzzle.givens.forEach((row, r) => {
        row.forEach((value, c) => {
          if (value !== null) {
            expect(puzzle.solution[r][c]).toBe(value);
          }
        });
      });
    }
  );
});
