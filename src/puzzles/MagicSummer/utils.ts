import type { MagicSummerCell, MagicSummerPuzzleData } from '../types';
import type { NumberPlacementValidationResult } from '../shared/NumberPlacementBoard';
import {
  decodeCustomPayload,
  getCellKey,
  isPositiveGridSize,
  parsePuzzLinkParts,
} from '../gridUtils';

interface MagicSummerPayload {
  numbers?: unknown;
  rowSums?: unknown;
  rowClues?: unknown;
  rows?: unknown;
  columnSums?: unknown;
  columnClues?: unknown;
  columns?: unknown;
  cells?: unknown;
  grid?: unknown;
}

function parseNumbers(candidate: unknown): number[] | null {
  if (Array.isArray(candidate)) {
    const numbers = candidate.filter((value): value is number =>
      Number.isInteger(value) && value >= 0 && value <= 9
    );
    if (
      numbers.length === candidate.length &&
      numbers.length > 0 &&
      new Set(numbers).size === numbers.length
    ) {
      return numbers;
    }
    return null;
  }

  if (typeof candidate !== 'string' || !candidate) return null;
  if (!/^\d+$/u.test(candidate)) return null;

  const digits = Array.from(candidate, Number);
  if (digits.length > 1 && new Set(digits).size === digits.length) return digits;

  const count = Number(candidate);
  if (!Number.isInteger(count) || count <= 0 || count > 10) return null;
  return Array.from({ length: count }, (_, index) => index + 1);
}

function parseLineSums(candidate: unknown, length: number): (number | null)[] | null {
  if (Array.isArray(candidate)) {
    if (candidate.length !== length) return null;
    return candidate.map((value) => {
      if (value === null || value === undefined || value === '' || value === '.') return null;
      return Number.isInteger(value) && value >= 0 ? value : null;
    });
  }

  if (typeof candidate !== 'string') return null;
  const values = candidate.split(/[,;|]/u);
  if (values.length !== length) return null;

  return values.map((value) => {
    const normalized = value.trim();
    if (!normalized || normalized === '.' || normalized === '-' || normalized === 'x') return null;
    return /^\d+$/u.test(normalized) ? Number(normalized) : null;
  });
}

function parseCells(
  candidate: unknown,
  width: number,
  height: number,
  allowedNumbers: Set<number>
): MagicSummerCell[][] | null {
  if (!Array.isArray(candidate) || candidate.length !== height) return null;

  const rows: MagicSummerCell[][] = [];
  for (const row of candidate) {
    if (!Array.isArray(row) || row.length !== width) return null;

    const cells: MagicSummerCell[] = [];
    for (const cell of row) {
      if (cell === null || cell === undefined || cell === '') {
        cells.push(null);
      } else if (cell === 'block' || cell === 'x' || cell === 'cross') {
        cells.push('block');
      } else if (Number.isInteger(cell) && allowedNumbers.has(cell)) {
        cells.push(cell);
      } else {
        return null;
      }
    }
    rows.push(cells);
  }

  return rows;
}

function parseCompactCellRow(
  encoded: string,
  width: number,
  allowedNumbers: Set<number>
): MagicSummerCell[] | null {
  const cells: MagicSummerCell[] = Array(width).fill(null);
  let cellIndex = 0;
  let stringIndex = 0;

  while (stringIndex < encoded.length && cellIndex < width) {
    const char = encoded[stringIndex];
    if (char === '.') {
      cells[cellIndex] = 'block';
      cellIndex++;
      stringIndex++;
      continue;
    }

    if (char >= 'g' && char <= 'z') {
      cellIndex += parseInt(char, 36) - 15;
      stringIndex++;
      continue;
    }

    if (char >= '0' && char <= '9') {
      const value = Number(char);
      if (!allowedNumbers.has(value)) return null;
      cells[cellIndex] = value;
      cellIndex++;
      stringIndex++;
      continue;
    }

    return null;
  }

  return cellIndex === width && stringIndex === encoded.length ? cells : null;
}

function parseCompactCellRows(
  encodedRows: string[],
  width: number,
  height: number,
  allowedNumbers: Set<number>
): MagicSummerCell[][] | null {
  if (encodedRows.length !== height) return null;

  const rows = encodedRows.map((encoded) => parseCompactCellRow(encoded, width, allowedNumbers));
  return rows.every((row): row is MagicSummerCell[] => row !== null) ? rows : null;
}

