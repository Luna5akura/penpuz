import type { MagnetsPole, MagnetsPuzzleData } from '../types';
import type { NumberPlacementValidationResult } from '../shared/NumberPlacementBoard';
import { getCellKey, isPositiveGridSize, parsePuzzLinkParts } from '../gridUtils';

const PLUS = 1;
const MINUS = 2;

/**
 * Parse a pzpr/PuzzLink magnets link:
 * `magnets/[flag/]W/H/[excell number16][region borders base32][givens base27]`.
 *
 * The pzpr board stores two excell rows above every column (by=-1 holds the
 * '−' counts, by=-3 the '+' counts) and two excell columns left of every row
 * (bx=-1 '−', bx=-3 '+'), interleaved per column/row in that order.  This
 * app's rule set only defines the '+' counts above and the '−' counts to the
 * left, so the other two strips are read and skipped.
 */
export function parseMagnetsLink(link: string): MagnetsPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    if (parts[0]?.toLowerCase() !== 'magnets') return null;
    let offset = 1;
    // pzpr links may carry a single-letter config flag (`a` = anti-magnets)
    // right after the puzzle id; the standard rules ignore it.
    if (parts[1] && /^[a-z]$/i.test(parts[1]) && parts.length >= 5) offset = 2;
    const width = Number(parts[offset]);
    const height = Number(parts[offset + 1]);
    if (!isPositiveGridSize(width, height)) return null;
    const payload = parts[offset + 2] ?? '';
    if (!payload) return null;

    // --- excell clues (number16ExCell over 2*W + 2*H cells) ---
    const excellCount = 2 * width + 2 * height;
    const excell = Array<number>(excellCount).fill(-1);
    let e = 0;
    let index = 0;
    while (index < payload.length) {
      const char = payload[index];
      if (/^[0-9a-f]$/.test(char)) {
        excell[e] = parseInt(char, 16);
      } else if (char === '-') {
        if (!/^[0-9a-f]{2}$/.test(payload.slice(index + 1, index + 3))) return null;
        excell[e] = parseInt(payload.slice(index + 1, index + 3), 16);
        index += 2;
      } else if (char === '.') {
        excell[e] = -2;
      } else if (char >= 'g' && char <= 'z') {
        e += parseInt(char, 36) - 16;
      } else {
        return null;
      }
      e += 1;
      if (e >= excellCount) break;
      index += 1;
    }
    if (e < excellCount) return null;
    index += 1;

    // Two clue rows above (by=-3 = '+' farther, by=-1 = '−' nearer) and two
    // clue columns left (bx=-3 = '+' farther, bx=-1 = '−' nearer).
    const clueValue = (value: number) => value === -2 ? null : value >= 0 ? value : null;
    const topClues = Array.from({ length: width }, (_, col) => clueValue(excell[col * 2 + 1]));
    const topMinusClues = Array.from({ length: width }, (_, col) => clueValue(excell[col * 2]));
    const leftClues = Array.from({ length: height }, (_, row) => clueValue(excell[2 * width + row * 2]));
    const leftPlusClues = Array.from({ length: height }, (_, row) => clueValue(excell[2 * width + row * 2 + 1]));

    // --- region borders (base32, MSB-first: vertical row-major, then horizontal) ---
    const verticalCharCount = Math.ceil(height * (width - 1) / 5);
    const horizontalCharCount = Math.ceil((height - 1) * width / 5);
    const borderCharCount = verticalCharCount + horizontalCharCount;
    if (index + borderCharCount > payload.length) return null;
    const verticalBorders = readBase32Bits(payload.slice(index, index + verticalCharCount), height * (width - 1));
    const horizontalBorders = readBase32Bits(payload.slice(index + verticalCharCount, index + borderCharCount), (height - 1) * width);
    if (!verticalBorders || !horizontalBorders) return null;
    index += borderCharCount;

    // --- region pairs (flood fill the domino tiling) ---
    const regionIds = Array.from({ length: height }, () => Array<number>(width).fill(-1));
    let nextRegion = 0;
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        if (regionIds[row][col] !== -1) continue;
        const cells: Array<{ row: number; col: number }> = [];
        const stack = [{ row, col }];
        regionIds[row][col] = nextRegion;
        while (stack.length > 0) {
          const current = stack.pop()!;
          cells.push(current);
          for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
            const nr = current.row + dr;
            const nc = current.col + dc;
            if (nr < 0 || nc < 0 || nr >= height || nc >= width || regionIds[nr][nc] !== -1) continue;
            const blocked = dr === 0
              ? verticalBorders[current.row * (width - 1) + Math.min(current.col, nc)] === 1
              : horizontalBorders[Math.min(current.row, nr) * width + current.col] === 1;
            if (blocked) continue;
            regionIds[nr][nc] = nextRegion;
            stack.push({ row: nr, col: nc });
          }
        }
        nextRegion += 1;
      }
    }
    const regions = Array.from({ length: nextRegion }, () => [] as Array<{ row: number; col: number }>);
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        regions[regionIds[row][col]].push({ row, col });
      }
    }
    if (regions.some((region) => region.length !== 2)) return null;

    // --- optional givens (base27, 3 cells per char) ---
    const givens = Array.from({ length: height }, () => Array<MagnetsPole | null>(width).fill(null));
    const circleCharCount = Math.ceil(width * height / 3);
    if (index + circleCharCount <= payload.length) {
      let cell = 0;
      for (let i = 0; i < circleCharCount; i++) {
        const value = parseInt(payload[index + i], 27);
        if (!Number.isInteger(value)) return null;
        for (const divisor of [9, 3, 1] as const) {
          if (cell >= width * height) break;
          const symbol = Math.floor(value / divisor) % 3;
          if (symbol === 1) givens[Math.floor(cell / width)][cell % width] = '+';
          else if (symbol === 2) givens[Math.floor(cell / width)][cell % width] = '-';
          cell += 1;
        }
      }
      index += circleCharCount;
    }

    return { type: 'magnets', width, height, regions, topClues, topMinusClues, leftClues, leftPlusClues, givens };
  } catch {
    return null;
  }
}

