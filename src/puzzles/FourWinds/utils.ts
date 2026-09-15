import type { FourWindsPuzzleData } from '../types';
import type { NumberPlacementValidationResult } from '../shared/NumberPlacementBoard';
import { decodeCustomPayload, getCellKey, isPositiveGridSize, parsePuzzLinkParts } from '../gridUtils';

export type FourWindsValue = 0 | 1 | 2 | 3 | 4; // X, N, E, S, W
const DELTAS: Record<Exclude<FourWindsValue, 0>, [number, number]> = {
  1: [-1, 0], 2: [0, 1], 3: [1, 0], 4: [0, -1],
};

export function parseFourWindsLink(link: string): FourWindsPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link); const id = parts[0]?.toLowerCase();
    if (id !== 'four-winds-with-parks' && id !== 'fourwindswithparks' && id !== 'fourwinds') return null;
    const width = Number(parts[1]); const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height)) return null;
    const payload = decodeCustomPayload<{ clues?: unknown }>(parts[3] ?? '');
    if (!payload || !Array.isArray(payload.clues) || payload.clues.length !== height) return null;
    const clues = payload.clues.map((row) => Array.isArray(row) && row.length === width
      ? row.map((cell) => cell === null || (typeof cell === 'number' && Number.isInteger(cell) && cell >= 1 && cell <= width + height) ? cell as number | null : Number.NaN)
      : null);
    if (clues.some((row) => !row || row.some((cell) => Number.isNaN(cell)))) return null;
    return { type: 'four-winds-with-parks', width, height, clues: clues as (number | null)[][] };
  } catch { return null; }
}

export function validateFourWinds(
  grid: (number | null)[][],
  puzzle: FourWindsPuzzleData
): NumberPlacementValidationResult {
  const bad = new Set<string>(); let message: string | undefined;
  const setMessage = (value: string) => { if (!message) message = value; };
  const starts = new Map<string, number>(); const emptyRows = Array(puzzle.height).fill(0); const emptyCols = Array(puzzle.width).fill(0);
  for (let row = 0; row < puzzle.height; row++) for (let col = 0; col < puzzle.width; col++) {
    const clue = puzzle.clues[row][col]; const value = grid[row]?.[col] ?? null;
    if (clue !== null) {
      if (value !== null) { bad.add(getCellKey(row, col)); setMessage('数字格不能放置箭头或空格标记'); }
      continue;
    }
    if (!Number.isInteger(value) || value < 0 || value > 4) { bad.add(getCellKey(row, col)); setMessage('每个空格都必须画箭头或标记 X'); continue; }
    if (value === 0) { emptyRows[row]++; emptyCols[col]++; continue; }
    const [dr, dc] = DELTAS[value as Exclude<FourWindsValue, 0>];
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
