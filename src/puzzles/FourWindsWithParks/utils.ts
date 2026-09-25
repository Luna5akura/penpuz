import type { FourWindsWithParksCellValue, FourWindsWithParksPuzzleData } from '../types';
import type { NumberPlacementValidationResult } from '../shared/NumberPlacementBoard';
import { getCellKey, isPositiveGridSize, parsePuzzLinkParts } from '../gridUtils';

export type FourWindsWithParksValue = 0 | 1 | 2 | 3 | 4; // Park/circle, N, E, S, W
const DELTAS: Record<Exclude<FourWindsWithParksValue, 0>, [number, number]> = {
  1: [-1, 0], 2: [0, 1], 3: [1, 0], 4: [0, -1],
};

function readNumber16(encoded: string, index: number): { value: number | null; consumed: number } | null {
  const char = encoded[index];
  if (!char) return null;

  if (char === '.') return { value: null, consumed: 1 };

  if (/^[0-9a-f]$/u.test(char)) {
    return { value: Number.parseInt(char, 16), consumed: 1 };
  }

  const prefixedLengths: Record<string, number> = {
    '-': 2,
    '+': 3,
    '=': 3,
    '%': 3,
    '@': 3,
    '*': 4,
    '$': 5,
  };
  const digitCount = prefixedLengths[char];
  if (digitCount === undefined) return null;

  const digits = encoded.slice(index + 1, index + 1 + digitCount);
  if (digits.length !== digitCount || !/^[0-9a-f]+$/u.test(digits)) return null;

  let value = Number.parseInt(digits, 16);
  if (char === '=') value += 4096;
  else if (char === '%' || char === '@') value += 8192;
  else if (char === '*') value += 12240;
  else if (char === '$') value += 77776;
  return { value, consumed: digitCount + 1 };
}

/** Decode the native PuzzLink number16 clue stream. */
function decodeFourWindsWithParksClues(encoded: string, width: number, height: number) {
  const clues = Array.from({ length: height }, () => Array<number | null>(width).fill(null));
  const cellCount = width * height;
  let cellIndex = 0;
  let stringIndex = 0;

  while (stringIndex < encoded.length && cellIndex < cellCount) {
    const char = encoded[stringIndex];
    if (char >= 'g' && char <= 'z') {
      const skipped = Number.parseInt(char, 36) - 15;
      if (cellIndex + skipped > cellCount) return null;
      cellIndex += skipped;
      stringIndex += 1;
      continue;
    }

    const decoded = readNumber16(encoded, stringIndex);
    if (!decoded) return null;
    if (decoded.value !== null) {
      if (decoded.value < 1 || decoded.value > width + height) return null;
      clues[Math.floor(cellIndex / width)][cellIndex % width] = decoded.value;
    }
    cellIndex += 1;
    stringIndex += decoded.consumed;
  }

  return cellIndex === cellCount && stringIndex === encoded.length ? clues : null;
}

export function parseFourWindsWithParksLink(link: string): FourWindsWithParksPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    if (parts[0]?.toLowerCase() !== 'fourwindswithparks' || parts.length < 4) return null;
    const width = Number(parts[1]); const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height)) return null;
    const encoded = parts.slice(3).join('/').replace(/\/+$/u, '');
    if (!encoded) return null;
    const clues = decodeFourWindsWithParksClues(encoded, width, height);
    return clues ? { type: 'four-winds-with-parks', width, height, clues } : null;
  } catch { return null; }
}

