import type { SkyscrapersClues, SkyscrapersPuzzleData } from '../types';
import type { NumberPlacementValidationResult } from '../shared/NumberPlacementBoard';
import {
  decodeCustomPayload,
  getCellKey,
  isPositiveGridSize,
  parsePuzzLinkParts,
} from '../gridUtils';

interface SkyscrapersPayload {
  numbers?: unknown;
  clues?: unknown;
  top?: unknown;
  bottom?: unknown;
  left?: unknown;
  right?: unknown;
  givens?: unknown;
  grid?: unknown;
}

function createEmptyGrid(width: number, height: number): (number | null)[][] {
  return Array.from({ length: height }, () => Array<number | null>(width).fill(null));
}

function parseNumbers(candidate: unknown, fallbackSize: number): number[] | null {
  if (Array.isArray(candidate)) {
    const numbers = candidate.filter((value): value is number =>
      Number.isInteger(value) && value > 0
    );
    if (
      numbers.length !== candidate.length ||
      numbers.length === 0 ||
      new Set(numbers).size !== numbers.length
    ) {
      return null;
    }
    return numbers.sort((a, b) => a - b);
  }

  if (typeof candidate === 'string' && /^\d+$/.test(candidate)) {
    const numbers = Array.from(candidate, Number);
    if (numbers.length > 1 && new Set(numbers).size === numbers.length) {
      return numbers.sort((a, b) => a - b);
    }

    const count = Number(candidate);
    if (Number.isInteger(count) && count > 0) {
      return Array.from({ length: count }, (_, index) => index + 1);
    }
  }

  return Array.from({ length: fallbackSize }, (_, index) => index + 1);
}

function parseClueLine(candidate: unknown, length: number): (number | null)[] | null {
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
    if (!normalized || normalized === '.' || normalized === '-') return null;
    return /^\d+$/u.test(normalized) ? Number(normalized) : null;
  });
}

function parseClues(
  candidate: unknown,
  width: number,
  height: number
): SkyscrapersClues | null {
  if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
    const value = candidate as Record<string, unknown>;
    const top = parseClueLine(value.top, width);
    const bottom = parseClueLine(value.bottom, width);
    const left = parseClueLine(value.left, height);
    const right = parseClueLine(value.right, height);
    return top && bottom && left && right ? { top, bottom, left, right } : null;
  }

  if (Array.isArray(candidate) && candidate.length === 4) {
    const top = parseClueLine(candidate[0], width);
    const bottom = parseClueLine(candidate[1], width);
    const left = parseClueLine(candidate[2], height);
    const right = parseClueLine(candidate[3], height);
    return top && bottom && left && right ? { top, bottom, left, right } : null;
  }

  return null;
}

function parseGivens(
  candidate: unknown,
  width: number,
  height: number,
  numbers: Set<number>
): (number | null)[][] | null {
  if (!Array.isArray(candidate) || candidate.length !== height) return null;

  const givens: (number | null)[][] = [];
  for (const row of candidate) {
    if (!Array.isArray(row) || row.length !== width) return null;
    const parsedRow: (number | null)[] = [];
    for (const value of row) {
      if (value === null || value === undefined || value === '' || value === '.') {
        parsedRow.push(null);
      } else if (Number.isInteger(value) && numbers.has(value)) {
        parsedRow.push(value);
      } else {
        return null;
      }
    }
    givens.push(parsedRow);
  }

  return givens;
}

function readNumber16(encoded: string, index: number): [number, number] {
  const char = encoded[index];
  if (!char) return [-1, 0];
  if (/[0-9a-f]/.test(char)) return [parseInt(char, 16), 1];
  if (char === '.') return [-2, 1];

  const lengths: Record<string, number> = {
    '-': 2,
    '+': 3,
    '=': 3,
    '%': 3,
    '@': 3,
    '*': 4,
    '$': 5,
  };
  const payloadLength = lengths[char];
  if (!payloadLength) return [-1, 0];

  const end = index + payloadLength + 1;
  if (end > encoded.length) return [-1, 0];
  const payload = parseInt(encoded.slice(index + 1, end), 16);
  if (!Number.isFinite(payload)) return [-1, 0];

  if (char === '=') return [payload + 4096, payloadLength + 1];
  if (char === '%' || char === '@') return [payload + 8192, payloadLength + 1];
  if (char === '*') return [payload + 12240, payloadLength + 1];
  if (char === '$') return [payload + 77776, payloadLength + 1];
  return [payload, payloadLength + 1];
}

