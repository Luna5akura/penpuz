import type { KakuroCell, KakuroClueCell, KakuroPuzzleData } from '../types';
import type { NumberPlacementValidationResult } from '../shared/NumberPlacementBoard';
import { getCellKey, isPositiveGridSize, parsePuzzLinkParts } from '../gridUtils';

/** A contiguous horizontal or vertical Kakuro run. */
export interface KakuroRun {
  direction: 'across' | 'down';
  clue: number | null;
  cells: Array<{ row: number; col: number }>;
  clueCell: { row: number; col: number } | null;
}

/**
 * The subset of Kakuro board data the run builder and validator read.
 * Consecutive Kakuro extends Kakuro with bar data and narrows `type`, so
 * accepting this structural shape lets it share the Kakuro validator.
 */
export type KakuroBoardData = Pick<
  KakuroPuzzleData,
  'width' | 'height' | 'cells' | 'topClues' | 'leftClues'
>;

/** Returns undefined for an invalid character; null is the PuzzLink '-' value. */
function decodeKakuroValue(char: string): number | null | undefined {
  if (char === '-') return null;
  if (/^[0-9]$/.test(char)) return Number(char);
  if (/^[a-j]$/.test(char)) return char.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
  // PuzzLink uses lower-case `a`-`j` for 10-19 and upper-case `A`-`Z`
  // for 20-45 (the latter are encoded as base-36 digits plus ten).
  if (/^[A-Z]$/.test(char)) return parseInt(char, 36) + 10;
  return undefined;
}

function decodeOutsideKakuroValue(char: string): number | null | undefined {
  // `-` is the native missing-clue marker.  A few exporters use `.` for the
  // same purpose; accepting it here is harmless because the interior parser
  // handles `.` separately as a black cell with no clues.
  if (char === '.') return null;
  return decodeKakuroValue(char);
}

/**
 * Decode the in-board portion of a PuzzLink Kakuro payload.  Shared with
 * Consecutive Kakuro, whose links reuse the same cell encoding.
 */
export function decodeInterior(
  encoded: string,
  width: number,
  height: number
): { cells: KakuroCell[][]; nextIndex: number } | null {
  const flat: KakuroCell[] = Array.from({ length: width * height }, () => null);
  let cellIndex = 0;
  let index = 0;

  while (cellIndex < flat.length && index < encoded.length) {
    const char = encoded[index];

    // PuzzLink uses k-z as a run-length skip for white cells. k means one
    // skipped cell, l means two, and so on (the offset is 19 in base 36).
    if (char >= 'k' && char <= 'z') {
      const skip = parseInt(char, 36) - 19;
      if (!Number.isInteger(skip) || skip <= 0 || cellIndex + skip > flat.length) return null;
      cellIndex += skip;
      index += 1;
      continue;
    }

    const isBlack = char === '.' || decodeKakuroValue(char) !== undefined;
    if (!isBlack) return null;

    if (char === '.') {
      flat[cellIndex] = { right: null, down: null };
      cellIndex += 1;
      index += 1;
      continue;
    }

    if (index + 1 >= encoded.length) return null;
    const down = decodeKakuroValue(char);
    const right = decodeKakuroValue(encoded[index + 1]);
    if (down === undefined || right === undefined) return null;

    flat[cellIndex] = { right, down };
    cellIndex += 1;
    index += 2;
  }

  if (cellIndex !== flat.length) return null;

  return {
    cells: Array.from({ length: height }, (_, row) =>
      flat.slice(row * width, (row + 1) * width)
    ),
    nextIndex: index,
  };
}

/**
 * Decode the out-of-board top/left ExCell clues that follow the in-board
 * portion of a PuzzLink Kakuro payload.  Shared with Consecutive Kakuro.
 */
