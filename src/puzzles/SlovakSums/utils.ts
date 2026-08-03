import type { SlovakSumsCell, SlovakSumsClueCell, SlovakSumsPuzzleData } from '../types';
import type { NumberPlacementValidationResult } from '../shared/NumberPlacementBoard';
import {
  decodeCustomPayload,
  getCellKey,
  getOrthogonalNeighbors,
  isPositiveGridSize,
  parsePuzzLinkParts,
} from '../gridUtils';

interface SlovakSumsPayload {
  numbers?: unknown;
  cells?: unknown;
}

function parseNumbers(candidate: unknown): number[] | null {
  if (!Array.isArray(candidate)) return null;
  const numbers = candidate.filter((value): value is number => Number.isInteger(value) && value > 0);
  if (numbers.length !== candidate.length || numbers.length === 0) return null;
  return numbers;
}

function parseSequentialNumbers(candidate: string): number[] | null {
  const count = Number(candidate);
  if (!Number.isInteger(count) || count <= 0) return null;
  return Array.from({ length: count }, (_, index) => index + 1);
}

function isClueCell(candidate: unknown): candidate is SlovakSumsClueCell {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return false;
  const cell = candidate as Partial<SlovakSumsClueCell>;
  const validSum =
    cell.sum === null ||
    (typeof cell.sum === 'number' && Number.isInteger(cell.sum) && cell.sum >= 0);
  const validCount = typeof cell.count === 'number' && Number.isInteger(cell.count) && cell.count >= 0;
  return validSum && validCount;
}

function parseCells(candidate: unknown, width: number, height: number): SlovakSumsCell[][] | null {
  if (!Array.isArray(candidate) || candidate.length !== height) return null;

  const rows: SlovakSumsCell[][] = [];
  for (const row of candidate) {
    if (!Array.isArray(row) || row.length !== width) return null;
    const cells: SlovakSumsCell[] = [];
    for (const cell of row) {
      if (cell === null || cell === undefined) cells.push(null);
      else if (isClueCell(cell)) cells.push({ sum: cell.sum, count: cell.count });
      else return null;
    }
    rows.push(cells);
  }

  return rows;
}

function readNumber16(encoded: string, index: number): [number, number] {
  if (index >= encoded.length) return [-1, 0];

  const char = encoded[index];
  if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
    return [parseInt(char, 16), 1];
  }
  if (char === '-') {
    return index + 3 <= encoded.length ? [parseInt(encoded.slice(index + 1, index + 3), 16), 3] : [-1, 0];
  }
  if (char === '+') {
    return index + 4 <= encoded.length ? [parseInt(encoded.slice(index + 1, index + 4), 16), 4] : [-1, 0];
  }
  if (char === '=') {
    return index + 4 <= encoded.length
      ? [parseInt(encoded.slice(index + 1, index + 4), 16) + 4096, 4]
      : [-1, 0];
  }
  if (char === '%' || char === '@') {
    return index + 4 <= encoded.length
      ? [parseInt(encoded.slice(index + 1, index + 4), 16) + 8192, 4]
      : [-1, 0];
  }
  if (char === '*') {
    return index + 5 <= encoded.length
      ? [parseInt(encoded.slice(index + 1, index + 5), 16) + 12240, 5]
      : [-1, 0];
  }
  if (char === '$') {
    return index + 6 <= encoded.length
      ? [parseInt(encoded.slice(index + 1, index + 6), 16) + 77776, 6]
      : [-1, 0];
  }
  if (char === '.') return [-2, 1];

  return [-1, 0];
}

