import type { ABCBoxPuzzleData, ABCBoxSymbol } from '../types';
import type { NumberPlacementValidationResult } from '../shared/NumberPlacementBoard';
import { decodeCustomPayload, getCellKey, isPositiveGridSize, parsePuzzLinkParts } from '../gridUtils';

const GIVEN_LETTERS = ['', 'A', 'B', 'C'] as const;

export function parseABCBoxLink(link: string): ABCBoxPuzzleData | null {
  try {
    const parts = parsePuzzLinkParts(link);
    const id = parts[0]?.toLowerCase();
    if (id !== 'abc-box' && id !== 'abcbox') return null;
    const width = Number(parts[1]);
    const height = Number(parts[2]);
    if (!isPositiveGridSize(width, height)) return null;
    // Atol-Solver/pzpr links carry a symbol-count indicator before the
    // payload: abcbox/W/H/<indicator>/<payload>.
    if (parts.length >= 5 && /^\d+$/.test(parts[3] ?? '')) {
      return parsePzprPayload(parts[4] ?? '', width, height);
    }
    return parseCustomPayload(parts[3] ?? '', width, height);
  } catch {
    return null;
  }
}

/**
 * Custom JSON payload: base64url-encoded
 * `{givens, clues: {top, right, bottom, left}}`.
 */
function parseCustomPayload(payload: string, width: number, height: number): ABCBoxPuzzleData | null {
  const decoded = decodeCustomPayload<Partial<ABCBoxPuzzleData>>(payload);
  if (!decoded || !Array.isArray(decoded.givens) || decoded.givens.length !== height || !decoded.clues) return null;
  return { type: 'abc-box', width, height, givens: decoded.givens, clues: decoded.clues };
}

/**
 * One clue symbol from the pzpr abcbox excell stream.  `.` is the `?`
 * symbol, `A`-`C` is a letter, `1`-`9` a group length, `x` an unused
 * padding cell, and `-`/`+`/`=`/`@`/`*`/`$` prefix extended hex lengths.
 * Returns null for a blank padding cell.
 */
function decodeExcellSymbol(payload: string, index: number): { symbol: ABCBoxSymbol | null; nextIndex: number } | null {
  const char = payload[index];
  if (char === undefined) return null;
  if (char === '.') return { symbol: '?', nextIndex: index + 1 };
  if (/^[ABC]$/i.test(char)) return { symbol: char.toUpperCase() as 'A' | 'B' | 'C', nextIndex: index + 1 };
  if (char >= '1' && char <= '9') return { symbol: Number(char), nextIndex: index + 1 };
  if (char === 'x') return { symbol: null, nextIndex: index + 1 };
  const widthDigits = char === '-' ? 2 : char === '+' || char === '=' || char === '@' ? 3 : char === '*' ? 4 : char === '$' ? 5 : 0;
  if (widthDigits === 0) return null;
  const offset = char === '=' ? 4096 : char === '@' ? 8192 : char === '*' ? 12240 : char === '$' ? 77776 : 0;
  const rawHex = payload.slice(index + 1, index + 1 + widthDigits);
  if (!new RegExp(`^[0-9a-f]{${widthDigits}}$`).test(rawHex)) return null;
  const value = parseInt(rawHex, 16) + offset;
  if (!Number.isInteger(value) || value <= 0) return null;
  return { symbol: value, nextIndex: index + 1 + widthDigits };
}

/**
 * PuzzLink-style payload as emitted by the Atol-Solver "abcbox" board: the
 * board stores `height` stacked excell cells above every column
 * (column-major) and `width` stacked cells left of every row (row-major),
 * followed by an optional number16 grid of pre-filled letters (1-3 = A/B/C)
 * that is only written when the puzzle has givens.
 *
 * pzpr lists the stacks with the group adjacent to the grid first.  penpuz
 * renders outside clue stacks with the last entry adjacent to the grid
 * (the Japanese Sums convention), so each stack is reversed here.
 */