export function readOutsideClues(
  encoded: string,
  startIndex: number,
  cells: KakuroCell[][],
  width: number,
  height: number
) {
  const topClues = Array<number | null>(width).fill(null);
  const leftClues = Array<number | null>(height).fill(null);
  let index = startIndex;

  // ExCells are emitted only for columns/rows whose first interior cell is
  // white. Their order is top (left to right), then left (top to bottom).
  for (let col = 0; col < width; col++) {
    if (cells[0][col] !== null) continue;
    if (index >= encoded.length) return null;
    const value = decodeOutsideKakuroValue(encoded[index]);
    if (value === undefined) return null;
    topClues[col] = value;
    index += 1;
  }

  for (let row = 0; row < height; row++) {
    if (cells[row][0] !== null) continue;
    if (index >= encoded.length) return null;
    const value = decodeOutsideKakuroValue(encoded[index]);
    if (value === undefined) return null;
    leftClues[row] = value;
    index += 1;
  }

  return { topClues, leftClues, nextIndex: index };
}

/**
 * PuzzLink stores a clue that starts on the top/left edge as an ExCell.  In
 * the application those ExCells are part of the Kakuro diagram itself (a
 * black clue cell), rather than an extra clue gutter around the diagram.
 * Promote the edge ExCells into a one-cell top row/left column and shift the
 * decoded interior accordingly.  This is only needed when at least one edge
 * clue was present; links that already contain in-grid edge clue cells keep
 * their original dimensions.
 */
export function promoteOutsideClues(
  cells: KakuroCell[][],
  topClues: (number | null)[],
  leftClues: (number | null)[],
  width: number,
  height: number
): { cells: KakuroCell[][]; width: number; height: number } {
  const hasOutsideClue = topClues.some((value) => value !== null) ||
    leftClues.some((value) => value !== null);
  if (!hasOutsideClue) return { cells, width, height };

  const promoted = Array.from({ length: height + 1 }, () =>
    Array<KakuroCell>(width + 1).fill(null)
  );

  // The complete added top row and left column are black cells.  Cells with
  // no run simply carry two null clues, which preserves the rectangular grid
  // while ensuring there is no playable cell outside the puzzle boundary.
  for (let col = 0; col <= width; col++) {
    promoted[0][col] = {
      right: null,
      down: col === 0 ? null : topClues[col - 1],
    };
  }
  for (let row = 1; row <= height; row++) {
    promoted[row][0] = {
      right: leftClues[row - 1],
      down: null,
    };
  }

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      promoted[row + 1][col + 1] = cells[row][col];
    }
  }

  return { cells: promoted, width: width + 1, height: height + 1 };
}

/** Parse the native PuzzLink Kakuro encoding, promoting edge ExCells into the grid. */
export function parseKakuroLink(link: string): KakuroPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    if (parts[0] !== 'kakuro' || parts.length < 4) return null;

    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height)) return null;

    const encoded = parts[3] ?? '';
    if (!encoded) return null;

    const interior = decodeInterior(encoded, width, height);
    if (!interior) return null;
    const outside = readOutsideClues(encoded, interior.nextIndex, interior.cells, width, height);
    if (!outside) return null;

    // PuzzLink URLs may append an encoded answer after the puzzle clues.  The
    // official pzpr decoder consumes only the interior and outside clue
    // characters and deliberately leaves any remainder for its answer
    // decoder.  Do the same here: treating the remainder as puzzle cells
    // would make perfectly valid shared Kakuro links (which commonly include
    // an answer) fail to load.  The required puzzle portion has already been
    // validated above, so trailing data is safely ignored.

    const promoted = promoteOutsideClues(
      interior.cells,
      outside.topClues,
      outside.leftClues,
      width,
      height
    );

    return {
      type: 'kakuro',
      width: promoted.width,
      height: promoted.height,
      cells: promoted.cells,
      // Edge ExCells have been promoted into the grid.  Keep the fields for
      // compatibility with hand-authored puzzles, but do not render them as
      // an additional outside row/column.
      topClues: promoted.width === width ? outside.topClues : Array(width + 1).fill(null),
      leftClues: promoted.height === height ? outside.leftClues : Array(height + 1).fill(null),
    };
  } catch {
    return null;
  }
}

function isClueCell(cell: KakuroCell): cell is KakuroClueCell {
  return cell !== null;
}

