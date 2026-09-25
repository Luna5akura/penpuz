import { getSatisfiedFourWindsClues } from './src/utils.ts';

// WPF GP 2016 R1 instructions example (5×5) with its official solution.
const puzzle = {
  type: 'fourwinds',
  width: 5,
  height: 5,
  clues: [
    [null, null, 2, null, null],
    [null, null, null, null, 4],
    [null, 3, null, 2, null],
    [6, null, null, null, null],
    [null, null, 2, null, null],
  ],
};
const correctGrid = [
  [1, 1, 1, 2, 1],
  [1, 1, 3, 1, 1],
  [1, 1, 2, 1, 3],
  [1, 2, 2, 3, 3],
  [3, 4, 1, 2, 3],
];
const grid = correctGrid.map((row, r) => row.map((v, c) => (puzzle.clues[r][c] !== null ? null : v)));
console.log('grid:');
for (const row of grid) console.log(row.map(v => (v === null ? '.' : String(v))).join(' '));
const satisfied = getSatisfiedFourWindsClues(grid, puzzle);
console.log('satisfied:');
for (const row of satisfied) console.log(row.map(v => (v ? 'T' : '.')).join(' '));
console.log('all clues satisfied:', puzzle.clues.every((row, r) => row.every((c, i) => c === null || satisfied[r][i])));

// Partial grid: remove the 6@(3,0)'s arrows → 6 unsatisfied, others still satisfied.
const partial = grid.map(row => [...row]);
partial[2][0] = null; partial[3][1] = null; partial[3][2] = null; partial[4][0] = null;
const s2 = getSatisfiedFourWindsClues(partial, puzzle);
console.log('partial satisfied:');
for (const row of s2) console.log(row.map(v => (v ? 'T' : '.')).join(' '));
