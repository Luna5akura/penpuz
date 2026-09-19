import type { ConsecutiveKakuroPuzzleData, KakuroCell } from '../types';
import type { NumberPlacementValidationResult } from '../shared/NumberPlacementBoard';
import { decodeCustomPayload, getCellKey, isPositiveGridSize, parsePuzzLinkParts } from '../gridUtils';
import { decodeInterior, promoteOutsideClues, readOutsideClues, validateKakuro } from '../Kakuro/utils';

function matrix(value: unknown, rows: number, cols: number): boolean[][] | null {
  if (!Array.isArray(value) || value.length !== rows) return null;
  const result = value.map((row) => Array.isArray(row) && row.length === cols && row.every((cell) => typeof cell === 'boolean') ? row as boolean[] : null);
  return result.every((row) => row !== null) ? result as boolean[][] : null;
}

export function parseConsecutiveKakuroLink(link: string): ConsecutiveKakuroPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link); const id = parts[0]?.toLowerCase();
    if (id !== 'consecutive-kakuro' && id !== 'consecutivekakuro') return null;
    const width = Number(parts[1]); const height = Number(parts[2]); if (!isPositiveGridSize(width, height)) return null;
    const payload = parts[3] ?? '';
    const parsed = parseCustomPayload(payload, width, height) ?? parsePzprPayload(payload, width, height);
    return parsed ? finalizeParsedPuzzle(parsed) : null;
  } catch { return null; }
}

/**
 * Custom JSON payload: base64url-encoded
 * `{cells, topClues, leftClues, horizontalBars, verticalBars}`.
 */
function parseCustomPayload(payload: string, width: number, height: number): ConsecutiveKakuroPuzzleData | null {
  const decoded = decodeCustomPayload<{ cells?: unknown; topClues?: unknown; leftClues?: unknown; horizontalBars?: unknown; verticalBars?: unknown }>(payload);
  if (!decoded || !Array.isArray(decoded.cells) || decoded.cells.length !== height) return null;
  const cells = decoded.cells.map((row) => Array.isArray(row) && row.length === width ? row.map((cell) => {
    if (cell === null) return null;
    if (!cell || typeof cell !== 'object') return undefined;
    const value = cell as { right?: unknown; down?: unknown };
    return (value.right === null || (Number.isInteger(value.right) && (value.right as number) >= 0 && (value.right as number) <= 45)) &&
      (value.down === null || (Number.isInteger(value.down) && (value.down as number) >= 0 && (value.down as number) <= 45))
      ? { right: value.right as number | null, down: value.down as number | null } : undefined;
  }) : null);
  if (cells.some((row) => !row || row.some((cell) => cell === undefined))) return null;
  const horizontalBars = matrix(decoded.horizontalBars, height, Math.max(0, width - 1));
  const verticalBars = matrix(decoded.verticalBars, Math.max(0, height - 1), width);
  if (!horizontalBars || !verticalBars) return null;
  const topClues = Array.isArray(decoded.topClues) && decoded.topClues.length === width ? decoded.topClues.map((x) => x === null || Number.isInteger(x) ? x as number | null : Number.NaN) : Array(width).fill(null);
  const leftClues = Array.isArray(decoded.leftClues) && decoded.leftClues.length === height ? decoded.leftClues.map((x) => x === null || Number.isInteger(x) ? x as number | null : Number.NaN) : Array(height).fill(null);
  if (topClues.some(Number.isNaN) || leftClues.some(Number.isNaN)) return null;
  return { type: 'consecutive-kakuro', width, height, cells: cells as KakuroCell[][], topClues, leftClues, horizontalBars, verticalBars };
}

/**
 * Post-process a parsed puzzle before handing it to the board:
 * - drop bars that touch a black clue cell (pzpr's answer checker ignores
 *   them, and they would render as stray markers on the clue-cell border);
 * - promote the out-of-board top/left clues into a new clue row and clue
 *   column, exactly like Kakuro links, so the rendered board matches the
 *   one seen in the pzpr editor instead of silently dropping a row/column.
 */