function parseCompactCells(encoded: string, width: number, height: number): SlovakSumsCell[][] | null {
  const totalCells = width * height;
  const cells = Array<SlovakSumsCell>(totalCells).fill(null);
  let cellIndex = 0;
  let stringIndex = 0;

  while (stringIndex < encoded.length && cellIndex < totalCells) {
    const char = encoded[stringIndex];
    const [value, consumed] = readNumber16(encoded, stringIndex);

    if (value >= 0) {
      cells[cellIndex] =
        value <= 4
          ? { sum: null, count: value }
          : { sum: Math.floor(value / 5) - 1, count: value % 5 };
      cellIndex++;
      stringIndex += consumed;
      continue;
    }

    if (value === -2) {
      cells[cellIndex] = { sum: null, count: 0 };
      cellIndex++;
      stringIndex += consumed;
      continue;
    }

    if (char >= 'g' && char <= 'z') {
      cellIndex += parseInt(char, 36) - 15;
      stringIndex++;
      continue;
    }

    return null;
  }

  if (cellIndex !== totalCells || stringIndex !== encoded.length) return null;
  return Array.from({ length: height }, (_, row) => cells.slice(row * width, (row + 1) * width));
}

export function parseSlovakSumsLink(link: string): SlovakSumsPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    if ((parts[0] !== 'slovak-sums' && parts[0] !== 'slovaksums') || parts.length < 4) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height)) return null;

    if (parts.length >= 5) {
      const numbers = parseSequentialNumbers(parts[3]);
      const cells = parseCompactCells(parts.slice(4).join('/'), width, height);
      if (numbers && cells) return { type: 'slovak-sums', width, height, numbers, cells };
    }

    const payload = decodeCustomPayload<SlovakSumsPayload>(parts.slice(3).join('/'));
    if (!payload) return null;

    const numbers = parseNumbers(payload.numbers);
    const cells = parseCells(payload.cells, width, height);
    if (!numbers || !cells) return null;

    return { type: 'slovak-sums', width, height, numbers, cells };
  } catch {
    return null;
  }
}

function validateLineCounts(
  badCells: Set<string>,
  values: Array<{ row: number; col: number; value: number | null; blocked: boolean }>,
  numbers: number[]
) {
  let valid = true;

  for (const number of numbers) {
    const cells = values.filter((cell) => !cell.blocked && cell.value === number);
    if (cells.length === 1) continue;

    valid = false;
    values
      .filter((cell) => !cell.blocked)
      .forEach((cell) => badCells.add(getCellKey(cell.row, cell.col)));
  }

  return valid;
}

export function validateSlovakSums(
  grid: (number | null)[][],
  puzzle: SlovakSumsPuzzleData
): NumberPlacementValidationResult {
  const { width, height, numbers, cells } = puzzle;
  const badCells = new Set<string>();
  let message: string | undefined;
  const setMessage = (nextMessage: string) => {
    if (!message) message = nextMessage;
  };

  for (let row = 0; row < height; row++) {
    const values = Array.from({ length: width }, (_, col) => ({
      row,
      col,
      value: grid[row][col],
      blocked: cells[row][col] !== null,
    }));
    if (!validateLineCounts(badCells, values, numbers)) {
      setMessage('每一行都必须恰好包含一次每个指定数字');
    }
  }

  for (let col = 0; col < width; col++) {
    const values = Array.from({ length: height }, (_, row) => ({
      row,
      col,
      value: grid[row][col],
      blocked: cells[row][col] !== null,
    }));
    if (!validateLineCounts(badCells, values, numbers)) {
      setMessage('每一列都必须恰好包含一次每个指定数字');
    }
  }

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const clue = cells[row][col];
      if (!clue) continue;

      const adjacentValues = getOrthogonalNeighbors(row, col, width, height)
        .filter((cell) => cells[cell.row][cell.col] === null)
        .map((cell) => ({ ...cell, value: grid[cell.row][cell.col] }))
        .filter((cell): cell is { row: number; col: number; value: number } => cell.value !== null);
      const sum = adjacentValues.reduce((total, cell) => total + cell.value, 0);

      if (adjacentValues.length !== clue.count || (clue.sum !== null && sum !== clue.sum)) {
        badCells.add(getCellKey(row, col));
        adjacentValues.forEach((cell) => badCells.add(getCellKey(cell.row, cell.col)));
        setMessage('黑格线索的相邻数字数量或总和不正确');
      }
    }
  }

  return {
    valid: !message && badCells.size === 0,
    message,
    badCells: Array.from(badCells).map((key) => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    }),
  };
}