function getAcrossRuns(puzzle: KakuroBoardData): KakuroRun[] {
  const runs: KakuroRun[] = [];
  const { width, height, cells, leftClues } = puzzle;

  for (let row = 0; row < height; row++) {
    let col = 0;
    while (col < width) {
      if (isClueCell(cells[row][col])) {
        col += 1;
        continue;
      }

      const startCol = col;
      while (col < width && !isClueCell(cells[row][col])) col += 1;
      const clueCellCol = startCol - 1;
      const clueCell = clueCellCol >= 0 && isClueCell(cells[row][clueCellCol])
        ? { row, col: clueCellCol }
        : null;
      const clue = clueCell
        ? (cells[row][clueCellCol] as KakuroClueCell).right
        : startCol === 0
          ? leftClues[row]
          : null;

      runs.push({
        direction: 'across',
        clue,
        clueCell,
        cells: Array.from({ length: col - startCol }, (_, offset) => ({ row, col: startCol + offset })),
      });
    }
  }

  return runs;
}

function getDownRuns(puzzle: KakuroBoardData): KakuroRun[] {
  const runs: KakuroRun[] = [];
  const { width, height, cells, topClues } = puzzle;

  for (let col = 0; col < width; col++) {
    let row = 0;
    while (row < height) {
      if (isClueCell(cells[row][col])) {
        row += 1;
        continue;
      }

      const startRow = row;
      while (row < height && !isClueCell(cells[row][col])) row += 1;
      const clueCellRow = startRow - 1;
      const clueCell = clueCellRow >= 0 && isClueCell(cells[clueCellRow][col])
        ? { row: clueCellRow, col }
        : null;
      const clue = clueCell
        ? (cells[clueCellRow][col] as KakuroClueCell).down
        : startRow === 0
          ? topClues[col]
          : null;

      runs.push({
        direction: 'down',
        clue,
        clueCell,
        cells: Array.from({ length: row - startRow }, (_, offset) => ({ row: startRow + offset, col })),
      });
    }
  }

  return runs;
}

export function getKakuroRuns(puzzle: KakuroBoardData): KakuroRun[] {
  return [...getAcrossRuns(puzzle), ...getDownRuns(puzzle)];
}

export function validateKakuro(
  grid: (number | null)[][],
  puzzle: KakuroBoardData
): NumberPlacementValidationResult {
  const badCells = new Set<string>();
  let message: string | undefined;
  const setMessage = (nextMessage: string) => {
    if (!message) message = nextMessage;
  };

  const addRunCells = (run: KakuroRun) => {
    run.cells.forEach(({ row, col }) => badCells.add(getCellKey(row, col)));
    if (run.clueCell) badCells.add(getCellKey(run.clueCell.row, run.clueCell.col));
  };

  // Every white cell is a required 1-9 entry. This also prevents an empty
  // or partially filled board from being reported as complete.
  for (let row = 0; row < puzzle.height; row++) {
    for (let col = 0; col < puzzle.width; col++) {
      if (puzzle.cells[row][col] !== null) continue;
      const value = grid[row]?.[col] ?? null;
      if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 9) {
        badCells.add(getCellKey(row, col));
        setMessage('每个白格都必须填入 1~9 的数字');
      }
    }
  }

  for (const run of getKakuroRuns(puzzle)) {
    if (run.cells.length === 0) continue;
    const values = run.cells.map(({ row, col }) => grid[row]?.[col] ?? null);
    const filled = values.filter((value): value is number => Number.isInteger(value));
    const hasDuplicate = new Set(filled).size !== filled.length;
    if (hasDuplicate) {
      addRunCells(run);
      setMessage('同一横段或纵段内的数字不能重复');
      continue;
    }

    if (filled.length !== run.cells.length) continue;

    const sum = filled.reduce((total, value) => total + value, 0);
    // A null clue means that the run has no sum constraint.  Any numeric
    // value (including 0 in a hand-authored puzzle) is explicit and must be
    // respected; silently ignoring zero would make malformed puzzle data
    // appear solvable.
    if (run.clue !== null && sum !== run.clue) {
      addRunCells(run);
      setMessage('横段或纵段的数字总和不正确');
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
