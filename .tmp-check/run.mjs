import { parseTapaLink, validateTapa } from './utils.ts';
const puzzle = parseTapaLink('http://localhost:8080/p.html?tapa/5/5/j1hbqoabh.j');
for (const row of puzzle.clues) console.log(row.map((c) => (c === null ? '.' : c.join(','))).join(' '));
const solution = [
  [1, 1, 1, 0, 0],
  [1, 0, 0, 1, 0],
  [1, 1, 0, 1, 1],
  [0, 1, 0, 0, 1],
  [0, 1, 1, 1, 1],
];
const grid = solution.map((row, r) => row.map((v, c) => (puzzle.clues[r][c] !== null ? 0 : v)));
const result = validateTapa(grid, puzzle);
console.log('valid:', result.valid, 'message:', result.message, 'bad:', result.badCells);
