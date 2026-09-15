import type { JapaneseArrowDirection, JapaneseArrowsPuzzleData } from '../types';
import type { NumberPlacementValidationResult } from '../shared/NumberPlacementBoard';
import { decodeCustomPayload, isPositiveGridSize, parsePuzzLinkParts, getCellKey } from '../gridUtils';

const DIRECTIONS: Record<JapaneseArrowDirection, [number, number]> = {
  N: [-1, 0], NE: [-1, 1], E: [0, 1], SE: [1, 1], S: [1, 0], SW: [1, -1], W: [0, -1], NW: [-1, -1],
};

function normalizeMatrix<T>(value: unknown, width: number, height: number, map: (cell: unknown) => T | undefined) {
  if (!Array.isArray(value) || value.length !== height) return null;
  const rows = value.map((row) => {
    if (!Array.isArray(row) || row.length !== width) return null;
    const mapped = row.map(map);
    return mapped.some((cell) => cell === undefined) ? null : mapped as T[];
  });
  return rows.some((row) => row === null) ? null : rows as T[][];
}

export function parseJapaneseArrowsLink(link: string): JapaneseArrowsPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    const id = parts[0]?.toLowerCase();
    if (id !== 'japanese-arrows' && id !== 'japanesearrows' && id !== 'japanese') return null;
    const width = Number(parts[1]); const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height)) return null;
    const payload = decodeCustomPayload<{ clues?: unknown; arrows?: unknown }>(parts[3] ?? '');
    if (!payload) return null;
    const clues = normalizeMatrix(payload.clues, width, height, (cell) =>
      cell === null || (typeof cell === 'number' && Number.isInteger(cell) && cell >= 1 && cell <= 9)
        ? cell as number | null : undefined);
    const arrows = normalizeMatrix(payload.arrows, width, height, (cell) =>
      typeof cell === 'string' && Object.prototype.hasOwnProperty.call(DIRECTIONS, cell) ? cell as JapaneseArrowDirection : undefined);
    return clues && arrows ? { type: 'japanese-arrows', width, height, clues, arrows } : null;
  } catch { return null; }
}

export function validateJapaneseArrows(
  grid: (number | null)[][],
  puzzle: JapaneseArrowsPuzzleData
): NumberPlacementValidationResult {
  const bad = new Set<string>(); let message: string | undefined;
  const setMessage = (value: string) => { if (!message) message = value; };
  for (let row = 0; row < puzzle.height; row++) for (let col = 0; col < puzzle.width; col++) {
    const value = grid[row]?.[col] ?? null;
    if (!Number.isInteger(value) || value < 1 || value > 9) {
      bad.add(getCellKey(row, col)); setMessage('每个格子都必须填入正整数'); continue;
    }
    const [dr, dc] = DIRECTIONS[puzzle.arrows[row][col]];
    const seen = new Set<number>(); let r = row + dr; let c = col + dc;
    while (r >= 0 && r < puzzle.height && c >= 0 && c < puzzle.width) {
      const next = grid[r]?.[c]; if (typeof next === 'number') seen.add(next);
      r += dr; c += dc;
    }
    if (seen.size !== value) { bad.add(getCellKey(row, col)); setMessage('箭头方向上的不同数字数量不正确'); }
  }
  for (let row = 0; row < puzzle.height; row++) for (let col = 0; col < puzzle.width; col++) {
    const clue = puzzle.clues[row][col]; const value = grid[row]?.[col] ?? null;
    if (clue !== null && value !== clue) { bad.add(getCellKey(row, col)); setMessage('固定数字不能修改'); }
  }
  return { valid: !message && bad.size === 0, message, badCells: Array.from(bad, (key) => { const [row, col] = key.split(',').map(Number); return { row, col }; }) };
}

export { DIRECTIONS };