function readBase32Bits(chars: string, bitCount: number): number[] | null {
  const bits: number[] = [];
  for (const char of chars) {
    const value = parseInt(char, 32);
    if (!Number.isFinite(value)) return null;
    for (let bit = 4; bit >= 0 && bits.length < bitCount; bit--) {
      bits.push((value >> bit) & 1);
    }
  }
  return bits.length === bitCount ? bits : null;
}

export function validateMagnets(
  grid: (number | null)[][],
  puzzle: MagnetsPuzzleData
): NumberPlacementValidationResult {
  const badCells = new Set<string>();
  let message: string | undefined;
  const setMessage = (next: string) => { if (!message) message = next; };
  const addLine = (cells: Array<{ row: number; col: number }>) => {
    cells.forEach(({ row, col }) => badCells.add(getCellKey(row, col)));
  };

  // 1. A region must hold either two poles or none.
  for (const region of puzzle.regions) {
    const count = region.filter(({ row, col }) => grid[row]?.[col] === PLUS || grid[row]?.[col] === MINUS).length;
    if (count !== 0 && count !== 2) {
      addLine(region);
      setMessage('每个区域必须恰好放置 2 个或 0 个符号');
    }
  }

  // 2. Orthogonally adjacent cells (even inside a region) cannot hold the
  //    same symbol.
  for (let row = 0; row < puzzle.height; row++) {
    for (let col = 0; col < puzzle.width; col++) {
      const value = grid[row]?.[col] ?? null;
      if (value !== PLUS && value !== MINUS) continue;
      const neighbors = [
        [row, col + 1],
        [row + 1, col],
      ] as const;
      for (const [nr, nc] of neighbors) {
        if (nr >= puzzle.height || nc >= puzzle.width) continue;
        if (grid[nr]?.[nc] === value) {
          badCells.add(getCellKey(row, col));
          badCells.add(getCellKey(nr, nc));
          setMessage('相邻格子不能放置相同符号');
        }
      }
    }
  }

  // 3. The two clue rows above each column give the '+' and '−' counts;
  //    the two clue columns left of each row give the '−' and '+' counts.
  const checkColumn = (col: number, expected: number | null, symbol: number, message: string) => {
    if (expected === null) return;
    let count = 0;
    const cells: Array<{ row: number; col: number }> = [];
    for (let row = 0; row < puzzle.height; row++) {
      if (grid[row]?.[col] === symbol) count += 1;
      cells.push({ row, col });
    }
    if (count !== expected) {
      addLine(cells);
      setMessage(message);
    }
  };
  const checkRow = (row: number, expected: number | null, symbol: number, message: string) => {
    if (expected === null) return;
    let count = 0;
    const cells: Array<{ row: number; col: number }> = [];
    for (let col = 0; col < puzzle.width; col++) {
      if (grid[row]?.[col] === symbol) count += 1;
      cells.push({ row, col });
    }
    if (count !== expected) {
      addLine(cells);
      setMessage(message);
    }
  };
  for (let col = 0; col < puzzle.width; col++) {
    checkColumn(col, puzzle.topClues[col], PLUS, '每列的加号数量与上方数字不符');
    checkColumn(col, puzzle.topMinusClues[col], MINUS, '每列的减号数量与上方数字不符');
  }
  for (let row = 0; row < puzzle.height; row++) {
    checkRow(row, puzzle.leftClues[row], MINUS, '每行的减号数量与左侧数字不符');
    checkRow(row, puzzle.leftPlusClues[row], PLUS, '每行的加号数量与左侧数字不符');
  }

  // 4. Pre-given poles are fixed (the board locks them; guard here as well).
  for (let row = 0; row < puzzle.height; row++) {
    for (let col = 0; col < puzzle.width; col++) {
      const given = puzzle.givens[row]?.[col] ?? null;
      if (!given) continue;
      const expected = given === '+' ? PLUS : MINUS;
      if (grid[row]?.[col] !== expected) {
        badCells.add(getCellKey(row, col));
        setMessage('固定符号不能被修改');
      }
    }
  }

  return {
    valid: !message && badCells.size === 0,
    message,
    badCells: Array.from(badCells, (key) => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    }),
  };
}
