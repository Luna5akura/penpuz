// src/puzzles/Fillomino/utils.test.ts
import { describe, expect, it } from 'vitest';
import {
  buildFillominoRegions,
  parseFillominoLink,
  validateFillomino,
  validateFillominoCheckerboard,
} from './utils';

// WPF Puzzle GP 2016, Round 3 IB example (verified against the booklet).
const exampleSolution = [
  [3, 1, 2, 2],
  [3, 3, 4, 4],
  [4, 4, 2, 4],
  [4, 4, 2, 4],
];

// Fillomino-valid division whose region adjacency graph contains a triangle
// (odd cycle): regions of size 1, 2 and 3 pairwise adjacent.
const oddCycleGrid = [
  [1, 2],
  [3, 2],
  [3, 3],
];

describe('validateFillomino', () => {
  it('accepts the WPF instruction example solution', () => {
    const result = validateFillomino(exampleSolution, 4, 4);
    expect(result.valid).toBe(true);
  });

  it('rejects a region whose clue mismatches its size', () => {
    const grid = [
      [2, 1],
      [3, 3],
      [3, 3],
    ];
    const result = validateFillomino(grid, 2, 3);
    expect(result.valid).toBe(false);
  });

  it('rejects orthogonally adjacent regions of the same size', () => {
    // Two size-2 regions sharing an edge: [[2,2],[2,2]] with a deep line
    // between the rows.  Both regions are valid in isolation, but two
    // adjacent regions of size 2 violate the fillomino rule.
    const sameSizeGrid = [
      [2, 2],
      [2, 2],
    ];
    const deepLines = new Set(['h-0-0']);
    const result = validateFillomino(sameSizeGrid, 2, 2, deepLines);
    expect(result.valid).toBe(false);
    expect(result.invalidCells.length).toBeGreaterThan(0);
  });
});

describe('validateFillominoCheckerboard', () => {
  it('accepts the WPF instruction example solution', () => {
    const result = validateFillominoCheckerboard(exampleSolution, 4, 4);
    expect(result.valid).toBe(true);
  });

  it('rejects a fillomino-valid division with an odd region cycle', () => {
    const fillomino = validateFillomino(oddCycleGrid, 2, 3);
    expect(fillomino.valid).toBe(true);

    const result = validateFillominoCheckerboard(oddCycleGrid, 2, 3);
    expect(result.valid).toBe(false);
    expect(result.invalidCells.length).toBe(6);
  });
});

describe('buildFillominoRegions', () => {
  it('splits the example into the six expected regions', () => {
    const { regions } = buildFillominoRegions(exampleSolution, 4, 4);
    const sizes = regions.map((region) => region.size).sort((a, b) => a - b);
    expect(sizes).toEqual([1, 2, 2, 3, 4, 4]);
  });

  it('respects explicit deep lines', () => {
    const grid = [
      [2, 2],
      [2, 2],
    ];
    const deepLines = new Set(['h-0-0', 'v-0-1']);
    const { regions } = buildFillominoRegions(grid, 2, 2, deepLines);
    expect(regions.length).toBe(2);
  });
});

describe('parseFillominoLink', () => {
  it('parses a pzpr fillomino link', () => {
    const parsed = parseFillominoLink('fillomino/4/4/g3i1g5g2g4');
    expect(parsed).not.toBeNull();
    expect(parsed?.width).toBe(4);
    expect(parsed?.height).toBe(4);
    expect(parsed?.clues[0]).toEqual([null, 3, null, null]);
  });

  it('rejects non-fillomino links', () => {
    expect(parseFillominoLink('nurikabe/4/4/g3i1')).toBeNull();
  });
});
