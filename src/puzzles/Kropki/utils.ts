import type { KropkiDot, KropkiPuzzleData } from '../types';
import type { NumberPlacementValidationResult } from '../shared/NumberPlacementBoard';
import { isPositiveGridSize, parsePuzzLinkParts } from '../gridUtils';

const GIVEN_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';
const DOT_CHARS: Record<string, KropkiDot> = { w: 'white', b: 'black', e: 'either' };

function decodeGivenChar(char: string): number | null {
  if (char === '.' || char === '-') return null;
  const value = GIVEN_CHARS.indexOf(char.toLowerCase());
  return value >= 1 ? value : null;
}

/**
 * App kropki URL: kropki/W/H/<givens>/<hDots>/<vDots>
 * - givens: one char per cell row-major ('.' empty, 1-9 digits, a-z for 10+);
 * - hDots: one char per horizontal edge row-major, (H-1)*W of them;
 * - vDots: one char per vertical edge row-major, H*(W-1) of them.
 * Dot chars: '.' none, 'w' white (consecutive), 'b' black (double), 'e' either (1-2 pair).
 */
export function parseKropkiLink(link: string): KropkiPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    if (parts[0] !== 'kropki' || parts.length < 6) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height)) return null;

    const givensData = parts[3];
    const hDotsData = parts[4];
    const vDotsData = parts[5];
    if (givensData.length !== width * height) return null;
    if (hDotsData.length !== (height - 1) * width) return null;
    if (vDotsData.length !== height * (width - 1)) return null;

    const givens: (number | null)[][] = Array.from({ length: height }, (_, row) =>
      Array.from({ length: width }, (_, col) => decodeGivenChar(givensData[row * width + col]))
    );
    if (givens.flat().some((value) => value !== null && (value < 1 || value > width))) return null;

    const decodeDots = (data: string, rows: number, cols: number): (KropkiDot | null)[][] =>
      Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => {
          const char = data[row * cols + col];
          return char === '.' || char === '-' ? null : DOT_CHARS[char] ?? null;
        })
      );

    return {
      type: 'kropki',
      width,
      height,
      givens,
      verticalDots: decodeDots(vDotsData, height, width - 1),
      horizontalDots: decodeDots(hDotsData, height - 1, width),
    };
  } catch {
    return null;
  }
}

function dotViolation(a: number, b: number, dot: KropkiDot | null): boolean {
  const difference = Math.abs(a - b);
  if (dot === 'white') return difference !== 1;
  if (dot === 'black') return a !== 2 * b && b !== 2 * a;
  if (dot === 'either') return !((a === 1 && b === 2) || (a === 2 && b === 1));
  // No dot means neither a white nor a black dot could go there.
  return difference === 1 || a === 2 * b || b === 2 * a;
}

export function validateKropki(
  grid: (number | null)[][],
  puzzle: KropkiPuzzleData
): NumberPlacementValidationResult {
  const { width, height } = puzzle;
  const badCells = new Set<string>();
  let message: string | undefined;
  const setMessage = (nextMessage: string) => {
    message ??= nextMessage;
  };
  const key = (row: number, col: number) => `${row},${col}`;

  // 1. Every cell filled, values in range, givens unchanged.
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const value = grid[row]?.[col];
      if (value === null || value === undefined || !Number.isInteger(value) || value < 1 || value > width) {
        badCells.add(key(row, col));
        setMessage('每个格子都必须填入一个数字');
        continue;
      }
      const given = puzzle.givens[row][col];
      if (given !== null && value !== given) {
        badCells.add(key(row, col));
        setMessage('给定的数字不能改变');
      }
    }
  }

  // 2. Latin square rows and columns.
  const expected = Array.from({ length: width }, (_, index) => index + 1);
  for (let row = 0; row < height; row++) {
    const values = Array.from({ length: width }, (_, col) => grid[row]?.[col]).filter(
      (value): value is number => typeof value === 'number'
    );
    if (values.length !== width || !expected.every((value) => values.includes(value)) || new Set(values).size !== width) {
      for (let col = 0; col < width; col++) badCells.add(key(row, col));
      setMessage('每行的数字必须各不相同');
    }
  }
  for (let col = 0; col < width; col++) {
    const values = Array.from({ length: height }, (_, row) => grid[row]?.[col]).filter(
      (value): value is number => typeof value === 'number'
    );
    if (values.length !== height || !expected.every((value) => values.includes(value)) || new Set(values).size !== height) {
      for (let row = 0; row < height; row++) badCells.add(key(row, col));
      setMessage('每列的数字必须各不相同');
    }
  }

  // 3. Dot constraints on every edge.
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width - 1; col++) {
      const a = grid[row]?.[col];
      const b = grid[row]?.[col + 1];
      if (typeof a !== 'number' || typeof b !== 'number') continue;
      if (dotViolation(a, b, puzzle.verticalDots[row]?.[col] ?? null)) {
        badCells.add(key(row, col));
        badCells.add(key(row, col + 1));
        setMessage('相邻格子的黑白点关系不正确');
      }
    }
  }
  for (let row = 0; row < height - 1; row++) {
    for (let col = 0; col < width; col++) {
      const a = grid[row]?.[col];
      const b = grid[row + 1]?.[col];
      if (typeof a !== 'number' || typeof b !== 'number') continue;
      if (dotViolation(a, b, puzzle.horizontalDots[row]?.[col] ?? null)) {
        badCells.add(key(row, col));
        badCells.add(key(row + 1, col));
        setMessage('相邻格子的黑白点关系不正确');
      }
    }
  }

  return {
    valid: message === undefined,
    message,
    badCells: Array.from(badCells).map((cell) => {
      const [row, col] = cell.split(',').map(Number);
      return { row, col };
    }),
  };
}