function decodeOutsideClues(
  encoded: string,
  count: number
): { values: (number | null)[]; consumed: number } | null {
  const values = Array<number | null>(count).fill(null);
  let slot = 0;
  let index = 0;

  while (index < encoded.length && slot < count) {
    const char = encoded[index];
    const [value, consumed] = readNumber16(encoded, index);

    if (value >= 0) {
      values[slot] = value;
      slot += 1;
      index += consumed;
      continue;
    }

    if (value === -2) {
      slot += 1;
      index += consumed;
      continue;
    }

    if (char >= 'g' && char <= 'z') {
      slot += parseInt(char, 36) - 15;
      index += 1;
      continue;
    }

    return null;
  }

  return slot >= count ? { values, consumed: index } : null;
}

function decodeGivens(
  encoded: string,
  width: number,
  height: number,
  numbers: Set<number>
): (number | null)[][] | null {
  const givens = createEmptyGrid(width, height);
  const totalCells = width * height;
  let cellIndex = 0;
  let index = 0;

  while (index < encoded.length && cellIndex < totalCells) {
    const char = encoded[index];
    const [value, consumed] = readNumber16(encoded, index);

    if (value >= 0) {
      if (!numbers.has(value)) return null;
      givens[Math.floor(cellIndex / width)][cellIndex % width] = value;
      cellIndex += 1;
      index += consumed;
      continue;
    }

    if (value === -2) {
      cellIndex += 1;
      index += consumed;
      continue;
    }

    if (char >= 'g' && char <= 'z') {
      cellIndex += parseInt(char, 36) - 15;
      index += 1;
      continue;
    }

    return null;
  }

  return cellIndex >= totalCells && index === encoded.length ? givens : null;
}

function parseCustomPayload(
  parts: string[],
  width: number,
  height: number,
  numbers: number[]
): SkyscrapersPuzzleData | null {
  const payload = decodeCustomPayload<SkyscrapersPayload>(parts.slice(3).join(''));
  if (!payload) return null;

  const parsedNumbers = parseNumbers(payload.numbers, Math.max(width, height)) ?? numbers;
  const clues = parseClues(
    payload.clues ?? {
      top: payload.top,
      bottom: payload.bottom,
      left: payload.left,
      right: payload.right,
    },
    width,
    height
  );
  const givens = parseGivens(payload.givens ?? payload.grid, width, height, new Set(parsedNumbers));
  if (!clues || !givens) return null;

  return {
    type: 'skyscrapers',
    width,
    height,
    numbers: parsedNumbers,
    clues,
    givens,
  };
}

export function parseSkyscrapersLink(link: string): SkyscrapersPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    if ((parts[0] !== 'skyscrapers' && parts[0] !== 'skyscraper' && parts[0] !== 'building') || parts.length < 4) {
      return null;
    }

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height)) return null;

    const fallbackNumbers = Array.from({ length: Math.max(width, height) }, (_, index) => index + 1);
    const customPuzzle = parseCustomPayload(parts, width, height, fallbackNumbers);
    if (customPuzzle) return customPuzzle;

    const encoded = parts.slice(3).join('');
    const outside = decodeOutsideClues(encoded, 2 * (width + height));
    if (!outside) return null;

    const top = outside.values.slice(0, width);
    const bottom = outside.values.slice(width, width * 2);
    const left = outside.values.slice(width * 2, width * 2 + height);
    const right = outside.values.slice(width * 2 + height);
    const givens = outside.consumed < encoded.length
      ? decodeGivens(encoded.slice(outside.consumed), width, height, new Set(fallbackNumbers))
      : createEmptyGrid(width, height);

    if (!givens) return null;

    return {
      type: 'skyscrapers',
      width,
      height,
      numbers: fallbackNumbers,
      clues: { top, bottom, left, right },
      givens,
    };
  } catch {
    return null;
  }
}