function parsePzprPayload(payload: string, width: number, height: number): ABCBoxPuzzleData | null {
  const excellCount = 2 * width * height;
  const top: ABCBoxSymbol[][] = Array.from({ length: width }, () => []);
  const left: ABCBoxSymbol[][] = Array.from({ length: height }, () => []);
  let index = 0;
  for (let e = 0; e < excellCount; e++) {
    const decoded = decodeExcellSymbol(payload, index);
    if (!decoded) return null;
    index = decoded.nextIndex;
    if (decoded.symbol === null) continue;
    if (e < width * height) top[Math.floor(e / height)].push(decoded.symbol);
    else { const n = e - width * height; left[Math.floor(n / width)].push(decoded.symbol); }
  }
  top.forEach((stack) => stack.reverse());
  left.forEach((stack) => stack.reverse());

  const givens: ABCBoxPuzzleData['givens'] = Array.from({ length: height }, () =>
    Array<('A' | 'B' | 'C') | null>(width).fill(null)
  );
  // The givens section is only present when the puzzle has pre-filled
  // letters; a payload that ends after the excell stream means "no givens".
  const hasGivensSection = index < payload.length;
  let cell = 0;
  while (cell < width * height && index < payload.length) {
    const char = payload[index];
    // number16 uses `g`-`z` as run-length skips over empty cells.
    if (char >= 'g' && char <= 'z') {
      cell = Math.min(width * height, cell + parseInt(char, 36) - 15);
      index += 1;
      continue;
    }
    if (!/^[0-9a-f]$/.test(char)) return null;
    const value = parseInt(char, 16);
    if (value >= 1 && value <= 3) givens[Math.floor(cell / width)][cell % width] = GIVEN_LETTERS[value] as 'A' | 'B' | 'C';
    else if (value !== 0) return null;
    cell += 1;
    index += 1;
  }
  if (hasGivensSection && cell !== width * height) return null;

  return {
    type: 'abc-box',
    width,
    height,
    givens,
    clues: {
      top,
      right: Array.from({ length: height }, () => []),
      bottom: Array.from({ length: width }, () => []),
      left,
    },
  };
}

export function validateABCBox(grid: (number | null)[][], puzzle: ABCBoxPuzzleData): NumberPlacementValidationResult {
  const bad = new Set<string>();
  let message: string | undefined;
  const fail = (m: string) => { if (!message) message = m; };
  const markLine = (cells: Array<{ row: number; col: number }>) => {
    cells.forEach(({ row, col }) => bad.add(getCellKey(row, col)));
  };
  const LETTERS = ['', 'A', 'B', 'C'];

  // 1. Every cell must hold exactly one letter from {A, B, C}.
  for (let r = 0; r < puzzle.height; r++) {
    for (let c = 0; c < puzzle.width; c++) {
      const v = grid[r]?.[c];
      if (v !== 1 && v !== 2 && v !== 3) {
        bad.add(getCellKey(r, c));
        fail('每个格子必须填入 A、B 或 C');
      }
    }
  }

  // 2. The outside symbols describe the consecutive same-letter groups in
  // order.  For every side, stack index k holds the (n-1-k)-th grid group
  // (index 0 sits farthest from the grid on left/top, nearest on
  // right/bottom), so the i-th grid group matches stack index n-1-i.
  //  A line is only checked once it is completely filled; partial lines are
  //  already reported by rule 1.
  const checkLine = (
    values: (number | null)[],
    cells: Array<{ row: number; col: number }>,
    clues: ABCBoxSymbol[],
    countMessage: string,
    lengthMessage: string,
    letterMessage: string
  ) => {
    if (!clues.length || values.some((v) => typeof v !== 'number')) return;
    const groups: Array<{ letter: number; length: number }> = [];
    for (const v of values) {
      const letter = v as number;
      const last = groups[groups.length - 1];
      if (last && last.letter === letter) last.length += 1;
      else groups.push({ letter, length: 1 });
    }
    if (groups.length !== clues.length) {
      markLine(cells);
      fail(countMessage);
      return;
    }
    for (let i = 0; i < groups.length; i++) {
      const clue = clues[clues.length - 1 - i];
      if (typeof clue === 'number' && clue !== groups[i].length) {
        markLine(cells);
        fail(lengthMessage);
        return;
      }
      if (typeof clue === 'string' && clue !== '?' && clue !== LETTERS[groups[i].letter]) {
        markLine(cells);
        fail(letterMessage);
        return;
      }
    }
  };

  for (let r = 0; r < puzzle.height; r++) {
    const clues = puzzle.clues.left[r]?.length ? puzzle.clues.left[r] : puzzle.clues.right[r] ?? [];
    checkLine(
      grid[r] ?? [],
      Array.from({ length: puzzle.width }, (_, c) => ({ row: r, col: c })),
      clues,
      '外侧符号数量与行内连续组数量不符',
      '外侧数字与行内连续组长度不符',
      '外侧字母与行内连续组不符'
    );
  }
  for (let c = 0; c < puzzle.width; c++) {
    const clues = puzzle.clues.top[c]?.length ? puzzle.clues.top[c] : puzzle.clues.bottom[c] ?? [];
    checkLine(
      Array.from({ length: puzzle.height }, (_, r) => grid[r]?.[c] ?? null),
      Array.from({ length: puzzle.height }, (_, r) => ({ row: r, col: c })),
      clues,
      '外侧符号数量与列内连续组数量不符',
      '外侧数字与列内连续组长度不符',
      '外侧字母与列内连续组不符'
    );
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