function finalizeParsedPuzzle(puzzle: ConsecutiveKakuroPuzzleData): ConsecutiveKakuroPuzzleData {
  const horizontalBars = puzzle.horizontalBars.map((row, r) => row.map((bar, c) => bar && puzzle.cells[r][c] === null && puzzle.cells[r][c + 1] === null));
  const verticalBars = puzzle.verticalBars.map((row, r) => row.map((bar, c) => bar && puzzle.cells[r][c] === null && puzzle.cells[r + 1][c] === null));
  const cleaned: ConsecutiveKakuroPuzzleData = { ...puzzle, horizontalBars, verticalBars };

  const promoted = promoteOutsideClues(cleaned.cells, cleaned.topClues, cleaned.leftClues, cleaned.width, cleaned.height);
  if (promoted.width === cleaned.width && promoted.height === cleaned.height) return cleaned;

  const promotedHorizontalBars = Array.from({ length: promoted.height }, () => Array<boolean>(promoted.width - 1).fill(false));
  const promotedVerticalBars = Array.from({ length: promoted.height - 1 }, () => Array<boolean>(promoted.width).fill(false));
  for (let row = 0; row < cleaned.height; row++) {
    for (let col = 0; col < cleaned.width - 1; col++) {
      if (cleaned.horizontalBars[row][col]) promotedHorizontalBars[row + 1][col + 1] = true;
    }
  }
  for (let row = 0; row < cleaned.height - 1; row++) {
    for (let col = 0; col < cleaned.width; col++) {
      if (cleaned.verticalBars[row][col]) promotedVerticalBars[row + 1][col + 1] = true;
    }
  }

  return {
    ...cleaned,
    width: promoted.width,
    height: promoted.height,
    cells: promoted.cells,
    horizontalBars: promotedHorizontalBars,
    verticalBars: promotedVerticalBars,
    // The clues now live inside the grid; keep the legacy fields all-null
    // like parsed Kakuro links do after promotion.
    topClues: Array(promoted.width).fill(null),
    leftClues: Array(promoted.height).fill(null),
  };
}

/**
 * PuzzLink-style payload as emitted by the Atol-Solver "consecutivekakuro"
 * board: the standard Kakuro cell encoding (in-board clue cells plus the
 * top/left out-of-board ExCells), followed by a number16 grid with one digit
 * per cell.  Each digit packs two bar bits: 2 = white bar on the cell's
 * right border, 1 = white bar on its bottom border (3 = both).
 */
function parsePzprPayload(payload: string, width: number, height: number): ConsecutiveKakuroPuzzleData | null {
  const interior = decodeInterior(payload, width, height);
  if (!interior) return null;
  const outside = readOutsideClues(payload, interior.nextIndex, interior.cells, width, height);
  if (!outside) return null;

  const cellCount = width * height;
  const barValues = Array<number>(cellCount).fill(0);
  let cell = 0;
  let index = outside.nextIndex;
  while (cell < cellCount && index < payload.length) {
    const char = payload[index];
    // number16 uses `g`-`z` as run-length skips over empty entries.
    if (char >= 'g' && char <= 'z') {
      const skip = parseInt(char, 36) - 15;
      cell = Math.min(cellCount, cell + skip);
      index += 1;
      continue;
    }
    if (!/^[0-9a-f]$/.test(char)) return null;
    barValues[cell] = parseInt(char, 16);
    cell += 1;
    index += 1;
  }
  if (cell !== cellCount) return null;

  // Extract the per-cell bar bits.  Bits on the board edge (right border of
  // the last column, bottom border of the last row) are editor artifacts;
  // finalizeParsedPuzzle drops bars touching black clue cells afterwards.
  const horizontalBars = Array.from({ length: height }, () => Array<boolean>(Math.max(0, width - 1)).fill(false));
  const verticalBars = Array.from({ length: Math.max(0, height - 1) }, () => Array<boolean>(width).fill(false));
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const value = barValues[row * width + col];
      if (col + 1 < width && (value & 2) !== 0) {
        horizontalBars[row][col] = true;
      }
      if (row + 1 < height && (value & 1) !== 0) {
        verticalBars[row][col] = true;
      }
    }
  }

  return {
    type: 'consecutive-kakuro',
    width,
    height,
    cells: interior.cells,
    topClues: outside.topClues,
    leftClues: outside.leftClues,
    horizontalBars,
    verticalBars,
  };
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