export function validateFourWindsWithParks(
  grid: FourWindsWithParksCellValue[][],
  puzzle: FourWindsWithParksPuzzleData
): NumberPlacementValidationResult {
  const bad = new Set<string>(); let message: string | undefined;
  const setMessage = (value: string) => { if (!message) message = value; };
  const starts = new Map<string, number>(); const emptyRows = Array(puzzle.height).fill(0); const emptyCols = Array(puzzle.width).fill(0);
  for (let row = 0; row < puzzle.height; row++) for (let col = 0; col < puzzle.width; col++) {
    const clue = puzzle.clues[row][col]; const rawValue = grid[row]?.[col] ?? null;
    if (clue !== null) {
      if (rawValue !== null) { bad.add(getCellKey(row, col)); setMessage('数字格不能放置箭头或空格标记'); }
      continue;
    }
    if (rawValue === 'cross' || rawValue === null) {
      bad.add(getCellKey(row, col)); setMessage(rawValue === 'cross' ? '叉标记不能作为最终答案' : '每个空格都必须画箭头或标记圈'); continue;
    }
    const value = rawValue === 'circle' ? 0 : rawValue;
    if (!Number.isInteger(value) || value < 0 || value > 4) { bad.add(getCellKey(row, col)); setMessage('每个空格都必须画箭头或标记圈'); continue; }
    if (value === 0) { emptyRows[row]++; emptyCols[col]++; continue; }
    const [dr, dc] = DELTAS[value as Exclude<FourWindsWithParksValue, 0>];
    const prevRow = row - dr; const prevCol = col - dc;
    if (prevRow >= 0 && prevRow < puzzle.height && prevCol >= 0 && prevCol < puzzle.width && grid[prevRow]?.[prevCol] === value) continue;
    if (prevRow < 0 || prevRow >= puzzle.height || prevCol < 0 || prevCol >= puzzle.width || puzzle.clues[prevRow][prevCol] === null) {
      bad.add(getCellKey(row, col)); setMessage('每条箭头必须从数字格边缘开始'); continue;
    }
    let length = 0; let r = row; let c = col;
    while (r >= 0 && r < puzzle.height && c >= 0 && c < puzzle.width && grid[r]?.[c] === value) { length++; r += dr; c += dc; }
    const key = getCellKey(prevRow, prevCol); starts.set(key, (starts.get(key) ?? 0) + length);
  }
  for (let row = 0; row < puzzle.height; row++) for (let col = 0; col < puzzle.width; col++) {
    const clue = puzzle.clues[row][col]; if (clue === null) continue;
    if ((starts.get(getCellKey(row, col)) ?? 0) !== clue) { bad.add(getCellKey(row, col)); setMessage('数字格旁箭头的总长度不正确'); }
  }
  for (let row = 0; row < puzzle.height; row++) if (emptyRows[row] !== 1) { setMessage('每行必须恰好保留一个空格'); for (let col = 0; col < puzzle.width; col++) bad.add(getCellKey(row, col)); }
  for (let col = 0; col < puzzle.width; col++) if (emptyCols[col] !== 1) { setMessage('每列必须恰好保留一个空格'); for (let row = 0; row < puzzle.height; row++) bad.add(getCellKey(row, col)); }
  return { valid: !message && bad.size === 0, message, badCells: Array.from(bad, (key) => { const [row, col] = key.split(',').map(Number); return { row, col }; }) };
}

/**
 * A clue cell is satisfied when the total length of the arrows that begin at
 * its edge equals the clue value (parks never count toward the clue).  The
 * accounting mirrors validateFourWindsWithParks: only runs whose first cell
 * sits next to a numbered cell and points away from it count toward that
 * clue.
 */
export function getSatisfiedFourWindsWithParksClues(
  grid: FourWindsWithParksCellValue[][],
  puzzle: FourWindsWithParksPuzzleData
): boolean[][] {
  const satisfied = Array.from({ length: puzzle.height }, () => Array<boolean>(puzzle.width).fill(false));
  const totals = new Map<string, number>();

  for (let row = 0; row < puzzle.height; row++) {
    for (let col = 0; col < puzzle.width; col++) {
      const clue = puzzle.clues[row][col];
      const rawValue = grid[row]?.[col] ?? null;
      if (clue !== null) continue;
      if (rawValue === null || rawValue === 'cross') continue;
      const value = rawValue === 'circle' ? 0 : rawValue;
      if (!Number.isInteger(value) || value < 1 || value > 4) continue;

      const [dr, dc] = DELTAS[value as Exclude<FourWindsWithParksValue, 0>];
      const prevRow = row - dr;
      const prevCol = col - dc;
      // Only the first cell of an arrow run counts.
      if (prevRow >= 0 && prevRow < puzzle.height && prevCol >= 0 && prevCol < puzzle.width && grid[prevRow]?.[prevCol] === value) {
        continue;
      }
      // The run must begin on the edge of a numbered cell.
      if (prevRow < 0 || prevRow >= puzzle.height || prevCol < 0 || prevCol >= puzzle.width || puzzle.clues[prevRow][prevCol] === null) {
        continue;
      }

      let length = 0;
      let r = row;
      let c = col;
      while (r >= 0 && r < puzzle.height && c >= 0 && c < puzzle.width && grid[r]?.[c] === value) {
        length++;
        r += dr;
        c += dc;
      }
      const key = getCellKey(prevRow, prevCol);
      totals.set(key, (totals.get(key) ?? 0) + length);
    }
  }

  for (let row = 0; row < puzzle.height; row++) {
    for (let col = 0; col < puzzle.width; col++) {
      const clue = puzzle.clues[row][col];
      if (clue === null) continue;
      if ((totals.get(getCellKey(row, col)) ?? 0) === clue) {
        satisfied[row][col] = true;
      }
    }
  }

  return satisfied;
}
