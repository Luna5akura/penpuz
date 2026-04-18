import type { AkariCell, AkariPuzzleData } from '../types';

export type AkariCellState = 0 | 1 | 2;

export interface AkariValidationResult {
  valid: boolean;
  message?: string;
  badCells: { r: number; c: number }[];
}

export interface AkariIlluminationResult {
  illuminated: boolean[][];
  conflictingBulbs: Set<string>;
}

export function createEmptyAkariGrid(width: number, height: number): AkariCellState[][] {
  return Array.from({ length: height }, () => Array(width).fill(0) as AkariCellState[]);
}

export function isAkariBlackCell(cell: AkariCell) {
  return cell === 'black' || typeof cell === 'number';
}

function createEmptyAkariCells(width: number, height: number): AkariCell[][] {
  return Array.from({ length: height }, () => Array(width).fill(null) as AkariCell[]);
}

export function parseAkariLink(link: string): AkariPuzzleData | null {
  try {
    let dataPart = link.includes('?') ? link.split('?')[1] : link;
    if (dataPart.startsWith('p?')) dataPart = dataPart.slice(2);

    const parts = dataPart.split('/');
    if (parts[0] !== 'akari' || parts.length < 4) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    const encoded = parts.slice(3).join('/');
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || !encoded) {
      return null;
    }

    const cells = createEmptyAkariCells(width, height);
    const totalCells = width * height;
    let cellIndex = 0;

    for (let index = 0; index < encoded.length && cellIndex < totalCells; index++) {
      const ch = encoded[index];
      const row = Math.floor(cellIndex / width);
      const col = cellIndex % width;

      if (ch === '.') {
        cells[row][col] = 'black';
        cellIndex += 1;
      } else if (/[0-4]/.test(ch)) {
        cells[row][col] = Number(ch);
        cellIndex += 1;
      } else if (/[5-9]/.test(ch)) {
        cells[row][col] = Number(ch) - 5;
        cellIndex += 2;
      } else if (/[a-e]/.test(ch)) {
        cells[row][col] = parseInt(ch, 16) - 10;
        cellIndex += 3;
      } else if (/[g-z]/.test(ch)) {
        cellIndex += parseInt(ch, 36) - 15;
      }
    }

    return {
      type: 'akari',
      width,
      height,
      cells,
    };
  } catch {
    return null;
  }
}

export function getAkariIllumination(
  grid: AkariCellState[][],
  puzzle: AkariPuzzleData
): AkariIlluminationResult {
  const { width, height, cells } = puzzle;
  const illuminated = Array.from({ length: height }, () => Array(width).fill(false));
  const conflictingBulbs = new Set<string>();

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (grid[row][col] !== 1) continue;

      illuminated[row][col] = true;

      const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ] as const;

      for (const [dr, dc] of directions) {
        let nextRow = row + dr;
        let nextCol = col + dc;

        while (
          nextRow >= 0 &&
          nextRow < height &&
          nextCol >= 0 &&
          nextCol < width &&
          !isAkariBlackCell(cells[nextRow][nextCol])
        ) {
          illuminated[nextRow][nextCol] = true;
          if (grid[nextRow][nextCol] === 1) {
            conflictingBulbs.add(`${row},${col}`);
            conflictingBulbs.add(`${nextRow},${nextCol}`);
          }
          nextRow += dr;
          nextCol += dc;
        }
      }
    }
  }

  return { illuminated, conflictingBulbs };
}

export function validateAkari(
  grid: AkariCellState[][],
  puzzle: AkariPuzzleData
): AkariValidationResult {
  const { width, height, cells } = puzzle;
  const { illuminated, conflictingBulbs } = getAkariIllumination(grid, puzzle);
  const badCells = new Set<string>();
  let message: string | undefined;

  const setMessage = (nextMessage: string) => {
    if (!message) message = nextMessage;
  };

  for (const key of conflictingBulbs) {
    badCells.add(key);
    setMessage('灯泡不能互相照亮');
  }

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cell = cells[row][col];
      if (isAkariBlackCell(cell)) continue;
      if (illuminated[row][col]) continue;
      badCells.add(`${row},${col}`);
      setMessage('所有非黑格都必须被照亮');
    }
  }

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cell = cells[row][col];
      if (typeof cell !== 'number') continue;

      const neighbors = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ] as const;

      let bulbCount = 0;
      for (const [nextRow, nextCol] of neighbors) {
        if (nextRow < 0 || nextRow >= height || nextCol < 0 || nextCol >= width) continue;
        if (grid[nextRow][nextCol] === 1) bulbCount++;
      }

      if (bulbCount === cell) continue;

      badCells.add(`${row},${col}`);
      for (const [nextRow, nextCol] of neighbors) {
        if (nextRow < 0 || nextRow >= height || nextCol < 0 || nextCol >= width) continue;
        if (!isAkariBlackCell(cells[nextRow][nextCol])) {
          badCells.add(`${nextRow},${nextCol}`);
        }
      }
      setMessage('数字线索周围的灯泡数量不正确');
    }
  }

  return {
    valid: badCells.size === 0,
    message,
    badCells: Array.from(badCells).map((key) => {
      const [r, c] = key.split(',').map(Number);
      return { r, c };
    }),
  };
}
