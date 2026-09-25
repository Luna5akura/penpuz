import type { FourWindsCellValue, FourWindsDirection, FourWindsPuzzleData } from '../types';
import type { NumberPlacementValidationResult } from '../shared/NumberPlacementBoard';
import { getCellKey, isPositiveGridSize, parsePuzzLinkParts } from '../gridUtils';

const DELTAS: Record<FourWindsDirection, [number, number]> = {
  1: [-1, 0],
  2: [0, 1],
  3: [1, 0],
  4: [0, -1],
};

const HEX_NIBBLE = /^[0-9a-f]$/u;

/**
 * Decode the pzprv3 "arrow number16" cell stream used by Four Winds links
 * (the same format produced and consumed by the pzpr build at
 * localhost:8080/p.html):
 *
 *   - 'a'–'z' encodes a run of empty cells ('a' = 1, …, 'z' = 26);
 *   - '+' encodes a question-mark cell;
 *   - a digit 0–4 followed by one hex digit is one cell: the first nibble
 *     is the arrow direction and the second is the number;
 *   - a digit 5–9 followed by two hex digits is one cell: the direction is
 *     the first digit minus 5 (always an answer arrow, never a clue) and
 *     the two hex digits are the number;
 *   - '-' followed by one hex direction digit and three hex digits is one
 *     cell with that direction and a three-hex-digit number (4095 marks an
 *     answer arrow on an empty cell);
 *   - a direction digit followed by '.' marks a non-number cell.
 *
 * Only cells whose direction is 0 carry a clue number.
 */
function decodeFourWindsClues(encoded: string, width: number, height: number) {
  const clues = Array.from({ length: height }, () => Array<number | null>(width).fill(null));
  const cellCount = width * height;
  let cell = 0;
  let index = 0;

  while (index < encoded.length && cell < cellCount) {
    const char = encoded[index];

    if (char >= 'a' && char <= 'z') {
      cell += Number.parseInt(char, 36) - 9;
      index += 1;
      continue;
    }

    if (char === '+') {
      cell += 1;
      index += 1;
      continue;
    }

    if (char >= '0' && char <= '4') {
      const second = encoded[index + 1];
      if (second === undefined) return null;
      if (second === '.') {
        // Direction digit followed by '.': a non-number cell.
        cell += 1;
        index += 2;
        continue;
      }
      if (!HEX_NIBBLE.test(second)) return null;
      if (char === '0') {
        clues[Math.floor(cell / width)][cell % width] = Number.parseInt(second, 16);
      }
      cell += 1;
      index += 2;
      continue;
    }

    if (char >= '5' && char <= '9') {
      // Direction (char − 5) is always 1–4: an answer arrow, not a clue.
      if (!HEX_NIBBLE.test(encoded[index + 1] ?? '') || !HEX_NIBBLE.test(encoded[index + 2] ?? '')) return null;
      cell += 1;
      index += 3;
      continue;
    }

    if (char === '-') {
      const direction = encoded[index + 1];
      const digits = encoded.slice(index + 2, index + 5);
      if (direction === undefined || !HEX_NIBBLE.test(direction) || !/^[0-9a-f]{3}$/u.test(digits)) return null;
      const value = Number.parseInt(digits, 16);
      // 4095 with a drawn direction marks an answer arrow; only a
      // direction-0 cell is a clue.
      if (Number.parseInt(direction, 16) === 0) {
        clues[Math.floor(cell / width)][cell % width] = value;
      }
      cell += 1;
      index += 5;
      continue;
    }

    return null;
  }

  return cell === cellCount && index === encoded.length ? clues : null;
}

export function parseFourWindsLink(link: string): FourWindsPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    if (parts[0]?.toLowerCase() !== 'fourwinds' || parts.length < 4) return null;
    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height)) return null;
    const encoded = parts.slice(3).join('/').replace(/\/+$/u, '');
    if (!encoded) return null;

    const clues = decodeFourWindsClues(encoded, width, height);
    return clues ? { type: 'fourwinds', width, height, clues } : null;
  } catch {
    return null;
  }
}