function getVisibility(values: (number | null)[]) {
  let tallest = 0;
  let visible = 0;

  for (const value of values) {
    if (value === null) return null;
    if (value > tallest) {
      tallest = value;
      visible += 1;
    }
  }

  return visible;
}

function validateLine(
  badCells: Set<string>,
  values: (number | null)[],
  row: number | null,
  col: number | null,
  numbers: Set<number>
) {
  const seen = new Set<number>();
  let valid = true;

  values.forEach((value, index) => {
    if (value === null || !numbers.has(value) || seen.has(value)) {
      valid = false;
      const cellRow = row === null ? index : row;
      const cellCol = col === null ? index : col;
      badCells.add(getCellKey(cellRow, cellCol));
    }
    if (value !== null) seen.add(value);
  });

  return valid;
}

export function validateSkyscrapers(
  grid: (number | null)[][],
  puzzle: SkyscrapersPuzzleData
): NumberPlacementValidationResult {
  const { width, height, numbers, clues } = puzzle;
  const numberSet = new Set(numbers);
  const badCells = new Set<string>();
  let message: string | undefined;
  let complete = true;
  let valid = true;

  for (let row = 0; row < height; row++) {
    if (grid[row]?.length !== width) {
      valid = false;
      complete = false;
      continue;
    }
    if (grid[row].some((value) => value === null)) complete = false;
    if (!validateLine(badCells, grid[row], row, null, numberSet)) {
      valid = false;
      message ??= '每一行和每一列都不能重复数字，且只能填入规定范围内的数字';
    }
  }

  for (let col = 0; col < width; col++) {
    const values = Array.from({ length: height }, (_, row) => grid[row]?.[col] ?? null);
    if (values.some((value) => value === null)) complete = false;
    if (!validateLine(badCells, values, null, col, numberSet)) {
      valid = false;
      message ??= '每一行和每一列都不能重复数字，且只能填入规定范围内的数字';
    }
  }

  if (!complete) {
    return {
      valid: false,
      message,
      badCells: Array.from(badCells).map((key) => {
        const [row, col] = key.split(',').map(Number);
        return { row, col };
      }),
    };
  }

  for (let row = 0; row < height; row++) {
    const values = grid[row];
    const leftVisibility = getVisibility(values);
    const rightVisibility = getVisibility([...values].reverse());
    const leftClue = clues.left[row];
    const rightClue = clues.right[row];

    if (leftClue !== null && leftVisibility !== leftClue) {
      valid = false;
      message ??= '盘面外的可见摩天楼数量不正确';
      for (let col = 0; col < width; col++) badCells.add(getCellKey(row, col));
    }
    if (rightClue !== null && rightVisibility !== rightClue) {
      valid = false;
      message ??= '盘面外的可见摩天楼数量不正确';
      for (let col = 0; col < width; col++) badCells.add(getCellKey(row, col));
    }
  }

  for (let col = 0; col < width; col++) {
    const values = Array.from({ length: height }, (_, row) => grid[row][col]);
    const topClue = clues.top[col];
    const bottomClue = clues.bottom[col];
    const topVisibility = getVisibility(values);
    const bottomVisibility = getVisibility([...values].reverse());

    if (topClue !== null && topVisibility !== topClue) {
      valid = false;
      message ??= '盘面外的可见摩天楼数量不正确';
      for (let row = 0; row < height; row++) badCells.add(getCellKey(row, col));
    }
    if (bottomClue !== null && bottomVisibility !== bottomClue) {
      valid = false;
      message ??= '盘面外的可见摩天楼数量不正确';
      for (let row = 0; row < height; row++) badCells.add(getCellKey(row, col));
    }
  }

  return {
    valid,
    message,
    badCells: Array.from(badCells).map((key) => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    }),
  };
}
