import { computeArrowRunLengths, computeArrowRunVariants } from './ArrowRunLayout.ts';

function show(name, grid, width, height) {
  const v = computeArrowRunVariants(grid, width, height);
  const l = computeArrowRunLengths(grid, width, height);
  console.log(`== ${name}`);
  for (let r = 0; r < height; r++) {
    const row = [];
    for (let c = 0; c < width; c++) {
      const cell = grid[r][c];
      if (cell === null || cell === 'cross' || cell === 'circle' || cell === 0) { row.push(' .'); continue; }
      const badge = l[r][c] !== undefined ? String(l[r][c]) : ' ';
      row.push(v[r][c][0].toUpperCase() + badge);
    }
    console.log(row.join(' '));
  }
}

// Four Winds example (clue cells nulled)
const fwClues = [
  [null, null, 2, null, null],
  [null, null, null, null, 4],
  [null, 3, null, 2, null],
  [6, null, null, null, null],
  [null, null, 2, null, null],
];
const fwGrid = [
  [1, 1, 1, 2, 1],
  [1, 1, 3, 1, 1],
  [1, 1, 2, 1, 3],
  [1, 2, 2, 3, 3],
  [3, 4, 1, 2, 3],
].map((row, r) => row.map((v, c) => (fwClues[r][c] !== null ? null : v)));
show('fourwinds example', fwGrid, 5, 5);

// Four Winds with Parks example (clue cells nulled, 0 = park)
const fwpClues = [
  [3, null, null, 4, null],
  [null, null, 2, null, null],
  [null, null, null, null, null],
  [null, null, 2, null, null],
  [null, 1, null, null, 2],
];
const fwpGrid = [
  [0, 2, 0, 0, 2],
  [3, 4, 0, 3, 0],
  [3, 0, 3, 3, 1],
  [0, 4, 0, 3, 1],
  [4, 0, 3, 0, 0],
].map((row, r) => row.map((v, c) => (fwpClues[r][c] !== null ? null : (v === 0 ? 'circle' : v))));
show('four winds with parks example', fwpGrid, 5, 5);
