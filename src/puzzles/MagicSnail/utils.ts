import type { MagicSnailCell, MagicSnailPuzzleData } from '../types';
import type { NumberPlacementValidationResult } from '../shared/NumberPlacementBoard';
import {
  decodeCustomPayload,
  getCellKey,
  isPositiveGridSize,
  parsePuzzLinkParts,
} from '../gridUtils';

interface MagicSnailPayload {
  numbers?: unknown;
  cells?: unknown;
}

function parseNumbers(candidate: unknown): number[] | null {
  if (!Array.isArray(candidate)) return null;
  const numbers = candidate.filter((value): value is number => Number.isInteger(value) && value > 0);
  if (numbers.length !== candidate.length || numbers.length === 0) return null;
  return numbers;
}

function parseCells(candidate: unknown, width: number, height: number, allowedNumbers: Set<number>): MagicSnailCell[][] | null {
  if (!Array.isArray(candidate) || candidate.length !== height) return null;

  const rows: MagicSnailCell[][] = [];
  for (const row of candidate) {
    if (!Array.isArray(row) || row.length !== width) return null;
    const cells: MagicSnailCell[] = [];
    for (const cell of row) {
      if (cell === null || cell === undefined) cells.push(null);
      else if (cell === 'block' || cell === 'x') cells.push('block');
      else if (Number.isInteger(cell) && allowedNumbers.has(cell)) cells.push(cell);
      else return null;
    }
    rows.push(cells);
  }

  return rows;
}

export function parseMagicSnailLink(link: string): MagicSnailPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    if ((parts[0] !== 'snail' && parts[0] !== 'magic-snail') || parts.length < 4) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height)) return null;

    const payload = decodeCustomPayload<MagicSnailPayload>(parts.slice(3).join('/'));
    if (!payload) return null;

    const numbers = parseNumbers(payload.numbers);
    if (!numbers) return null;

    const cells = parseCells(payload.cells, width, height, new Set(numbers));
    if (!cells) return null;

    return { type: 'snail', width, height, numbers, cells };
  } catch {
    return null;
  }
}

export function getMagicSnailSpiralPath(width: number, height: number) {
  const path: Array<{ row: number; col: number }> = [];
  let top = 0;
  let bottom = height - 1;
  let left = 0;
  let right = width - 1;

  while (top <= bottom && left <= right) {
    for (let col = left; col <= right; col++) path.push({ row: top, col });
    top++;
    for (let row = top; row <= bottom; row++) path.push({ row, col: right });
    right--;
    if (top <= bottom) {
      for (let col = right; col >= left; col--) path.push({ row: bottom, col });
      bottom--;
    }
    if (left <= right) {
      for (let row = bottom; row >= top; row--) path.push({ row, col: left });
      left++;
    }
  }

  return path;
}

function markLineDuplicates(
  badCells: Set<string>,
  values: Array<{ row: number; col: number; value: number | null }>
) {
  const seen = new Map<number, Array<{ row: number; col: number }>>();
  values.forEach((cell) => {
    if (cell.value === null) return;
    const cells = seen.get(cell.value) ?? [];
    cells.push(cell);
    seen.set(cell.value, cells);
  });

  let hasDuplicates = false;
  for (const cells of seen.values()) {
    if (cells.length <= 1) continue;
    hasDuplicates = true;
    cells.forEach((cell) => badCells.add(getCellKey(cell.row, cell.col)));
  }

  return hasDuplicates;
}

export function validateMagicSnail(
  grid: (number | null)[][],
  puzzle: MagicSnailPuzzleData
): NumberPlacementValidationResult {
  const { width, height, numbers, cells } = puzzle;
  const badCells = new Set<string>();
  let message: string | undefined;
  const setMessage = (nextMessage: string) => {
    if (!message) message = nextMessage;
  };

  for (let row = 0; row < height; row++) {
    const values = Array.from({ length: width }, (_, col) => ({ row, col, value: grid[row][col] }));
    if (markLineDuplicates(badCells, values)) setMessage('同一行中不能重复出现相同数字');
  }

  for (let col = 0; col < width; col++) {
    const values = Array.from({ length: height }, (_, row) => ({ row, col, value: grid[row][col] }));
    if (markLineDuplicates(badCells, values)) setMessage('同一列中不能重复出现相同数字');
  }

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const fixedValue = cells[row][col];
      if (typeof fixedValue === 'number' && grid[row][col] !== fixedValue) {
        badCells.add(getCellKey(row, col));
        setMessage('固定数字不能被修改');
      }
    }
  }

  const filledAlongSpiral = getMagicSnailSpiralPath(width, height)
    .filter((cell) => cells[cell.row][cell.col] !== 'block')
    .map((cell) => ({ ...cell, value: grid[cell.row][cell.col] }))
    .filter((cell): cell is { row: number; col: number; value: number } => cell.value !== null);

  if (filledAlongSpiral.length < numbers.length) {
    setMessage('至少需要沿螺旋填出一轮完整数字序列');
  }

  filledAlongSpiral.forEach((cell, index) => {
    const expected = numbers[index % numbers.length];
    if (cell.value !== expected) {
      badCells.add(getCellKey(cell.row, cell.col));
      setMessage('沿螺旋读取的数字顺序不正确');
    }
  });

  return {
    valid: !message && badCells.size === 0,
    message,
    badCells: Array.from(badCells).map((key) => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    }),
  };
}

