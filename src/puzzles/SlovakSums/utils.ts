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

function isClueCell(candidate: unknown): candidate is SlovakSumsClueCell {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return false;
  const cell = candidate as Partial<SlovakSumsClueCell>;
  return Number.isInteger(cell.sum) && Number.isInteger(cell.count) && cell.sum >= 0 && cell.count >= 0;
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

export function parseSlovakSumsLink(link: string): SlovakSumsPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    if ((parts[0] !== 'slovak-sums' && parts[0] !== 'slovaksums') || parts.length < 4) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height)) return null;

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

      if (adjacentValues.length !== clue.count || sum !== clue.sum) {
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

