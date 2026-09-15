import type { ConsecutiveKakuroPuzzleData, KakuroCell } from '../types';
import type { NumberPlacementValidationResult } from '../shared/NumberPlacementBoard';
import { decodeCustomPayload, getCellKey, isPositiveGridSize, parsePuzzLinkParts } from '../gridUtils';
import { validateKakuro } from '../Kakuro/utils';

function matrix(value: unknown, rows: number, cols: number) {
  if (!Array.isArray(value) || value.length !== rows) return null;
  return value.map((row) => Array.isArray(row) && row.length === cols && row.every((cell) => typeof cell === 'boolean') ? row as boolean[] : null);
}

export function parseConsecutiveKakuroLink(link: string): ConsecutiveKakuroPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link); const id = parts[0]?.toLowerCase();
    if (id !== 'consecutive-kakuro' && id !== 'consecutivekakuro') return null;
    const width = Number(parts[1]); const height = Number(parts[2]); if (!isPositiveGridSize(width, height)) return null;
    const payload = decodeCustomPayload<{ cells?: unknown; topClues?: unknown; leftClues?: unknown; horizontalBars?: unknown; verticalBars?: unknown }>(parts[3] ?? '');
    if (!payload || !Array.isArray(payload.cells) || payload.cells.length !== height) return null;
    const cells = payload.cells.map((row) => Array.isArray(row) && row.length === width ? row.map((cell) => {
      if (cell === null) return null;
      if (!cell || typeof cell !== 'object') return undefined;
      const value = cell as { right?: unknown; down?: unknown };
      return (value.right === null || (Number.isInteger(value.right) && (value.right as number) >= 0 && (value.right as number) <= 45)) &&
        (value.down === null || (Number.isInteger(value.down) && (value.down as number) >= 0 && (value.down as number) <= 45))
        ? { right: value.right as number | null, down: value.down as number | null } : undefined;
    }) : null);
    if (cells.some((row) => !row || row.some((cell) => cell === undefined))) return null;
    const horizontalBars = matrix(payload.horizontalBars, height, Math.max(0, width - 1));
    const verticalBars = matrix(payload.verticalBars, Math.max(0, height - 1), width);
    if (!horizontalBars || !verticalBars) return null;
    const topClues = Array.isArray(payload.topClues) && payload.topClues.length === width ? payload.topClues.map((x) => x === null || Number.isInteger(x) ? x as number | null : Number.NaN) : Array(width).fill(null);
    const leftClues = Array.isArray(payload.leftClues) && payload.leftClues.length === height ? payload.leftClues.map((x) => x === null || Number.isInteger(x) ? x as number | null : Number.NaN) : Array(height).fill(null);
    if (topClues.some(Number.isNaN) || leftClues.some(Number.isNaN)) return null;
    return { type: 'consecutive-kakuro', width, height, cells: cells as KakuroCell[][], topClues, leftClues, horizontalBars, verticalBars };
  } catch { return null; }
}

export function validateConsecutiveKakuro(grid: (number | null)[][], puzzle: ConsecutiveKakuroPuzzleData): NumberPlacementValidationResult {
  const base = validateKakuro(grid, puzzle);
  const bad = new Set(base.badCells.map(({ row, col }) => getCellKey(row, col))); let message = base.message;
  const setMessage = (value: string) => { if (!message) message = value; };
  const checkPair = (r1: number, c1: number, r2: number, c2: number, bar: boolean) => {
    if (puzzle.cells[r1][c1] !== null || puzzle.cells[r2][c2] !== null) return;
    const a = grid[r1]?.[c1]; const b = grid[r2]?.[c2]; if (typeof a !== 'number' || typeof b !== 'number') return;
    if ((Math.abs(a - b) === 1) !== bar) {
      bad.add(getCellKey(r1, c1)); bad.add(getCellKey(r2, c2));
      setMessage(bar ? '白线相邻格必须填连续数字' : '无白线相邻格不能填连续数字');
    }
  };
  for (let r = 0; r < puzzle.height; r++) for (let c = 0; c + 1 < puzzle.width; c++) checkPair(r, c, r, c + 1, puzzle.horizontalBars[r]?.[c] ?? false);
  for (let r = 0; r + 1 < puzzle.height; r++) for (let c = 0; c < puzzle.width; c++) checkPair(r, c, r + 1, c, puzzle.verticalBars[r]?.[c] ?? false);
  return { valid: !message && bad.size === 0, message, badCells: Array.from(bad, (key) => { const [row, col] = key.split(',').map(Number); return { row, col }; }) };
}
