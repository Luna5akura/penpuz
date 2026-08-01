import type { MagicSnailCell, MagicSnailPuzzleData } from '../types';
import type { NumberPlacementValidationResult } from '../shared/NumberPlacementBoard';
import {
  type CellCoord,
  decodeCustomPayload,
  getCellKey,
  isPositiveGridSize,
  parsePuzzLinkParts,
} from '../gridUtils';

interface MagicSnailPayload {
  numbers?: unknown;
  cells?: unknown;
  start?: unknown;
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

function parseStart(candidate: unknown, width: number, height: number): CellCoord | undefined | null {
  if (candidate === null || candidate === undefined) return undefined;

  if (Array.isArray(candidate)) {
    const [row, col] = candidate;
    return Number.isInteger(row) && Number.isInteger(col) && row >= 0 && row < height && col >= 0 && col < width
      ? { row, col }
      : null;
  }

  if (typeof candidate === 'object') {
    const cell = candidate as Partial<CellCoord>;
    return Number.isInteger(cell.row) &&
      Number.isInteger(cell.col) &&
      cell.row >= 0 &&
      cell.row < height &&
      cell.col >= 0 &&
      cell.col < width
      ? { row: cell.row, col: cell.col }
      : null;
  }

  return null;
}

function parseSequentialNumbers(candidate: string): number[] | null {
  const count = Number(candidate);
  if (!Number.isInteger(count) || count <= 0) return null;
  return Array.from({ length: count }, (_, index) => index + 1);
}

function parseHexSlice(encoded: string, start: number, length: number): number | null {
  const value = encoded.slice(start, start + length);
  return value.length === length && /^[0-9a-f]+$/i.test(value) ? parseInt(value, 16) : null;
}

function readNumber16(encoded: string, index: number): [number | null, number] {
  const char = encoded[index];
  if (char === undefined) return [null, 0];
  if ((char >= '0' && char <= '9') || (char >= 'a' && char <= 'f')) {
    return [parseInt(char, 16), 1];
  }
  if (char === '-') {
    const value = parseHexSlice(encoded, index + 1, 2);
    return value === null ? [null, 0] : [value, 3];
  }
  if (char === '+') {
    const value = parseHexSlice(encoded, index + 1, 3);
    return value === null ? [null, 0] : [value, 4];
  }
  if (char === '=') {
    const value = parseHexSlice(encoded, index + 1, 3);
    return value === null ? [null, 0] : [value + 4096, 4];
  }
  if (char === '%' || char === '@') {
    const value = parseHexSlice(encoded, index + 1, 3);
    return value === null ? [null, 0] : [value + 8192, 4];
  }
  if (char === '*') {
    const value = parseHexSlice(encoded, index + 1, 4);
    return value === null ? [null, 0] : [value + 12240, 5];
  }
  if (char === '$') {
    const value = parseHexSlice(encoded, index + 1, 5);
    return value === null ? [null, 0] : [value + 77776, 6];
  }
  return [null, 0];
}

function parseCompactNumberCells(
  encoded: string,
  width: number,
  height: number,
  allowedNumbers: Set<number>
): { cells: MagicSnailCell[][]; rest: string } | null {
  const totalCells = width * height;
  const cells = Array<MagicSnailCell>(totalCells).fill(null);
  let cellIndex = 0;
  let stringIndex = 0;

  while (stringIndex < encoded.length && cellIndex < cells.length) {
    const char = encoded[stringIndex];

    if (char === '.') {
      cells[cellIndex] = 'block';
      cellIndex++;
      stringIndex++;
      continue;
    }

    const [value, consumed] = readNumber16(encoded, stringIndex);

    if (consumed > 0) {
      if (value !== null && !allowedNumbers.has(value)) return null;
      cells[cellIndex] = value;
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

  if (cellIndex !== cells.length) return null;

  return {
    cells: Array.from({ length: height }, (_, row) => cells.slice(row * width, (row + 1) * width)),
    rest: encoded.slice(stringIndex),
  };
}

function parseCompactStartPrefix(encoded: string, width: number, height: number): CellCoord | undefined | null {
  if (!encoded) return undefined;

  const totalCells = width * height;
  let cellIndex = 0;

  for (const char of encoded) {
    if (char < 'i' || char > 'z') return null;

    const value = parseInt(char, 36);
    if (!Number.isFinite(value)) return null;
    cellIndex += value - 17;
    if (cellIndex >= totalCells) return null;
  }

  return { row: Math.floor(cellIndex / width), col: cellIndex % width };
}

function parseCompactMagicSnailData(parts: string[], width: number, height: number): MagicSnailPuzzleData | null {
  if (parts.length < 5) return null;

  const numbers = parseSequentialNumbers(parts[3]);
  if (!numbers) return null;

  const encodedData = parts.slice(4).join('/').replace(/\/+$/u, '');
  if (!encodedData) return null;
  const allowedNumbers = new Set(numbers);
  const direct = parseCompactNumberCells(encodedData, width, height, allowedNumbers);
  if (direct?.rest === '') {
    return { type: 'snail', width, height, numbers, cells: direct.cells };
  }

  for (let splitIndex = 1; splitIndex < encodedData.length; splitIndex++) {
    const start = parseCompactStartPrefix(encodedData.slice(0, splitIndex), width, height);
    if (start === null) continue;

    const decoded = parseCompactNumberCells(encodedData.slice(splitIndex), width, height, allowedNumbers);
    if (decoded?.rest === '') {
      return { type: 'snail', width, height, numbers, cells: decoded.cells };
    }
  }

  return null;
}

export function parseMagicSnailLink(link: string): MagicSnailPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    if ((parts[0] !== 'snail' && parts[0] !== 'magic-snail') || parts.length < 4) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height)) return null;

