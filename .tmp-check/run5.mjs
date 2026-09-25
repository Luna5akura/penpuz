import { getSatisfiedFourWindsWithParksClues } from './src/utils.ts';

const puzzle = {
  type: 'four-winds-with-parks',
  width: 5,
  height: 5,
  clues: [
    [3, null, null, 4, null],
    [null, null, 2, null, null],
    [null, null, null, null, null],
    [null, null, 2, null, null],
    [null, 1, null, null, 2],
  ],
};
const correctGrid = [
  [0, 2, 0, 0, 2],
  [3, 4, 0, 3, 0],
  [3, 0, 3, 3, 1],
  [0, 4, 0, 3, 1],
  [4, 0, 3, 0, 0],
];
const grid = correctGrid.map((row, r) => row.map((v, c) => (puzzle.clues[r][c] !== null ? null : (v === 0 ? 'circle' : v))));
const s = getSatisfiedFourWindsWithParksClues(grid, puzzle);
for (const row of s) console.log(row.map(v => (v ? 'T' : '.')).join(' '));
console.log('all satisfied:', puzzle.clues.every((row, r) => row.every((c, i) => c === null || s[r][i])));
