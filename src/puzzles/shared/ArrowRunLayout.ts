import type { DirectionalArrowVariant } from './DirectionalArrowMark';

const ARROW_DELTAS: Record<1 | 2 | 3 | 4, [number, number]> = {
  1: [-1, 0],
  2: [0, 1],
  3: [1, 0],
  4: [0, -1],
};

function isArrowDirection(value: unknown): value is 1 | 2 | 3 | 4 {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 4;
}

/**
 * Run layout shared by Four Winds and Four Winds with Parks: a run of
 * same-direction cells draws one continuous line where every cell except
 * the last is a bare `shaft` and the final cell carries the arrowhead.
 * Every arrow — including a lone single-cell arrow — uses the `head` tail
 * geometry, so its shaft spans the full cell just like the shaft cells of
 * a run.
 */
export function computeArrowRunVariants(
  grid: ReadonlyArray<ReadonlyArray<unknown>>,
  width: number,
  height: number
): DirectionalArrowVariant[][] {
  const variants: DirectionalArrowVariant[][] = Array.from(
    { length: height },
    () => Array<DirectionalArrowVariant>(width).fill('head')
  );
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const value = grid[row][col];
      if (!isArrowDirection(value)) continue;
      const [dr, dc] = ARROW_DELTAS[value];
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (nextRow >= 0 && nextRow < height && nextCol >= 0 && nextCol < width && grid[nextRow][nextCol] === value) {
        variants[row][col] = 'shaft';
      }
    }
  }
  return variants;
}

/**
 * The starting cell of every arrow longer than one cell shows its length.
 * Returns the run length at each run's starting cell and `undefined`
 * everywhere else.
 */
export function computeArrowRunLengths(
  grid: ReadonlyArray<ReadonlyArray<unknown>>,
  width: number,
  height: number
): (number | undefined)[][] {
  const lengths: (number | undefined)[][] = Array.from(
    { length: height },
    () => Array<number | undefined>(width).fill(undefined)
  );
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const value = grid[row][col];
      if (!isArrowDirection(value)) continue;
      const [dr, dc] = ARROW_DELTAS[value];
      const prevRow = row - dr;
      const prevCol = col - dc;
      if (prevRow >= 0 && prevRow < height && prevCol >= 0 && prevCol < width && grid[prevRow][prevCol] === value) {
        continue;
      }
      let length = 0;
      let r = row;
      let c = col;
      while (r >= 0 && r < height && c >= 0 && c < width && grid[r][c] === value) {
        length++;
        r += dr;
        c += dc;
      }
      if (length > 1) lengths[row][col] = length;
    }
  }
  return lengths;
}
