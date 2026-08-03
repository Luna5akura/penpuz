import type { TapaClue, TapaClueValue, TapaPuzzleData } from '../types';
import type { ShadingCellState, ShadingValidationResult } from '../shared/ShadingBoard';
import { getCellKey, isPositiveGridSize, parsePuzzLinkParts } from '../gridUtils';

type TapaRun = number;

function decodeTapaClue(encoded: string, index: number): { clue: TapaClue; consumed: number } | null {
  const char = encoded[index];
  if (!char) return null;

  if (char >= '0' && char <= '8') {
    return { clue: [Number(char)], consumed: 1 };
  }

  if (char === '9') {
    return { clue: [1, 1, 1, 1], consumed: 1 };
  }

  if (char === '.') {
    return { clue: ['?'], consumed: 1 };
  }

  if (char < 'a' || char > 'f' || index + 1 >= encoded.length) return null;

  const encodedValue = parseInt(encoded.slice(index, index + 2), 36);
  if (!Number.isFinite(encodedValue)) return null;

  let values: number[];
  if (encodedValue >= 360 && encodedValue < 396) {
    const value = encodedValue - 360;
    values = [Math.floor(value / 6), value % 6];
  } else if (encodedValue >= 396 && encodedValue < 460) {
    const value = encodedValue - 396;
    values = [Math.floor(value / 16), Math.floor((value % 16) / 4), value % 4];
  } else if (encodedValue >= 460 && encodedValue < 476) {
    const value = encodedValue - 460;
    values = [
      Math.floor(value / 8),
      Math.floor((value % 8) / 4),
      Math.floor((value % 4) / 2),
      value % 2,
    ];
  } else {
    return null;
  }

  return {
    clue: values.map((value) => (value === 0 ? '?' : value)),
    consumed: 2,
  };
}

export function parseTapaLink(link: string): TapaPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    if (parts[0] !== 'tapa' || parts.length < 4) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height)) return null;

    const encoded = parts.slice(3).join('/').replace(/\/+$/u, '');
    if (!encoded) return null;

    const clues = Array.from({ length: height }, () => Array<TapaClue | null>(width).fill(null));
    const totalCells = width * height;
    let cellIndex = 0;
    let stringIndex = 0;

    while (stringIndex < encoded.length && cellIndex < totalCells) {
      const char = encoded[stringIndex];
      if (char >= 'g' && char <= 'z') {
        cellIndex += parseInt(char, 36) - 15;
        stringIndex++;
        continue;
      }

      const decoded = decodeTapaClue(encoded, stringIndex);
      if (!decoded) return null;

      clues[Math.floor(cellIndex / width)][cellIndex % width] = decoded.clue;
      cellIndex++;
      stringIndex += decoded.consumed;
    }

    if (cellIndex !== totalCells || stringIndex !== encoded.length) return null;
    return { type: 'tapa', width, height, clues };
  } catch {
    return null;
  }
}

function getAdjacentRuns(grid: ShadingCellState[][], row: number, col: number): TapaRun[] {
  const positions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
    [1, 0],
    [1, -1],
    [0, -1],
  ] as const;
  const adjacent = positions.map(([rowOffset, colOffset]) => {
    const nextRow = row + rowOffset;
    const nextCol = col + colOffset;
    return nextRow >= 0 &&
      nextRow < grid.length &&
      nextCol >= 0 &&
      nextCol < grid[0].length &&
      grid[nextRow][nextCol] === 1;
  });

  if (!adjacent.some(Boolean)) return [];

  const firstWhite = adjacent.findIndex((value) => !value);
  const start = firstWhite === -1 ? 0 : firstWhite;
  const runs: TapaRun[] = [];
  let index = 0;

  while (index < adjacent.length) {
    const position = (start + index) % adjacent.length;
    if (!adjacent[position]) {
      index++;
      continue;
    }

    let length = 0;
    while (length < adjacent.length && adjacent[(start + index + length) % adjacent.length]) {
      length++;
    }
    runs.push(length);
    index += length;
  }

  return runs;
}

function areClueRunsValid(clue: TapaClue, actualRuns: TapaRun[]) {
  if (clue.length === 1 && clue[0] === 0) return actualRuns.length === 0;
  if (clue.length === 1 && clue[0] === '?') return true;
  if (clue.length !== actualRuns.length) return false;

  const remainingRuns = [...actualRuns];
  for (const expected of clue) {
    if (expected === '?') continue;
    const runIndex = remainingRuns.indexOf(expected);
    if (runIndex < 0) return false;
    remainingRuns.splice(runIndex, 1);
  }

  return remainingRuns.length === clue.filter((value) => value === '?').length;
}

function getShadedComponents(grid: ShadingCellState[][]) {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const visited = Array.from({ length: height }, () => Array(width).fill(false));
  const components: Array<Array<{ row: number; col: number }>> = [];

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (grid[row][col] !== 1 || visited[row][col]) continue;

      const component: Array<{ row: number; col: number }> = [];
      const queue = [{ row, col }];
      visited[row][col] = true;

      for (let index = 0; index < queue.length; index++) {
        const current = queue[index];
        component.push(current);

        for (const [rowOffset, colOffset] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nextRow = current.row + rowOffset;
          const nextCol = current.col + colOffset;
          if (
            nextRow < 0 ||
            nextRow >= height ||
            nextCol < 0 ||
            nextCol >= width ||
            visited[nextRow][nextCol] ||
            grid[nextRow][nextCol] !== 1
          ) {
            continue;
          }

          visited[nextRow][nextCol] = true;
          queue.push({ row: nextRow, col: nextCol });
        }
      }

      components.push(component);
    }
  }

  return components;
}

export function validateTapa(
  grid: ShadingCellState[][],
  puzzle: TapaPuzzleData
): ShadingValidationResult {
  const badCells = new Set<string>();
  let message: string | undefined;
  const setMessage = (nextMessage: string) => {
    if (!message) message = nextMessage;
  };

  for (let row = 0; row < puzzle.height; row++) {
    for (let col = 0; col < puzzle.width; col++) {
      const clue = puzzle.clues[row][col];
      if (!clue) continue;

      if (grid[row][col] === 1) {
        badCells.add(getCellKey(row, col));
        setMessage('线索格不能涂黑');
      }

      if (!areClueRunsValid(clue, getAdjacentRuns(grid, row, col))) {
        badCells.add(getCellKey(row, col));
        setMessage('线索周围的连续黑格段不符合');
      }
    }
  }

  for (let row = 0; row < puzzle.height - 1; row++) {
    for (let col = 0; col < puzzle.width - 1; col++) {
      if (
        grid[row][col] === 1 &&
        grid[row + 1][col] === 1 &&
        grid[row][col + 1] === 1 &&
        grid[row + 1][col + 1] === 1
      ) {
        for (const cell of [
          { row, col },
          { row: row + 1, col },
          { row, col: col + 1 },
          { row: row + 1, col: col + 1 },
        ]) {
          badCells.add(getCellKey(cell.row, cell.col));
        }
        setMessage('不能出现 2×2 全黑区域');
      }
    }
  }

  if (getShadedComponents(grid).length > 1) {
    setMessage('所有黑格必须连成一个整体');
  }

  return {
    valid: badCells.size === 0 && !message,
    message,
    badCells: Array.from(badCells).map((key) => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    }),
  };
}

export function getTapaClueValues(clue: TapaClue): TapaClueValue[] {
  return clue.length > 0 ? clue : ['?'];
}