function parseCompactMagicSummer(
  parts: string[],
  width: number,
  height: number
): MagicSummerPuzzleData | null {
  if (parts.length < 7) return null;

  const numbers = parseNumbers(parts[3]);
  const rowSums = parseLineSums(parts[4], height);
  const columnSums = parseLineSums(parts[5], width);
  if (!numbers || !rowSums || !columnSums) return null;

  const cells = parseCompactCellRows(parts.slice(6), width, height, new Set(numbers));
  return cells
    ? { type: 'magic-summer', width, height, numbers, rowSums, columnSums, cells }
    : null;
}

function parsePayload(
  payload: MagicSummerPayload,
  width: number,
  height: number,
  fallbackNumbers: number[] | null
): MagicSummerPuzzleData | null {
  const numbers = parseNumbers(payload.numbers) ?? fallbackNumbers;
  const rowSums = parseLineSums(payload.rowSums ?? payload.rowClues ?? payload.rows, height);
  const columnSums = parseLineSums(
    payload.columnSums ?? payload.columnClues ?? payload.columns,
    width
  );
  const cells = parseCells(payload.cells ?? payload.grid, width, height, new Set(numbers ?? []));

  return numbers && rowSums && columnSums && cells
    ? { type: 'magic-summer', width, height, numbers, rowSums, columnSums, cells }
    : null;
}

export function parseMagicSummerLink(link: string): MagicSummerPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    if ((parts[0] !== 'magic' && parts[0] !== 'magic-summer') || parts.length < 4) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height)) return null;

    const fallbackNumbers = parseNumbers(parts[3]);
    const payloadCandidates = [
      parts.slice(3).join('/'),
      parts.slice(4).join('/'),
    ];
    for (const encoded of payloadCandidates) {
      const payload = decodeCustomPayload<MagicSummerPayload>(encoded);
      if (payload) {
        const puzzle = parsePayload(payload, width, height, fallbackNumbers);
        if (puzzle) return puzzle;
      }
    }

    return parseCompactMagicSummer(parts, width, height);
  } catch {
    return null;
  }
}

function getLineRuns(values: (number | null)[]) {
  const runs: number[] = [];
  let current = '';

  for (const value of values) {
    if (value === null) {
      if (current) {
        runs.push(Number(current));
        current = '';
      }
    } else {
      current += String(value);
    }
  }

  if (current) runs.push(Number(current));
  return runs;
}

function getLineSum(values: (number | null)[]) {
  return getLineRuns(values).reduce((sum, value) => sum + value, 0);
}

function markMissingOrDuplicateDigits(
  badCells: Set<string>,
  values: (number | null)[],
  row: number,
  column: boolean,
  numbers: number[]
) {
  const counts = new Map(numbers.map((number) => [number, 0]));
  values.forEach((value, index) => {
    if (value === null || !counts.has(value)) return;
    counts.set(value, (counts.get(value) ?? 0) + 1);
    if ((counts.get(value) ?? 0) > 1) {
      badCells.add(getCellKey(column ? index : row, column ? row : index));
    }
  });

  return numbers.some((number) => (counts.get(number) ?? 0) !== 1);
}

export function validateMagicSummer(
  grid: (number | null)[][],
  puzzle: MagicSummerPuzzleData
): NumberPlacementValidationResult {
  const badCells = new Set<string>();
  let message: string | undefined;
  const setMessage = (nextMessage: string) => {
    if (!message) message = nextMessage;
  };

  for (let row = 0; row < puzzle.height; row++) {
    const values = grid[row];
    if (markMissingOrDuplicateDigits(badCells, values, row, false, puzzle.numbers)) {
      setMessage('每一行都必须恰好包含一次每个指定数字');
    }
    const expected = puzzle.rowSums[row];
    if (expected !== null && getLineSum(values) !== expected) {
      setMessage('行外侧数字与该行连续数码组成的数字之和不符');
    }
  }

  for (let col = 0; col < puzzle.width; col++) {
    const values = grid.map((row) => row[col]);
    if (markMissingOrDuplicateDigits(badCells, values, col, true, puzzle.numbers)) {
      setMessage('每一列都必须恰好包含一次每个指定数字');
    }
    const expected = puzzle.columnSums[col];
    if (expected !== null && getLineSum(values) !== expected) {
      setMessage('列外侧数字与该列连续数码组成的数字之和不符');
    }
  }

  for (let row = 0; row < puzzle.height; row++) {
    for (let col = 0; col < puzzle.width; col++) {
      const fixedValue = puzzle.cells[row][col];
      if (fixedValue === 'block' && grid[row][col] !== null) {
        badCells.add(getCellKey(row, col));
        setMessage('有叉标记的格子不能填数');
      } else if (typeof fixedValue === 'number' && grid[row][col] !== fixedValue) {
        badCells.add(getCellKey(row, col));
        setMessage('固定数字不能被修改');
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