export function validateFourWinds(
  grid: FourWindsCellValue[][],
  puzzle: FourWindsPuzzleData
): NumberPlacementValidationResult {
  const bad = new Set<string>();
  let message: string | undefined;
  const setMessage = (value: string) => { if (!message) message = value; };
  const starts = new Map<string, number>();

  for (let row = 0; row < puzzle.height; row++) {
    for (let col = 0; col < puzzle.width; col++) {
      const clue = puzzle.clues[row][col];
      const rawValue = grid[row]?.[col] ?? null;
      if (clue !== null) {
        if (rawValue !== null) {
          bad.add(getCellKey(row, col));
          setMessage('数字格不能放置箭头或叉标记');
        }
        continue;
      }
      if (rawValue === null || rawValue === 'cross') {
        bad.add(getCellKey(row, col));
        setMessage(rawValue === 'cross' ? '叉标记不能作为最终答案' : '每个空格都必须画箭头');
        continue;
      }
      if (!Number.isInteger(rawValue) || rawValue < 1 || rawValue > 4) {
        bad.add(getCellKey(row, col));
        setMessage('每个空格都必须画箭头');
        continue;
      }
      const [dr, dc] = DELTAS[rawValue as FourWindsDirection];
      const prevRow = row - dr;
      const prevCol = col - dc;
      // A cell continuing an arrow run whose start was already validated.
      if (
        prevRow >= 0 && prevRow < puzzle.height && prevCol >= 0 && prevCol < puzzle.width &&
        grid[prevRow]?.[prevCol] === rawValue
      ) {
        continue;
      }
      // The first cell of a run must sit on the edge of a numbered cell and
      // point away from it.
      if (
        prevRow < 0 || prevRow >= puzzle.height || prevCol < 0 || prevCol >= puzzle.width ||
        puzzle.clues[prevRow][prevCol] === null
      ) {
        bad.add(getCellKey(row, col));
        setMessage('每条箭头必须从数字格边缘开始');
        continue;
      }
      let length = 0;
      let r = row;
      let c = col;
      while (r >= 0 && r < puzzle.height && c >= 0 && c < puzzle.width && grid[r]?.[c] === rawValue) {
        length++;
        r += dr;
        c += dc;
      }
      const key = getCellKey(prevRow, prevCol);
      starts.set(key, (starts.get(key) ?? 0) + length);
    }
  }

  for (let row = 0; row < puzzle.height; row++) {
    for (let col = 0; col < puzzle.width; col++) {
      const clue = puzzle.clues[row][col];
      if (clue === null) continue;
      if ((starts.get(getCellKey(row, col)) ?? 0) !== clue) {
        bad.add(getCellKey(row, col));
        setMessage('数字格旁箭头的总长度不正确');
      }
    }
  }

  return {
    valid: !message && bad.size === 0,
    message,
    badCells: Array.from(bad, (key) => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    }),
  };
}

/**
 * A clue cell is satisfied when the total length of the arrows that begin at
 * its edge equals the clue value.  The accounting mirrors validateFourWinds:
 * only runs whose first cell sits next to a numbered cell and points away
 * from it count toward that clue.
 */
export function getSatisfiedFourWindsClues(
  grid: FourWindsCellValue[][],
  puzzle: FourWindsPuzzleData
): boolean[][] {
  const satisfied = Array.from({ length: puzzle.height }, () => Array<boolean>(puzzle.width).fill(false));
  const totals = new Map<string, number>();

  for (let row = 0; row < puzzle.height; row++) {
    for (let col = 0; col < puzzle.width; col++) {
      const clue = puzzle.clues[row][col];
      const rawValue = grid[row]?.[col] ?? null;
      if (clue !== null) continue;
      if (rawValue === null || rawValue === 'cross') continue;
      if (!Number.isInteger(rawValue) || rawValue < 1 || rawValue > 4) continue;

      const [dr, dc] = DELTAS[rawValue as FourWindsDirection];
      const prevRow = row - dr;
      const prevCol = col - dc;
      // Only the first cell of an arrow run counts.
      if (
        prevRow >= 0 && prevRow < puzzle.height && prevCol >= 0 && prevCol < puzzle.width &&
        grid[prevRow]?.[prevCol] === rawValue
      ) {
        continue;
      }
      // The run must begin on the edge of a numbered cell.
      if (
        prevRow < 0 || prevRow >= puzzle.height || prevCol < 0 || prevCol >= puzzle.width ||
        puzzle.clues[prevRow][prevCol] === null
      ) {
        continue;
      }

      let length = 0;
      let r = row;
      let c = col;
      while (r >= 0 && r < puzzle.height && c >= 0 && c < puzzle.width && grid[r]?.[c] === rawValue) {
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