    const compactPuzzle = parseCompactMagicSnailData(parts, width, height);
    if (compactPuzzle) return compactPuzzle;

    const payload = decodeCustomPayload<MagicSnailPayload>(parts.slice(3).join('/'));
    if (!payload) return null;

    const numbers = parseNumbers(payload.numbers);
    if (!numbers) return null;

    const cells = parseCells(payload.cells, width, height, new Set(numbers));
    if (!cells) return null;
    const start = parseStart(payload.start, width, height);
    if (start === null) return null;

    return { type: 'snail', width, height, numbers, cells, start };
  } catch {
    return null;
  }
}

export function getMagicSnailSpiralPath(width: number, height: number, start?: CellCoord) {
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

  if (!start) return path;

  const startIndex = path.findIndex((cell) => cell.row === start.row && cell.col === start.col);
  if (startIndex <= 0) return path;
  return [...path.slice(startIndex), ...path.slice(0, startIndex)];
}

export function getMagicSnailStartCell(puzzle: MagicSnailPuzzleData) {
  const { width, height, cells, start } = puzzle;
  if (
    start &&
    start.row >= 0 &&
    start.row < height &&
    start.col >= 0 &&
    start.col < width &&
    cells[start.row][start.col] !== 'block'
  ) {
    return start;
  }

  return getMagicSnailSpiralPath(width, height).find((cell) => cells[cell.row][cell.col] !== 'block') ?? null;
}

export function getMagicSnailBoundaryLines(width: number, height: number) {
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  if (width <= 1 || height <= 1) return lines;

  let x = 0;
  let y = 1;
  let horizontalLength = width - 1;
  let verticalLength = height - 2;
  let directionIndex = 0;
  const directions = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
  ];

  while (horizontalLength > 0 || verticalLength > 0) {
    const length = directionIndex % 2 === 0 ? horizontalLength : verticalLength;
    if (length <= 0) break;

    const direction = directions[directionIndex % directions.length];
    const nextX = x + direction.x * length;
    const nextY = y + direction.y * length;
    lines.push({ x1: x, y1: y, x2: nextX, y2: nextY });
    x = nextX;
    y = nextY;

    if (directionIndex % 2 === 0) {
      horizontalLength--;
    } else {
      verticalLength--;
    }
    directionIndex++;
  }

  return lines;
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

  const start = getMagicSnailStartCell(puzzle);
  const filledAlongSpiral = getMagicSnailSpiralPath(width, height, start ?? undefined)
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
